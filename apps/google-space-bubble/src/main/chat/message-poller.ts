import { EventEmitter } from 'node:events';
import type { BubbleMessage, MonitoredSpace, SpaceStatus } from '../../shared/types';
import { LIMITS } from '../../shared/types';
import { backoffMs } from './backoff';
import { classifyError, type ChatApiError, type ChatMessage, type ListMessages } from './chat-client';

const MAX_PAGES_PER_POLL = 3;
const PAGE_SIZE = 50;
const SEEN_LIMIT = 200;
const WAITING_AFTER_FAILURES = 3;

export type PollerDeps = {
  listMessages: ListMessages;
  /** 현재 등록된 Space 목록 (저장소에서 읽음) */
  getSpaces: () => readonly MonitoredSpace[];
  /** Space의 마지막 처리 메시지 저장 */
  saveCursor: (spaceId: string, cursor: { lastMessageName: string; lastMessageTime: string }) => void;
  /** 알림에서 제외할 본인 계정. 본인 메시지도 알림하면 undefined */
  excludeSelf: () => { userName: string; email: string } | undefined;
  pollIntervalMs: () => number;
  now?: () => number;
  random?: () => number;
};

type Runtime = {
  status: SpaceStatus;
  error?: string;
  failures: number;
  nextAt: number;
  seen: string[]; // 최근 처리한 Message.name (LRU)
};

type Events = {
  messages: [BubbleMessage[]];
  status: [];
  authError: [];
};

/**
 * 등록된 Space를 순차적으로 polling해 새 메시지를 감지한다.
 * - Space별 요청을 polling 주기 안에서 시간차로 분산
 * - 429는 전체 backoff, 5xx/네트워크 오류는 해당 Space만 backoff
 * - 403/404는 해당 Space만 오류 상태로 두고 중지 (다른 Space는 계속)
 */
export class MessagePoller extends EventEmitter<Events> {
  private readonly runtime = new Map<string, Runtime>();
  private timer: NodeJS.Timeout | null = null;
  private cursor = 0;
  private globalFailures = 0;
  private globalPauseUntil = 0;
  private userPaused = false;
  private systemPaused = false;
  private started = false;
  private inFlight = false;
  private readonly now: () => number;
  private readonly random: () => number;

  constructor(private readonly deps: PollerDeps) {
    super();
    this.now = deps.now ?? Date.now;
    this.random = deps.random ?? Math.random;
  }

  // ─── 상태 조회 ────────────────────────────────────────

  get running(): boolean {
    return this.started && !this.userPaused && !this.systemPaused;
  }

  get isUserPaused(): boolean {
    return this.userPaused;
  }

  /** 네트워크 오류로 대기 중인 Space가 있거나 전체 backoff 중이면 true */
  get waiting(): boolean {
    if (this.globalPauseUntil > this.now()) return true;
    return [...this.runtime.values()].some((r) => r.status === 'waiting');
  }

  statusOf(spaceId: string): { status: SpaceStatus; error?: string } {
    const r = this.runtime.get(spaceId);
    return r ? { status: r.status, error: r.error } : { status: 'idle' };
  }

  // ─── 제어 ─────────────────────────────────────────────

  start(): void {
    this.started = true;
    this.schedule(0);
  }

  stop(): void {
    this.started = false;
    this.clearTimer();
    this.runtime.clear();
    this.globalFailures = 0;
    this.globalPauseUntil = 0;
    this.emit('status');
  }

  setUserPaused(paused: boolean): void {
    this.userPaused = paused;
    this.onRunningChanged();
  }

  setSystemPaused(paused: boolean): void {
    this.systemPaused = paused;
    this.onRunningChanged();
  }

  /** Space 추가/삭제/토글 후 호출 */
  refresh(): void {
    const ids = new Set(this.deps.getSpaces().map((s) => s.spaceId));
    for (const id of this.runtime.keys()) if (!ids.has(id)) this.runtime.delete(id);
    this.emit('status');
    if (this.running && !this.timer && !this.inFlight) this.schedule(0);
  }

  /** 오류 상태 Space 재시도 */
  retry(spaceId: string): void {
    this.runtime.delete(spaceId);
    this.refresh();
  }

  // ─── 스케줄링 ─────────────────────────────────────────

  private onRunningChanged(): void {
    if (this.running) this.schedule(0);
    else this.clearTimer();
    this.emit('status');
  }

