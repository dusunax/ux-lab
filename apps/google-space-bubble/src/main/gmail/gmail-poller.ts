import { EventEmitter } from 'node:events';
import type { BubbleMessage } from '../../shared/types';
import { backoffMs } from '../chat/backoff';
import { classifyGmailError, header, type GmailApiError, type GmailMessage, type ListInboxMessages } from './gmail-client';

const MAX_MESSAGES_PER_POLL = 10;
const SEEN_LIMIT = 200;
const WAITING_AFTER_FAILURES = 3;

type Cursor = { gmailLastMessageId: string; gmailLastMessageInternalDate: string };

export type GmailPollerDeps = {
  listInboxMessages: ListInboxMessages;
  isEnabled: () => boolean;
  getCursor: () => Partial<Cursor>;
  saveCursor: (cursor: Cursor) => void;
  pollIntervalMs: () => number;
  now?: () => number;
  random?: () => number;
};

type Events = {
  messages: [BubbleMessage[]];
  status: [];
  authError: [];
};

export type GmailStatus = 'idle' | 'syncing' | 'ok' | 'waiting' | 'error';

/** Gmail INBOX를 polling해 새 수신 메일을 Bubble로 보낸다. */
export class GmailPoller extends EventEmitter<Events> {
  private timer: NodeJS.Timeout | null = null;
  private started = false;
  private userPaused = false;
  private systemPaused = false;
  private inFlight = false;
  private failures = 0;
  private nextAt = 0;
  private seen: string[] = [];
  private _status: GmailStatus = 'idle';
  private _error: string | undefined;
  private readonly now: () => number;
  private readonly random: () => number;

  constructor(private readonly deps: GmailPollerDeps) {
    super();
    this.now = deps.now ?? Date.now;
    this.random = deps.random ?? Math.random;
  }

  get running(): boolean {
    return this.started && !this.userPaused && !this.systemPaused;
  }

  get waiting(): boolean {
    return this._status === 'waiting' || this.nextAt > this.now();
  }

  get status(): { status: GmailStatus; error?: string } {
    return { status: this._status, error: this._error };
  }

  start(): void {
    this.started = true;
    this.schedule(0);
  }

  stop(): void {
    this.started = false;
    this.clearTimer();
    this._status = 'idle';
    this._error = undefined;
    this.failures = 0;
    this.nextAt = 0;
    this.seen = [];
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

  refresh(): void {
    if (!this.deps.isEnabled()) {
      this.clearTimer();
      this._status = 'idle';
      this._error = undefined;
      this.emit('status');
      return;
    }
    if (this.running && !this.timer && !this.inFlight) this.schedule(0);
  }

  retry(): void {
    this._status = 'syncing';
    this._error = undefined;
    this.failures = 0;
    this.nextAt = 0;
    this.emit('status');
    this.refresh();
  }

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
    if (!this.running || !this.deps.isEnabled()) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.tick();
    }, delayMs);
  }

  private async tick(): Promise<void> {
    if (!this.running || !this.deps.isEnabled()) return;
    const now = this.now();
    if (this.nextAt > now) return this.schedule(this.nextAt - now);

    this.inFlight = true;
    try {
      await this.pollInbox();
    } finally {
      this.inFlight = false;
    }
    this.schedule(Math.max(5000, this.deps.pollIntervalMs()));
  }

  async pollInbox(): Promise<void> {
    try {
      const cursor = this.deps.getCursor();
      if (!cursor.gmailLastMessageInternalDate) await this.initialSync();
      else await this.fetchNew(cursor.gmailLastMessageInternalDate);
      this.onSuccess();
    } catch (e) {
      this.onError(classifyGmailError(e));
    }
  }

  private async initialSync(): Promise<void> {
    this._status = 'syncing';
    this.emit('status');
    const { messages } = await this.deps.listInboxMessages(1);
    const latest = messages[0];
    if (!latest) {
      this.deps.saveCursor({ gmailLastMessageId: '', gmailLastMessageInternalDate: String(this.now()) });
      return;
    }
    this.remember(latest.id);
    this.deps.saveCursor({ gmailLastMessageId: latest.id, gmailLastMessageInternalDate: latest.internalDate });
  }

  private async fetchNew(lastInternalDate: string): Promise<void> {
    const { messages } = await this.deps.listInboxMessages(MAX_MESSAGES_PER_POLL);
    if (messages.length === 0) return;

    const last = Number(lastInternalDate);
    const fresh = messages
      .filter((m) => Number(m.internalDate) > last && !this.seen.includes(m.id))
      .sort((a, b) => Number(a.internalDate) - Number(b.internalDate));

    const newest = messages.reduce((acc, m) => (Number(m.internalDate) > Number(acc.internalDate) ? m : acc), messages[0]);
    if (Number(newest.internalDate) > last) {
      this.deps.saveCursor({ gmailLastMessageId: newest.id, gmailLastMessageInternalDate: newest.internalDate });
    }
    for (const m of messages) this.remember(m.id);

    if (fresh.length > 0) this.emit('messages', fresh.map(toBubble));
  }

  private remember(id: string): void {
    if (!id || this.seen.includes(id)) return;
    this.seen.push(id);
    if (this.seen.length > SEEN_LIMIT) this.seen.shift();
  }

  private onSuccess(): void {
    const changed = this._status !== 'ok' || this.failures > 0;
    this._status = 'ok';
    this._error = undefined;
    this.failures = 0;
    this.nextAt = 0;
    if (changed) this.emit('status');
  }

  private onError(err: GmailApiError): void {
    console.warn(`[gmail-poller] ${err.kind} ${err.status ?? ''} ${err.message}`);
    switch (err.kind) {
      case 'auth':
        this.emit('authError');
        return;
      case 'forbidden':
        this._status = 'error';
        this._error = 'Gmail 읽기 권한이 없습니다. 로그아웃 후 다시 로그인해 주세요.';
        break;
      case 'rateLimit':
      case 'transient':
        this.nextAt = this.now() + backoffMs(this.failures++, this.random);
        if (this.failures >= WAITING_AFTER_FAILURES) this._status = 'waiting';
        break;
    }
    this.emit('status');
  }
}

function toBubble(message: GmailMessage): BubbleMessage {
  const subject = header(message, 'Subject') || '(제목 없음)';
  const sender = header(message, 'From') || '알 수 없는 발신자';
  return {
    kind: 'message',
    source: 'gmail',
    id: `gmail/${message.id}`,
    spaceId: 'gmail',
    spaceName: 'Gmail',
    gmailMessageId: message.id,
    sender,
    text: message.snippet ? `${subject}\n${message.snippet}` : subject,
    createTime: new Date(Number(message.internalDate)).toISOString(),
  };
}
