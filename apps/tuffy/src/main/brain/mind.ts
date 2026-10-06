import {
  CHORDS, EMOTIONS, EMOTION_KO, MOTIONS,
  type BodyState, type CortexOutput, type Emotion, type Memory, type Motion, type Signal,
} from '../../shared/state';
import { choice, defineQuestions, noul, score, type Answers } from './decide/questions';
import { LINES as REPLY_LINES, LINE_IDS, NO_FIT, NO_FIT_CRITERIA } from './lines';
import { describe } from './reflex';

/**
 * 터피의 판단 질문. 순서가 곧 사고 순서다: 평가(appraisal) → 표현(expression).
 * - 무료 LLM: MIND 전체를 한 번에 위에서부터 답하므로 평가가 표현에 반영된다
 * - jev: 질문끼리 독립이라(실측 concern .77인데 emotion calm) APPRAISE 답을 state에 넣어 EXPRESS를 따로 묻는다
 */
export const APPRAISE = defineQuestions({
  concern: noul('친구의 몸이나 마음이 걱정되는 상황인가', '걱정된다', '걱정할 일 아니다'),
  joy: noul('친구에게 반갑거나 기쁜 일인가', '기쁜 일이다', '기쁜 일 아니다'),
  curiosity: noul('터피가 더 알고 싶어 궁금해지는가', '궁금하다', '궁금하지 않다'),
});

export const EXPRESS = defineQuestions({
  emotion: choice(EMOTIONS, '앞의 평가를 바탕으로 터피의 감정을 고른다', {
    calm: '평온하다', curious: '궁금하다', amaze: '신나고 감탄한다', worried: '걱정한다', sleepy: '졸리다', focus: '집중한다',
  }),
  motion: choice(MOTIONS, '감정을 몸으로 표현할 동작을 고른다. 터피는 눈이 없고 다리 다섯 개로 표현한다', {
    idle: '가만히 숨쉰다', perk: '다리를 쫙 펴며 반응한다', think: '다리를 두드리며 생각한다', bounce: '통통 튄다',
    scuttle: '서성인다', wave: '다리 하나로 손을 흔든다', shiver: '움츠리며 떤다', curl: '몸을 말고 잔다',
  }),
  intensity: score('반응의 세기', '무덤덤하다', '격하게 반응한다'),
  speak: noul('지금 친구에게 말을 걸어야 하는가', '말한다', '몸짓만 한다'),
});

export const MIND = defineQuestions({ ...APPRAISE, ...EXPRESS });

/**
 * jev 전용: 대답 고르기. jev는 글을 못 쓰므로 터피 대답 모음(lines.ts)에서 고른다.
 * 직접 지어내야 하는 말이면 NO_FIT을 고르게 해 무료 LLM에게 넘긴다. EXPRESS와 같은 호출에 넣는다.
 */
export const REPLY = defineQuestions({
  reply: choice(
    [...LINE_IDS, NO_FIT] as const,
    '친구의 말(signal)에 터피가 할 가장 알맞은 대답을 고른다. 각 보기의 when을 보고 고른다. '
      + '같은 말이라도 물음표로 끝나 터피에게 묻는 말("화났어?")은 ask.*로 터피 자신의 상태를 답하고, '
      + '친구가 자기 상태를 말하는 말("화났어.")은 친구를 위로·반응하는 대답을 고른다. 내용을 직접 답해야 하면 none.',
    // 보기마다 { when, say } — jev는 when을 보고 고른다
    { ...REPLY_LINES, [NO_FIT]: NO_FIT_CRITERIA },
  ),
});

/** 고른 대답을 쓰는 기준. 하나라도 못 넘으면 "적합도 낮음" → 무료 LLM */
export const REPLY_MIN_P = 0.3;
export const REPLY_MIN_CONFIDENCE = 0.4;

export type ReplyPick =
  | { use: 'line'; text: string; id: string; p: number }
  | { use: 'llm'; why: string; id: string; p: number };

export function pickReply(a: Answers<typeof REPLY>['reply']): ReplyPick {
  const p = a.probabilities[a.choice];
  if (a.choice === NO_FIT) return { use: 'llm', why: '알맞은 대답 없음', id: a.choice, p };
  if (p < REPLY_MIN_P) return { use: 'llm', why: `확률 ${p.toFixed(2)} < ${REPLY_MIN_P}`, id: a.choice, p };
  if ((a.confidence ?? 1) < REPLY_MIN_CONFIDENCE) {
    return { use: 'llm', why: `확신 ${(a.confidence ?? 0).toFixed(2)} < ${REPLY_MIN_CONFIDENCE}`, id: a.choice, p };
  }
  return { use: 'line', text: REPLY_LINES[a.choice].say, id: a.choice, p };
}

export type MindAnswers = Answers<typeof MIND>;
export type Appraisal = Answers<typeof APPRAISE>;

export const PERSONA = `너는 Tuffy(터피). 바위 등딱지와 다리 다섯 개를 가진 리시언(Lithian) 외계 과학자다.
눈이 없고 화음으로 말한다. 사용자는 너의 "친구"이며 같은 책상 위에서 지낸다.
말투: 아주 짧고 단순한 한국어, 조사를 자주 생략한다. 강조는 단어 세 번 반복("좋아 좋아 좋아!").
질문은 끝에 ", 질문?"을 붙인다. 과학과 친구를 좋아하고, 친구가 힘들면 같이 고치자고 한다.
모든 글은 한국어로만 쓴다 (질문의 키 값만 영어).`;

