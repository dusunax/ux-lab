/**
 * jev(OpenRouter Decisions)와 같은 모양의 타입 안전 질문 키트.
 * 질문 정의 하나에서 요청 JSON, 응답 타입(Answers<Q>), 응답 검증이 함께 나온다.
 * 판단 엔진(무료 LLM / jev)이 바뀌어도 이 계약은 그대로다.
 */

/** 보기 설명. jev는 문자열 외에 구조화된 값(object)도 받는다 (https://docs.typesafe.ai/primitives/advanced) */
export type Criterion = string | Readonly<Record<string, string>>;

export interface ChoiceQuestion<K extends string = string> {
  type: 'choice';
  keys: readonly K[];
  instructions: string;
  criteria: Record<K, Criterion>;
}

export interface NoulQuestion {
  type: 'noul';
  instructions: string;
  criteria: { true: string; false: string };
}

/** jev의 score는 criteria가 낮은 쪽부터 높은 쪽까지의 단계 배열이다 (2~10단계) */
export interface ScoreQuestion {
  type: 'score';
  instructions: string;
  criteria: readonly [string, string, ...string[]];
}

export type Question = ChoiceQuestion | NoulQuestion | ScoreQuestion;
export type Questions = Record<string, Question>;

export interface ChoiceAnswer<K extends string> {
  choice: K;
  probabilities: Record<K, number>;
  confidence: number | null;
}

export type Answer<Q extends Question> =
  Q extends ChoiceQuestion<infer K> ? ChoiceAnswer<K>
  : Q extends NoulQuestion ? { noul: number }
  : { score: number };

export type Answers<QS extends Questions> = { [K in keyof QS]: Answer<QS[K]> };

export const choice = <const K extends string>(keys: readonly K[], instructions: string, criteria: Record<K, Criterion>): ChoiceQuestion<K> =>
  ({ type: 'choice', keys, instructions, criteria });

export const noul = (instructions: string, yes = '그렇다', no = '아니다'): NoulQuestion =>
  ({ type: 'noul', instructions, criteria: { true: yes, false: no } });

export const score = (instructions: string, low: string, high: string): ScoreQuestion =>
  ({ type: 'score', instructions, criteria: [low, high] });

export const defineQuestions = <const QS extends Questions>(qs: QS): QS => qs;

/** jev /api/decisions 요청의 questions 형태 (keys는 criteria에 이미 들어 있어 뺀다) */
export function toWire(qs: Questions): Record<string, unknown> {
  return Object.fromEntries(Object.entries(qs).map(([k, q]) =>
    [k, { type: q.type, instructions: q.instructions, criteria: q.criteria }]));
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? clamp01(v) : null);
/** 확률은 정규화 전에 자르면 비율이 깨진다 ({up:1, down:3}이 동점이 됨). 음수만 버린다 */
const weight = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);
const obj = (v: unknown) => (typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

/** 확률을 키 전체로 채우고 합이 1이 되게 정규화한다. 비어 있으면 choice에 1을 준다 */
function normalize<K extends string>(keys: readonly K[], raw: Record<string, unknown> | null, picked: K | null) {
  const probs = Object.fromEntries(keys.map((k) => [k, weight(raw?.[k])])) as Record<K, number>;
  const total = keys.reduce((s, k) => s + probs[k], 0);
  if (total <= 0) {
    if (!picked) return null;
    keys.forEach((k) => (probs[k] = k === picked ? 1 : 0));
    return probs;
  }
  keys.forEach((k) => (probs[k] = probs[k] / total));
  return probs;
}

function parseOne(q: Question, raw: unknown): Answer<Question> | null {
  const o = obj(raw);
  if (!o) return null;
  if (q.type === 'noul') {
    const v = num(o.noul);
    return v === null ? null : { noul: v };
  }
  if (q.type === 'score') {
    // jev score는 0 ~ (단계 수 - 1) 사이 값이다. 0~1로 맞춘다
    const raw = typeof o.score === 'number' && Number.isFinite(o.score) ? o.score : null;
    const top = Math.max(1, q.criteria.length - 1);
    return raw === null ? null : { score: clamp01(raw / top) };
  }
  // LLM이 {"choice": {"choice": …, "probabilities": …}}처럼 한 겹 더 감싸 보내기도 한다 (실측 nemotron)
  const inner = obj(o.choice);
  const src = inner && ('choice' in inner || 'probabilities' in inner) ? inner : o;
  const picked = q.keys.find((k) => k === src.choice) ?? null;
  const probabilities = normalize(q.keys, obj(src.probabilities), picked);
  if (!probabilities) return null;
  // 보이는 확률과 선택이 어긋나지 않게, 선택은 항상 확률 1위로 맞춘다 (cat-game과 같은 규칙)
  const top = q.keys.reduce((best, k) => (probabilities[k] > probabilities[best] ? k : best), q.keys[0]);
  return { choice: top, probabilities, confidence: num(src.confidence ?? o.confidence) };
}

/** 프롬프트에 넣을 응답 예시 (값은 자리표시). 질문 정의에서 만들어 계약과 어긋나지 않는다 */
export function exampleAnswers(qs: Questions): Record<string, unknown> {
  return Object.fromEntries(Object.entries(qs).map(([k, q]) => {
    if (q.type === 'noul') return [k, { noul: 0.5 }];
    if (q.type === 'score') return [k, { score: 0.5 }];
    const even = +(1 / q.keys.length).toFixed(2);
    return [k, { choice: q.keys[0], probabilities: Object.fromEntries(q.keys.map((c) => [c, even])), confidence: 0.5 }];
  }));
}

/** 응답 answers 객체를 질문 정의로 검증한다. 하나라도 어긋나면 null */
export function parseAnswers<QS extends Questions>(qs: QS, raw: unknown): Answers<QS> | null {
  const o = obj(raw);
  if (!o) return null;
  const out: Record<string, unknown> = {};
  for (const [k, q] of Object.entries(qs)) {
    const a = parseOne(q, o[k]);
    if (!a) return null;
    out[k] = a;
  }
  return out as Answers<QS>;
}
