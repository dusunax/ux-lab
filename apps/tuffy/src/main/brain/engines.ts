import type { CortexOutput, EngineId } from '../../shared/state';
import type { Decider, Voice } from './decide/deciders';
import { APPRAISE, EXPRESS, MIND, PERSONA, REPLY, SPEAK_AT, buildState, pickReply, templateLine, toOutput, type MindAnswers, type MindContext } from './mind';

/**
 * 판단 엔진 고르기. 친구가 건넨 말일 때만 불린다(그 밖은 본능).
 * - free: 무료 LLM 1회로 판단 + 대사
 * - jev:  TypeSafe jev 2회(평가 → 표현+대답 고르기, 약 1초). 대답은 터피 대답 모음에서 jev가 고르고,
 *         적합도가 낮을 때만 무료 LLM이 한 줄 쓴다. 키가 없거나, 비용 상한을 넘거나, 실패하면 free로 내려간다
 * 둘 다 안 되면 null → 뇌가 본능으로 대체한다.
 */

export interface Engines {
  free: Decider | null;
  voice: Voice | null;
  jev: Decider | null;
  /** TypeSafe 키가 어디 있는지 (없으면 null → jev를 고를 수 없다) */
  jevKey: () => 'env' | 'stored' | null;
}

/**
 * 판단 결과. 말을 무료 LLM이 쓰는 중이면 pendingSay로 따로 온다 —
 * 몸(감정·동작·화음)은 jev 판단 직후 먼저 움직이고, 말은 도착하면 띄운다.
 */
export interface ThinkResult {
  out: CortexOutput;
  /** 중단되면 null */
  pendingSay?: Promise<string | null>;
}

export interface EngineHooks {
  log: (text: string) => void;
  freeLeft: () => number;
  paidLeftUsd: () => number;
  spendPaid: (usd: number) => void;
}

const reason = (e: unknown) => (e instanceof Error ? e.message : '알 수 없는 오류');
const usd = (n: number) => `$${n.toFixed(5)}`;

async function jevThink(
  ctx: MindContext, engines: Engines & { jev: Decider }, hooks: EngineHooks, signal?: AbortSignal,
): Promise<ThinkResult> {
  const state = buildState(ctx);
  const first = await engines.jev.decide(APPRAISE, state, PERSONA, signal);
  hooks.spendPaid(first.costUsd);
  const appraisal = {
    concern: first.answers.concern.noul, joy: first.answers.joy.noul, curiosity: first.answers.curiosity.noul,
  };
  const second = await engines.jev.decide({ ...EXPRESS, ...REPLY }, { ...state, appraisal }, PERSONA, signal);
  hooks.spendPaid(second.costUsd);
  const { reply, ...express } = second.answers;
  const answers: MindAnswers = { ...first.answers, ...express };
  hooks.log(`jev 2회 · ${usd(first.costUsd + second.costUsd)}`);
  if (answers.speak.noul < SPEAK_AT) return { out: toOutput(ctx, answers, null, second.engine) };

  const pick = pickReply(reply);
  const ranked = (Object.entries(reply.probabilities) as [string, number][])
    .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, p]) => `${k} ${p.toFixed(2)}`).join(' / ');
  if (pick.use === 'line') {
    return { out: toOutput(ctx, answers, pick.text, second.engine, Math.random, [`대답: ${ranked} → 모음에서 고름`]) };
  }
  const fallback = () => templateLine(answers.emotion.choice, appraisal.concern, Math.random);
  const voice = engines.voice;
  const pendingSay = voice && hooks.freeLeft() > 0
    ? voice.speak(PERSONA, state, { emotion: answers.emotion.choice, appraisal }, signal)
      .then((line) => (signal?.aborted ? null : line ?? fallback()))
      .catch((e: unknown) => {
        if (signal?.aborted) return null;
        hooks.log(`대사 생성 실패 (${reason(e)}) → 말투 템플릿`);
        return fallback();
      })
    : Promise.resolve(fallback());
  const out = toOutput(ctx, answers, null, second.engine, Math.random, [`대답: ${ranked} → 적합도 낮음(${pick.why}) → 무료 LLM`]);
  // toOutput은 말이 없으면 템플릿을 채운다. 말은 pendingSay로 오므로 비워 두어야 두 번 말하지 않는다
  return { out: { ...out, say: null }, pendingSay };
}

/** signal이 중단되면(말소리가 시작됨) 다른 엔진으로 내려가지 않고 null — 뇌가 생각을 버린다 */
export async function thinkWith(
  engine: EngineId, ctx: MindContext, engines: Engines, hooks: EngineHooks, signal?: AbortSignal,
): Promise<ThinkResult | null> {
  if (engine === 'jev' && engines.jev) {
    if (!engines.jevKey()) hooks.log('TypeSafe 키 없음 → 무료 LLM');
    else if (hooks.paidLeftUsd() <= 0) hooks.log('jev 오늘 비용 상한 도달 → 무료 LLM');
    else {
      try {
        return await jevThink(ctx, { ...engines, jev: engines.jev }, hooks, signal);
      } catch (e) {
        if (signal?.aborted) return null;
        hooks.log(`${reason(e)} → 무료 LLM`);
      }
    }
  }
  if (signal?.aborted || !engines.free || hooks.freeLeft() <= 0) return null;
  try {
    const { answers, say, engine: model } = await engines.free.decide(MIND, buildState(ctx), PERSONA, signal);
    return { out: toOutput(ctx, answers, say, model) };
  } catch (e) {
    if (signal?.aborted) return null;
    hooks.log(`${reason(e)} → 본능으로 대체`);
    return null;
  }
}
