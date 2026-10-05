import { EventEmitter } from 'node:events';
import {
  CHORDS, LIMITS, emptyMemory, today,
  type ActEvent, type BodyState, type CortexOutput, type Emotion, type EngineId, type LogLine, type LogTag, type Memory, type Motion,
  type Signal, type Usage,
} from '../../shared/state';
import type { Budget } from './decide/freeRouter';
import { thinkWith, type EngineHooks, type Engines, type ThinkResult } from './engines';
import { instinctThink } from './instinct';
import type { MindContext } from './mind';
import { ESCALATE_AT, describe, reflex } from './reflex';

const HOLD_MS = 5200;
const TICK_MS = 1000;
const ENERGY_DECAY_PER_TICK = 0.004;
const SLEEP_BELOW = 0.22;
const SELF_THINK_AFTER_MS = 25_000;
const QUEUE_MAX = 3;
/** 말이 늦게 올 때, 반응 동작을 이만큼 보여 준 뒤 생각 동작으로 바꿔 기다린다 */
const REACT_BEFORE_PONDER_MS = 1200;
/**
 * 대화 창. 이름을 부르면(또는 글로 말 걸면) 시작하고, 주고받을 때마다 IDLE만큼 늘어난다.
 * 다만 시작 후 MAX가 지나면 무조건 끝난다 — 주변 말에 계속 대답하며 대화가 끝없이 이어지지 않게. 다시 이름을 부르면 새로 시작.
 */
const CONVERSATION_IDLE_MS = 60_000;
const CONVERSATION_MAX_MS = 180_000;
/** 말소리로 생각을 멈춘 뒤 귀 기울이는 자세를 유지하는 시간 */
const LISTEN_HOLD_MS = 2500;

interface BrainEvents {
  body: [BodyState];
  log: [LogLine];
  act: [ActEvent];
  cortex: [CortexOutput];
  memory: [Memory];
  usage: [Usage];
}

/** 무료 호출은 아껴 쓴다: 친구가 터피에게 직접 건넨 말만 LLM으로 판단한다 */
const wantsLlm = (s: Signal) => s.kind === 'text' || s.kind === 'name-call' || (s.kind === 'speech' && !!s.addressed);

export interface BrainOptions {
  /** 하루 무료 LLM 호출 상한 */
  dailyBudget: number;
  /** 하루 jev 비용 상한(USD). 넘으면 무료 LLM으로 내려간다 */
  paidCapUsd: number;
}

/**
 * Tuffy의 뇌. reflex(룰, 즉시) → salience ≥ 0.5이면 cortex(LLM) → act.
 * 상태값(emotion/motion)만 내보내고, 그리는 일은 device renderer가 한다.
 */
export class Brain extends EventEmitter<BrainEvents> {
  private body: BodyState = { emotion: 'calm', motion: 'idle', energy: 0.9, turns: 0, thinking: false };
  private memory: Memory = emptyMemory();
  private queue: Signal[] = [];
  private busy = false;
  private holdUntil = 0;
  private lastInputAt = Date.now();
  private lastSelfAt = Date.now();
  private conversationUntil = 0;
  private conversationStartedAt = 0;
  /** 지금 하는 생각(LLM·jev 요청)을 멈추는 스위치. 친구가 다시 말하기 시작하면 당긴다 */
  private thinkAbort: AbortController | null = null;
  private timer: NodeJS.Timeout | null = null;
  private history: LogLine[] = [];
  private last: CortexOutput | null = null;
  activeApp: string | null = null;
  private engines: Engines = { free: null, voice: null, jev: null, jevKey: () => null };

  constructor(private readonly opts: BrainOptions) {
    super();
  }

  /** 무료 호출 예산. 기억(localStorage)에 날짜별로 남아 재시작해도 이어진다 */
  readonly budget: Budget = {
    remaining: () => {
      this.rollDay();
      return this.opts.dailyBudget - this.memory.llmCalls;
    },
    spend: () => {
      this.rollDay();
      this.memory = { ...this.memory, llmCalls: this.memory.llmCalls + 1 };
      this.saveMemory();
    },
  };

  private readonly hooks: EngineHooks = {
    log: (text) => this.log('CORTEX', text, { dim: true }),
    freeLeft: () => this.budget.remaining(),
    paidLeftUsd: () => {
      this.rollDay();
      return this.opts.paidCapUsd - this.memory.paidUsd;
    },
    spendPaid: (usd) => {
      this.rollDay();
      this.memory = { ...this.memory, paidUsd: this.memory.paidUsd + usd };
      this.saveMemory();
    },
  };

