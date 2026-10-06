import { exampleAnswers, parseAnswers, toWire, type Answers, type Questions } from './questions';
import { withAbort, type FreeRouter } from './freeRouter';

/**
 * 판단 엔진. 질문 계약(questions.ts)은 같고, 누가 답하는지만 다르다.
 * - free: 무료 LLM이 jev 형식으로 답하고, 같은 호출에서 대사(say)도 쓴다 (호출 1번)
 * - jev:  TypeSafe(jev-latest) 직접 호출. 유료 크레딧(호출당 약 $0.00004), 대사는 못 쓴다
 */

export interface DecideResult<QS extends Questions> {
  answers: Answers<QS>;
  say: string | null;
  engine: string;
  /** 이번 호출 비용(USD). 무료는 0, jev는 입력 토큰 × 단가 */
  costUsd: number;
}

export interface Decider {
  decide<QS extends Questions>(qs: QS, state: Record<string, unknown>, persona: string, signal?: AbortSignal): Promise<DecideResult<QS>>;
}

const SAY_MAX = 40;
/** 추론 토큰 몫까지 넉넉히 (무료라 비용 없음, 실측 1500은 추론형 모델에서 부족) */
const FREE_MAX_TOKENS = 4000;
const JEV_MODEL = 'jev-latest';

const RULES = `너는 터피의 뇌다. state를 보고 questions에 답한다. 답 형식은 OpenRouter jev와 같다.
- choice: {"choice": criteria 키 하나, "probabilities": {모든 키: 0~1, 합 1}, "confidence": 0~1}
- noul: {"noul": 참일 확률 0~1}
- score: {"score": 0~1} (0은 criteria[0], 1은 criteria[1]에 가깝다)
questions에 적힌 순서대로 답하고, 앞에서 내린 평가를 뒤 판단에 반영한다.
마지막에 "say"로 친구에게 할 말 한 줄(24자 이내, 한국어)을 쓴다.
출력은 {"answers": {...}, "say": "..."} JSON 하나만. 다른 텍스트 금지.`;

function extractJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const v: unknown = JSON.parse(text.slice(start, end + 1));
    return typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export class ContractError extends Error {}

export function freeDecider(router: FreeRouter): Decider {
  return {
    async decide(qs, state, persona, signal) {
      const { content, model } = await router.chat([
        { role: 'system', content: `${persona}\n\n${RULES}\n형식 예시(값은 자리표시, 구조를 그대로 따른다):\n${JSON.stringify({ answers: exampleAnswers(qs), say: '…' })}` },
        { role: 'user', content: JSON.stringify({ state, questions: toWire(qs) }) },
      ], FREE_MAX_TOKENS, { json: true, signal });
      const json = extractJson(content);
      const answers = json && parseAnswers(qs, json.answers);
      if (!answers) throw new ContractError(`${model} 응답이 질문 계약을 어김`);
      const say = typeof json.say === 'string' ? json.say.trim().slice(0, SAY_MAX) : '';
      return { answers, say: say || null, engine: model, costUsd: 0 };
    },
  };
}

/** TypeSafe 직접 호출 (console.typesafe.ai 크레딧). https://docs.typesafe.ai/api */
export const TYPESAFE_URL = 'https://api.typesafe.ai/v1/systemone';
/** 입력 토큰 100만 개당 $0.042, 출력 토큰은 무료 (https://docs.typesafe.ai/models, 2026-10-05) */
const JEV_USD_PER_INPUT_TOKEN = 0.042 / 1_000_000;

/** jev에는 시스템 프롬프트가 없어 페르소나를 state.character로 넘긴다. 응답에 비용이 없어 입력 토큰으로 계산한다 */
export function typesafeDecider(getKey: () => string | null, timeoutMs: number): Decider {
  return {
    async decide(qs, state, persona, signal) {
      const key = getKey();
      if (!key) throw new ContractError('TypeSafe 키 없음');
      let res: Response;
      try {
        res = await fetch(TYPESAFE_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
          body: JSON.stringify({ model: JEV_MODEL, state: { character: persona, ...state }, questions: toWire(qs) }),
          signal: withAbort(timeoutMs, signal),
        });
      } catch {
        if (signal?.aborted) throw new ContractError('중단됨');
        throw new ContractError('TypeSafe에 연결하지 못함');
      }
      if (res.status === 401 || res.status === 403) throw new ContractError(`TypeSafe 키 거부 (${res.status})`);
      if (!res.ok) throw new ContractError(`TypeSafe 응답 ${res.status}`);
      const data = (await res.json().catch(() => null)) as { answers?: unknown; model?: unknown; usage?: { input_tokens?: unknown } } | null;
      const answers = parseAnswers(qs, data?.answers);
      if (!answers) throw new ContractError('jev 응답이 질문 계약을 어김');
      const input = data?.usage?.input_tokens;
      return {
        answers, say: null,
        engine: typeof data?.model === 'string' ? data.model : JEV_MODEL,
        costUsd: typeof input === 'number' && input > 0 ? input * JEV_USD_PER_INPUT_TOKEN : 0,
      };
    },
  };
}

const VOICE_MAX_TOKENS = 1500;

export interface Voice {
  /** 이미 정해진 감정·평가에 맞는 대사 한 줄. 실패하면 null */
  speak(persona: string, state: Record<string, unknown>, decided: Record<string, unknown>, signal?: AbortSignal): Promise<string | null>;
}

/** jev가 몸을 정한 뒤, 친구가 건넨 말에 답할 한 줄만 무료 LLM이 쓴다 */
export function freeVoice(router: FreeRouter): Voice {
  return {
    async speak(persona, state, decided, signal) {
      const { content } = await router.chat([
        { role: 'system', content: `${persona}\n\n감정과 몸짓은 이미 정해졌다(decided). state의 신호에 대해 친구에게 할 말 한 줄(24자 이내, 한국어)만 쓴다.\n출력은 {"say": "..."} JSON 하나만.` },
        { role: 'user', content: JSON.stringify({ state, decided }) },
      ], VOICE_MAX_TOKENS, { json: true, signal });
      const say = extractJson(content)?.say;
      return typeof say === 'string' && say.trim() ? say.trim().slice(0, SAY_MAX) : null;
    },
  };
}