  private clearTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private schedule(delayMs: number): void {
    this.clearTimer();
    if (!this.running) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.tick();
    }, delayMs);
  }

  /** 활성 Space 수로 polling 주기를 나눈 간격 */
  private slotMs(): number {
    const active = this.activeSpaces().length;
    const interval = Math.max(LIMITS.minPollIntervalSec * 1000, this.deps.pollIntervalMs());
    return Math.max(250, Math.floor(interval / Math.max(1, active)));
  }

  private activeSpaces(): MonitoredSpace[] {
    return this.deps.getSpaces().filter((s) => s.enabled && this.statusOf(s.spaceId).status !== 'error');
  }

  private async tick(): Promise<void> {
    if (!this.running) return;
    const now = this.now();
    if (this.globalPauseUntil > now) return this.schedule(this.globalPauseUntil - now);

    const spaces = this.activeSpaces();
    if (spaces.length === 0) return this.schedule(this.slotMs());

    // round-robin으로 다음 차례 Space 선택 (backoff 중인 Space는 건너뜀)
    let target: MonitoredSpace | undefined;
    for (let i = 0; i < spaces.length; i++) {
      const s = spaces[(this.cursor + i) % spaces.length];
      if ((this.runtime.get(s.spaceId)?.nextAt ?? 0) <= now) {
        target = s;
        this.cursor = (this.cursor + i + 1) % spaces.length;
        break;
      }
    }

    if (target) {
      this.inFlight = true;
      try {
        await this.pollSpace(target.spaceId);
      } finally {
        this.inFlight = false;
      }
    }
    this.schedule(this.slotMs());
  }

  // ─── Polling ──────────────────────────────────────────

  private rt(spaceId: string): Runtime {
    let r = this.runtime.get(spaceId);
    if (!r) {
      r = { status: 'syncing', failures: 0, nextAt: 0, seen: [] };
      this.runtime.set(spaceId, r);
    }
    return r;
  }

  /** 한 Space를 1회 조회한다. 테스트에서 직접 호출할 수 있도록 public. */
  async pollSpace(spaceId: string): Promise<void> {
    const space = this.deps.getSpaces().find((s) => s.spaceId === spaceId);
    if (!space) return;
    const r = this.rt(spaceId);

    try {
      if (!space.lastMessageTime) {
        await this.initialSync(space, r);
      } else {
        await this.fetchNew(space, r);
      }
      this.onSuccess(r);
    } catch (e) {
      this.onError(spaceId, r, classifyError(e));
    }
  }

  /** 최초 동기화: 최신 메시지 1건을 기준점으로 저장하고 알림하지 않는다. */
  private async initialSync(space: MonitoredSpace, r: Runtime): Promise<void> {
    const { messages } = await this.deps.listMessages(space.spaceId, { orderBy: 'createTime desc', pageSize: 1 });
    const latest = messages[0];
    if (latest) {
      this.remember(r, latest.name);
      this.deps.saveCursor(space.spaceId, { lastMessageName: latest.name, lastMessageTime: latest.createTime });
    } else {
      // 빈 Space: 현재 시각을 기준점으로
      this.deps.saveCursor(space.spaceId, { lastMessageName: '', lastMessageTime: new Date(this.now()).toISOString() });
    }
  }

  private async fetchNew(space: MonitoredSpace, r: Runtime): Promise<void> {
    const fetched: ChatMessage[] = [];
    let pageToken: string | undefined;
    for (let page = 0; page < MAX_PAGES_PER_POLL; page++) {
      const res = await this.deps.listMessages(space.spaceId, {
        filter: `createTime > "${space.lastMessageTime}"`,
        orderBy: 'createTime asc',
        pageSize: PAGE_SIZE,
        pageToken,
      });
      fetched.push(...res.messages);
      pageToken = res.nextPageToken;
      if (!pageToken) break;
    }
    if (fetched.length === 0) return;

    const self = this.deps.excludeSelf();
    const fresh = fetched.filter((m) => {
      if (r.seen.includes(m.name)) return false;
      if (m.deletionMetadata) return false;
      if (self && isSelf(m, self)) return false;
      return true;
    });

    for (const m of fetched) this.remember(r, m.name);
    const last = fetched[fetched.length - 1];
    this.deps.saveCursor(space.spaceId, { lastMessageName: last.name, lastMessageTime: last.createTime });

    if (fresh.length === 0) return;
    if (fresh.length > LIMITS.summaryThreshold) {
      this.emit('messages', [
        {
          kind: 'summary',
          id: `${space.spaceId}/summary/${last.name}`,
          spaceId: space.spaceId,
          spaceName: space.spaceName,
          count: fresh.length,
          createTime: last.createTime,
        },
      ]);
    } else {
      this.emit('messages', fresh.map((m) => toBubble(space, m)));
    }
  }

  private remember(r: Runtime, name: string): void {
    if (!name || r.seen.includes(name)) return;
    r.seen.push(name);
    if (r.seen.length > SEEN_LIMIT) r.seen.shift();
  }

  private onSuccess(r: Runtime): void {
    const changed = r.status !== 'ok' || r.failures > 0;
    r.status = 'ok';
    r.error = undefined;
    r.failures = 0;
    r.nextAt = 0;
    this.globalFailures = 0;
    if (changed) this.emit('status');
  }

  private onError(spaceId: string, r: Runtime, err: ChatApiError): void {
    console.warn(`[poller] ${spaceId} ${err.kind} ${err.status ?? ''} ${err.message}`);
    switch (err.kind) {
      case 'auth':
        this.emit('authError');
        return;
      case 'forbidden':
        r.status = 'error';
        r.error = err.status === 404 ? 'Space를 찾을 수 없습니다.' : '이 Space에 접근할 수 없습니다.';
        break;
      case 'rateLimit':
        // 프로젝트 전체 quota일 수 있으므로 모든 Space를 늦춘다.
        this.globalPauseUntil = this.now() + backoffMs(this.globalFailures++, this.random);
        break;
      case 'transient':
        r.nextAt = this.now() + backoffMs(r.failures++, this.random);
        if (r.failures >= WAITING_AFTER_FAILURES) r.status = 'waiting';
        break;
    }
    this.emit('status');
  }
}

function isSelf(m: ChatMessage, self: { userName: string; email: string }): boolean {
  if (m.sender?.name && m.sender.name === self.userName) return true;
  return m.sender?.type === 'HUMAN' && !!m.sender.email && m.sender.email === self.email;
}

function toBubble(space: MonitoredSpace, m: ChatMessage): BubbleMessage {
  const sender = m.sender?.displayName || (m.sender?.type === 'BOT' ? '봇' : '알 수 없는 사용자');
  const text = (m.text || m.fallbackText || '').trim() || '(내용 없음)';
  return {
    kind: 'message',
    id: m.name,
    spaceId: space.spaceId,
    spaceName: space.spaceName,
    sender,
    text,
    createTime: m.createTime,
  };
}