  setEngines(engines: Engines): void {
    this.engines = engines;
  }

  get usage(): Usage {
    this.rollDay();
    return {
      engine: this.memory.engine,
      jevAvailable: !!this.engines.jev && this.engines.jevKey() !== null,
      jevKey: this.engines.jevKey(),
      paidUsd: this.memory.paidUsd,
      paidCapUsd: this.opts.paidCapUsd,
      freeCalls: this.memory.llmCalls,
      freeBudget: this.opts.dailyBudget,
    };
  }

  /** 콘솔에서 고른 판단 엔진. 기억에 저장해 다음 실행에도 이어진다 */
  setEngine(engine: EngineId): void {
    if (engine === 'jev' && !this.usage.jevAvailable) return;
    if (engine === this.memory.engine) return;
    this.memory = { ...this.memory, engine };
    this.log('SELF', `판단 엔진 → ${engine === 'jev' ? `jev (유료, 하루 $${this.opts.paidCapUsd} 상한)` : '무료 LLM'}`);
    this.saveMemory();
  }

  /** TypeSafe 키가 바뀌었을 때. 키가 사라졌는데 jev를 쓰던 중이면 무료 LLM으로 돌린다 */
  keyChanged(): void {
    const u = this.usage;
    this.log('SELF', `TypeSafe 키 ${u.jevKey ? '등록됨' : '삭제됨'}`);
    if (!u.jevAvailable && this.memory.engine === 'jev') this.setEngine('free');
    this.emit('usage', this.usage);
  }

  private saveMemory(): void {
    this.emit('memory', { ...this.memory });
    this.emit('usage', this.usage);
  }
  get snapshot() { return { body: this.bodyState(), logs: [...this.history], lastCortex: this.last }; }

