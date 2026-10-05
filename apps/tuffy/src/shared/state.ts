/** Tuffy의 상태 어휘. 뇌(main)와 몸(device renderer), 콘솔이 같은 계약을 공유한다. */

export const EMOTIONS = ['calm', 'curious', 'amaze', 'worried', 'sleepy', 'focus'] as const;
export type Emotion = (typeof EMOTIONS)[number];

export const MOTIONS = ['idle', 'perk', 'think', 'bounce', 'scuttle', 'wave', 'shiver', 'curl'] as const;
export type Motion = (typeof MOTIONS)[number];

/** 입력 신호 (OQ-4 확정 범위). speech·name-call은 로컬 STT(OQ-5) 연결 전까지 콘솔 시뮬레이션으로만 들어온다. */
export const SIGNAL_KINDS = ['text', 'speech', 'name-call', 'hum', 'loud', 'app', 'clock', 'idle', 'return', 'self'] as const;
export type SignalKind = (typeof SIGNAL_KINDS)[number];

export interface Signal {
  kind: SignalKind;
  text?: string;
  hz?: number;
  app?: string;
  hour?: number;
  awaySec?: number;
  /** speech가 터피에게 한 말인지 (이름을 불렀거나 대화 창 안) */
  addressed?: boolean;
}

/** Tuffy의 목소리 = 화음. 감정마다 하나씩 */
export const CHORDS: Record<Emotion, { name: string; hz: number[] }> = {
  calm: { name: 'Cmaj7', hz: [261.6, 329.6, 392, 493.9] },
  curious: { name: 'Dsus4↑', hz: [293.7, 392, 440] },
  amaze: { name: 'C↑↑', hz: [523.3, 659.3, 784, 1046.5] },
  worried: { name: 'Am', hz: [220, 261.6, 329.6] },
  sleepy: { name: 'G5↓', hz: [196, 146.8] },
  focus: { name: 'F5', hz: [349.2, 523.8] },
};

export const EMOTION_KO: Record<Emotion, string> = {
  calm: '평온', curious: '궁금', amaze: '신남', worried: '걱정', sleepy: '졸림', focus: '집중',
};

/** jev 형식 판단의 근거 (콘솔 확률 막대용) */
export interface Decision {
  engine: string;
  appraisal: { concern: number; joy: number; curiosity: number };
  emotion: Record<Emotion, number>;
  motion: Record<Motion, number>;
  speak: number;
}

export interface CortexOutput {
  source: SignalKind;
  thought: string[];
  emotion: Emotion;
  motion: Motion;
  intensity: number;
  /** 몸짓만 할 때는 null */
  say: string | null;
  /** 본능(로컬) 결정이면 없다 */
  decision?: Decision;
}

export interface BodyState {
  emotion: Emotion;
  motion: Motion;
  energy: number;
  turns: number;
  thinking: boolean;
  /** 대화가 이어지는 시각(epoch ms). 이 전까지는 이름 없이 말해도 터피에게 한 말로 받는다. 0이면 대화 아님 */
  listeningUntil?: number;
}

export const LOG_TAGS = ['SENSE', 'REFLEX', 'CORTEX', 'ACT', 'STATE', 'SELF'] as const;
export type LogTag = (typeof LOG_TAGS)[number];

export interface LogLine {
  at: number;
  tag: LogTag;
  text: string;
  dim?: boolean;
  /** 콘솔이 타자 치듯 출력할 줄 (cortex 사고 과정) */
  typing?: boolean;
}

export interface ActEvent {
  say: string | null;
  /** 몸은 이미 반응했고 말만 늦게 도착했을 때. 화음·음표 없이 글자만 띄운다 */
  speechOnly?: boolean;
  emotion: Emotion;
  intensity: number;
}

/** 판단 엔진. free = 무료 LLM, jev = OpenRouter Decisions(유료) */
export const ENGINES = ['free', 'jev'] as const;
export type EngineId = (typeof ENGINES)[number];
export const isEngine = (v: unknown): v is EngineId => v === 'free' || v === 'jev';