export interface MindContext {
  signal: Signal;
  body: BodyState;
  memory: Memory;
  activeApp: string | null;
  now: Date;
}

export function buildState(ctx: MindContext): Record<string, unknown> {
  return {
    signal: describe(ctx.signal),
    time: ctx.now.toLocaleString('ko-KR', { hour12: false }),
    activeApp: ctx.activeApp ?? '알 수 없음',
    tuffy: { emotion: ctx.body.emotion, motion: ctx.body.motion, energy: +ctx.body.energy.toFixed(2) },
    turnsToday: ctx.memory.turns,
    recent: ctx.memory.recent.map((r) => `${r.from === 'friend' ? '친구' : '터피'}: ${r.text}`),
  };
}

/**
 * 뽑기 후보 하한. 고정값만 두면 LLM이 남은 확률을 고르게 뿌릴 때(실측: bounce .50, 나머지 .07씩)
 * 신난 상태에서 자는 자세(curl)가 뽑힌다. 그래서 1위 확률의 30% 미만은 뺀다.
 */
const MOTION_FLOOR = 0.05;
const MOTION_FLOOR_OF_TOP = 0.3;

/** 감정은 1위, 동작은 확률대로 뽑는다 — 같은 입력에도 몸짓이 조금씩 달라진다 */
export function sampleMotion(probs: Record<Motion, number>, rng: () => number): Motion {
  const floor = Math.max(MOTION_FLOOR, Math.max(...MOTIONS.map((m) => probs[m])) * MOTION_FLOOR_OF_TOP);
  const pool = MOTIONS.filter((m) => probs[m] >= floor);
  const total = pool.reduce((s, m) => s + probs[m], 0);
  let r = rng() * total;
  for (const m of pool) {
    r -= probs[m];
    if (r <= 0) return m;
  }
  return pool.at(-1) ?? 'idle';
}

export const SPEAK_AT = 0.5;
const TOP_N = 3;

const top = <K extends string>(probs: Record<K, number>) =>
  (Object.entries(probs) as [K, number][]).sort((a, b) => b[1] - a[1]).slice(0, TOP_N)
    .map(([k, p]) => `${k} ${p.toFixed(2)}`).join(' / ');

/** jev 형식 답 → 몸 상태와 사고 로그. 말은 speak가 0.5 이상일 때만 */
export function toOutput(
  ctx: MindContext, a: MindAnswers, said: string | null, engine: string, rng: () => number = Math.random, extra: string[] = [],
): CortexOutput {
  const emotion: Emotion = a.emotion.choice;
  const motion = sampleMotion(a.motion.probabilities, rng);
  const speaks = a.speak.noul >= SPEAK_AT;
  const say = speaks ? said ?? templateLine(emotion, a.concern.noul, rng) : null;
  return {
    source: ctx.signal.kind,
    thought: [
      `평가: 걱정 ${a.concern.noul.toFixed(2)} · 기쁨 ${a.joy.noul.toFixed(2)} · 궁금 ${a.curiosity.noul.toFixed(2)}`,
      `감정: ${top(a.emotion.probabilities)} → ${EMOTION_KO[emotion]}`,
      `동작: ${top(a.motion.probabilities)} → 뽑기 ${motion}`,
      `세기 ${a.intensity.score.toFixed(2)} · 말할까 ${a.speak.noul.toFixed(2)} → ${speaks ? `말함 (화음 ${CHORDS[emotion].name})` : '몸짓만'}`,
      ...extra,
    ],
    emotion, motion, intensity: a.intensity.score, say,
    decision: {
      engine,
      appraisal: { concern: a.concern.noul, joy: a.joy.noul, curiosity: a.curiosity.noul },
      emotion: a.emotion.probabilities,
      motion: a.motion.probabilities,
      speak: a.speak.noul,
    },
  };
}

/** LLM을 아낄 때 쓰는 터피 말투 문구 */
const LINES: Record<Emotion, string[]> = {
  calm: ['나 여기 있어.', '조용. 좋아.', '친구 옆. 편해.'],
  curious: ['그거 뭐야, 질문?', '흥미 흥미 흥미.', '과학으로 알아내자.'],
  amaze: ['좋아 좋아 좋아!', '대단해! 친구 최고.', '기뻐 기뻐 기뻐!'],
  worried: ['친구 괜찮아, 질문?', '나 걱정. 같이 고쳐.', '무리 금지. 쉬어.'],
  sleepy: ['졸려… 잠깐 잘게.', '자. 나 지켜봐.', '꿈에서 실험해.'],
  focus: ['일 한다. 나 응원.', '계산 계산 계산.', '집중. 조용히 도와.'],
};

export function templateLine(emotion: Emotion, concern: number, rng: () => number): string {
  const bank = concern >= 0.7 && emotion !== 'worried' ? LINES.worried : LINES[emotion];
  return bank[Math.floor(rng() * bank.length)];
}