  start(): void {
    const u = this.usage;
    this.log('SELF', `boot · reflex=rules · 엔진=${u.engine} · 무료 호출 ${u.freeCalls}/${u.freeBudget} · jev $${u.paidUsd.toFixed(4)}/$${u.paidCapUsd} · escalate≥${ESCALATE_AT.toFixed(2)}`);
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  loadMemory(m: Memory): void {
    this.memory = m;
    this.body = { ...this.body, turns: m.turns };
    const awayMin = Math.round((Date.now() - m.lastSeenAt) / 60_000);
    this.log('SELF', `기억 로드 · 오늘 대화 ${m.turns}회 · 최근 ${m.recent.length}줄 · 마지막 만남 ${awayMin}분 전`);
    this.emit('body', this.bodyState());
    this.emit('usage', this.usage);
  }

  sense(input: Signal): void {
    const sig = this.withConversation(input);
    if (sig.kind !== 'self') this.wakeIfSleeping();
    this.log(sig.kind === 'self' ? 'SELF' : 'SENSE', describe(sig));
    if (sig.kind === 'text' || (sig.kind === 'speech' && sig.addressed)) this.remember('friend', sig.text ?? '');
    // 이름을 부르거나 글로 말 걸면 대화를 새로 시작, 대화 창 안에서 이름 없이 한 말은 이어 가기만 한다
    if (input.kind === 'text' || input.kind === 'name-call' || input.addressed) this.openConversation(true);
    else if (sig.addressed) this.openConversation(false);

    const r = reflex(sig);
    if (r.energy) this.body.energy = Math.max(0, this.body.energy + r.energy);
    this.log('REFLEX', `${r.note} · salience ${r.salience.toFixed(2)}`);
    const escalate = r.salience >= ESCALATE_AT;
    // 생각 중(LLM 대기)에는 반사가 생각 동작을 덮지 않는다. 로그로만 남긴다
    if (!this.body.thinking) this.setBody({ emotion: r.emotion, motion: r.motion }, escalate ? 900 : 3500);

    if (!escalate) {
      this.log('CORTEX', `skip (${r.salience.toFixed(2)} < ${ESCALATE_AT.toFixed(2)}) · 반사만으로 충분`, { dim: true });
      return;
    }
    if (this.queue.length >= QUEUE_MAX) {
      this.log('CORTEX', '대기열 가득 → 버림', { dim: true });
      return;
    }
    this.queue.push(sig);
    if (this.busy) this.log('CORTEX', `busy → 대기열 ${this.queue.length}`, { dim: true });
    else void this.drain();
  }

  get inConversation(): boolean {
    return Date.now() < this.conversationUntil;
  }

  /** 친구가 다시 말하기 시작함(마이크 말소리 시작). 하던 생각을 멈추고 듣는다 */
  interrupt(reason: string): void {
    if (!this.thinkAbort || this.thinkAbort.signal.aborted) return;
    this.thinkAbort.abort();
    this.queue = [];
    this.log('REFLEX', `${reason} → 생각 멈추고 듣기`);
  }

  private openConversation(restart: boolean): void {
    const now = Date.now();
    if (restart || now >= this.conversationUntil) this.conversationStartedAt = now;
    this.conversationUntil = Math.min(now + CONVERSATION_IDLE_MS, this.conversationStartedAt + CONVERSATION_MAX_MS);
  }

  /** 대화 창이 막 닫혔으면 기록하고 닫는다 */
  private closeConversationIfDue(now: number): void {
    if (!this.conversationUntil || now < this.conversationUntil) return;
    const sec = Math.round((now - this.conversationStartedAt) / 1000);
    const capped = now - this.conversationStartedAt >= CONVERSATION_MAX_MS;
    this.log('SELF', `대화 끝 · ${Math.floor(sec / 60)}분 ${sec % 60}초${capped ? ' (최대 시간)' : ' (조용함)'} · 다시 부르면 시작`, { dim: true });
    this.conversationUntil = 0;
    this.emit('body', this.bodyState());
  }

  private bodyState(): BodyState {
    return { ...this.body, listeningUntil: this.conversationUntil };
  }

  /** 생각을 멈춘 뒤: 생각 점을 끄고 귀 기울이는 자세로, 대화는 이어 간다 */
  private listen(): void {
    this.body.thinking = false;
    this.openConversation(false);
    this.setBody({ motion: 'perk' }, LISTEN_HOLD_MS);
  }

  /** 감각기(whisper 등)의 상태를 로그에 남긴다 */
  note(text: string): void {
    this.log('SELF', text, { dim: true });
  }

  private withConversation(sig: Signal): Signal {
    if (sig.kind !== 'speech' || sig.addressed || Date.now() >= this.conversationUntil) return sig;
    return { ...sig, addressed: true };
  }

  private wakeIfSleeping(): void {
    this.lastInputAt = Date.now();
    if (this.body.emotion !== 'sleepy') return;
    this.body.energy = Math.min(1, this.body.energy + 0.35);
    this.log('REFLEX', '수면 중 입력 → 기상');
    this.setBody({ emotion: 'calm', motion: 'perk' }, 900);
  }

  private async drain(): Promise<void> {
    this.busy = true;
    for (let sig = this.queue.shift(); sig; sig = this.queue.shift()) {
      await this.think(sig);
    }
    this.busy = false;
  }

  private async think(sig: Signal): Promise<void> {
    const ctrl = new AbortController();
    this.thinkAbort = ctrl;
    try {
      this.body.thinking = true;
      this.setBody({ motion: 'think' }, 60_000);
      const ctx: MindContext = { signal: sig, body: { ...this.body }, memory: this.memory, activeApp: this.activeApp, now: new Date() };
      const { out, pendingSay } = await this.consult(ctx, ctrl.signal);
      if (ctrl.signal.aborted) return this.listen();
      // 사고 로그는 콘솔이 타자 치듯 따라 쓰고, 몸은 기다리지 않고 바로 움직인다
      for (const line of out.thought) this.log('CORTEX', line, { typing: true });
      this.body.thinking = !!pendingSay;
      this.last = out;
      this.emit('cortex', out);
      this.act(out, !!pendingSay);
      if (!pendingSay) return;
      // 무료 LLM이 말을 쓰는 동안: 반응을 잠깐 보여 준 뒤 생각 동작 + 생각 점으로 기다린다
      const ponder = setTimeout(() => this.setBody({ motion: 'think' }, 60_000), REACT_BEFORE_PONDER_MS);
      const say = await pendingSay;
      clearTimeout(ponder);
      if (ctrl.signal.aborted || say === null) return this.listen();
      this.body.thinking = false;
      this.setBody({ motion: out.motion });
      this.speakLate(out, say);
    } finally {
      this.thinkAbort = null;
    }
  }

  /** 몸은 이미 반응했고, 늦게 도착한 말만 띄운다 (화음·음표 없이) */
  private speakLate(out: CortexOutput, say: string): void {
    this.last = { ...out, say };
    if (out.source !== 'self') this.remember('tuffy', say);
    this.log('ACT', `say "${say}"`);
    this.emit('body', this.bodyState());
    this.emit('act', { say, emotion: out.emotion, intensity: out.intensity, speechOnly: true });
  }

  private async consult(ctx: MindContext, signal: AbortSignal): Promise<ThinkResult> {
    if (wantsLlm(ctx.signal)) {
      const u = this.usage;
      this.log('CORTEX', `decide(MIND) · 엔진 ${u.engine} · 무료 ${u.freeCalls}/${u.freeBudget} · jev $${u.paidUsd.toFixed(4)}`, { dim: true });
      const out = await thinkWith(this.memory.engine, ctx, this.engines, this.hooks, signal);
      if (out) return out;
      if (signal.aborted) return { out: instinctThink(ctx) };
      this.log('CORTEX', '본능 판단 · 쓸 수 있는 엔진 없음', { dim: true });
    } else {
      this.log('CORTEX', '본능 판단 · LLM 아낌 (친구가 건넨 말 아님)', { dim: true });
    }
    return { out: instinctThink(ctx) };
  }

  private act(out: CortexOutput, sayPending = false): void {
    if (out.source !== 'self') {
      this.rollDay();
      this.memory.turns += 1;
      this.body.turns = this.memory.turns;
    }
    // 혼잣말은 대화 기억에 넣지 않는다 (최근 대화 맥락이 혼잣말로 밀려나지 않게)
    if (out.say && out.source !== 'self') this.remember('tuffy', out.say);
    if (out.source !== 'self') this.openConversation(false);
    this.body.energy = Math.min(1, this.body.energy + 0.08);
    this.setBody({ emotion: out.emotion, motion: out.motion });
    this.log('ACT', `${out.say ? `say "${out.say}" · ` : sayPending ? '' : '몸짓만 · '}chord ${CHORDS[out.emotion].name} · intensity ${out.intensity.toFixed(2)}`);
    this.emit('act', { say: out.say, emotion: out.emotion, intensity: out.intensity });
  }

  private remember(from: 'friend' | 'tuffy', text: string): void {
    if (!text) return;
    this.rollDay();
    this.memory = {
      ...this.memory,
      recent: [...this.memory.recent, { from, text: text.slice(0, LIMITS.textMax) }].slice(-LIMITS.recentMax),
      lastSeenAt: Date.now(),
    };
    this.saveMemory();
  }

  /** 날짜가 바뀌면 하루 단위 값(대화 수·무료 호출 수·jev 비용)을 0으로 (앱을 켜 둔 채 자정을 넘겨도) */
  private rollDay(): void {
    const d = today();
    if (this.memory.day !== d) this.memory = { ...this.memory, day: d, turns: 0, llmCalls: 0, paidUsd: 0 };
  }

  private tick(): void {
    this.body.energy = Math.max(0, this.body.energy - ENERGY_DECAY_PER_TICK);
    this.closeConversationIfDue(Date.now());
    if (this.busy) return;
    const now = Date.now();
    if (this.body.energy < SLEEP_BELOW && this.body.emotion !== 'sleepy') {
      this.log('SELF', `energy ${Math.round(this.body.energy * 100)}% 임계 미만`);
      this.log('REFLEX', '저전력 → 몸 말기 (cortex 생략)');
      this.setBody({ emotion: 'sleepy', motion: 'curl' }, 0);
      this.emit('act', { say: '졸려… 잠깐 잘게.', emotion: 'sleepy', intensity: 0.2 });
      return;
    }
    if (this.body.emotion !== 'sleepy' && now - this.lastInputAt > SELF_THINK_AFTER_MS && now - this.lastSelfAt > SELF_THINK_AFTER_MS) {
      this.lastSelfAt = now;
      this.sense({ kind: 'self' });
      return;
    }
    const base: Motion = this.body.emotion === 'sleepy' ? 'curl' : 'idle';
    if (now > this.holdUntil && this.body.motion !== base) this.setBody({ motion: base }, 0);
    else this.emit('body', this.bodyState());
  }

  private setBody(next: { emotion?: Emotion; motion?: Motion }, hold = HOLD_MS): void {
    const emotion = next.emotion ?? this.body.emotion;
    const motion = next.motion ?? this.body.motion;
    const diff: string[] = [];
    if (emotion !== this.body.emotion) diff.push(`emotion ${this.body.emotion}→${emotion}`);
    if (motion !== this.body.motion) diff.push(`motion ${this.body.motion}→${motion}`);
    this.body = { ...this.body, emotion, motion };
    this.holdUntil = Date.now() + hold;
    if (diff.length) this.log('STATE', diff.join(' · '));
    this.emit('body', this.bodyState());
  }

  private log(tag: LogTag, text: string, opts: { dim?: boolean; typing?: boolean } = {}): void {
    const line: LogLine = { at: Date.now(), tag, text, ...opts };
    this.history = [...this.history.slice(-139), line];
    this.emit('log', line);
  }
}