/** 콘솔에 보이는 엔진·사용량 */
export interface Usage {
  engine: EngineId;
  jevAvailable: boolean;
  /** TypeSafe 키 출처 (값은 보내지 않는다) */
  jevKey: 'env' | 'stored' | null;
  paidUsd: number;
  paidCapUsd: number;
  freeCalls: number;
  freeBudget: number;
}

export interface Memory {
  /** YYYY-MM-DD, 날짜가 바뀌면 turns를 초기화한다 */
  day: string;
  turns: number;
  /** 오늘 쓴 무료 LLM 호출 수 (무료 등급의 하루 한도를 지키기 위해) */
  llmCalls: number;
  /** 오늘 jev에 쓴 금액(USD, 응답의 usage.cost 합) */
  paidUsd: number;
  /** 사용자가 고른 판단 엔진 (날짜와 무관하게 유지) */
  engine: EngineId;
  recent: { from: 'friend' | 'tuffy'; text: string }[];
  lastSeenAt: number;
}

/** 마이크 음성 구간 규격. device가 이 샘플레이트로 잘라 main(whisper)에 보낸다 */
export const SPEECH = {
  sampleRate: 16_000,
  minSec: 0.4,
  maxSec: 10,
} as const;

/** 마이크 판단 기준(dBFS). device가 쓰고, 콘솔 진단 미터가 같은 선을 그린다 */
export const MIC_DBFS = {
  pitch: -45,
  speech: -42,
  loud: -10,
} as const;

export const LIMITS = {
  textMax: 140,
  recentMax: 8,
} as const;

const isOneOf = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === 'string' && (list as readonly string[]).includes(v);

export const isEmotion = (v: unknown): v is Emotion => isOneOf(EMOTIONS, v);
export const isMotion = (v: unknown): v is Motion => isOneOf(MOTIONS, v);
export const isSignalKind = (v: unknown): v is SignalKind => isOneOf(SIGNAL_KINDS, v);

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export const today = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

export const emptyMemory = (now = new Date()): Memory => ({
  day: today(now), turns: 0, llmCalls: 0, paidUsd: 0, engine: 'free', recent: [], lastSeenAt: now.getTime(),
});

/** localStorage에서 온 값은 신뢰하지 않는다 */
export function sanitizeMemory(v: unknown, now = new Date()): Memory {
  if (typeof v !== 'object' || v === null) return emptyMemory(now);
  const o = v as Record<string, unknown>;
  const day = typeof o.day === 'string' ? o.day : '';
  const sameDay = day === today(now);
  const recent = Array.isArray(o.recent)
    ? o.recent
        .filter((r): r is { from: 'friend' | 'tuffy'; text: string } =>
          typeof r === 'object' && r !== null &&
          ((r as { from?: unknown }).from === 'friend' || (r as { from?: unknown }).from === 'tuffy') &&
          typeof (r as { text?: unknown }).text === 'string')
        .map((r) => ({ from: r.from, text: r.text.slice(0, LIMITS.textMax) }))
        .slice(-LIMITS.recentMax)
    : [];
  return {
    day: today(now),
    turns: sameDay && typeof o.turns === 'number' && o.turns >= 0 ? Math.floor(o.turns) : 0,
    llmCalls: sameDay && typeof o.llmCalls === 'number' && o.llmCalls >= 0 ? Math.floor(o.llmCalls) : 0,
    paidUsd: sameDay && typeof o.paidUsd === 'number' && Number.isFinite(o.paidUsd) && o.paidUsd >= 0 ? o.paidUsd : 0,
    engine: isEngine(o.engine) ? o.engine : 'free',
    recent,
    lastSeenAt: typeof o.lastSeenAt === 'number' ? o.lastSeenAt : now.getTime(),
  };
}

/** renderer에서 온 신호를 검증한다. 허용 필드만 남긴다 */
export function sanitizeSignal(v: unknown): Signal | null {
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  if (!isSignalKind(o.kind)) return null;
  const sig: Signal = { kind: o.kind };
  const text = str(o.text, LIMITS.textMax);
  if (text) sig.text = text;
  if (typeof o.hz === 'number' && o.hz > 20 && o.hz < 4000) sig.hz = Math.round(o.hz);
  if ((o.kind === 'text' || o.kind === 'speech') && !sig.text) return null;
  return sig;
}
