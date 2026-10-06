import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyMemory } from '../../shared/state';
import { TYPESAFE_URL, typesafeDecider, type Decider, type Voice } from './decide/deciders';
import { exampleAnswers, type Questions } from './decide/questions';
import { thinkWith, type EngineHooks } from './engines';
import { LINES, NO_FIT } from './lines';
import { APPRAISE, EXPRESS, MIND, type MindContext } from './mind';

const ctx: MindContext = {
  signal: { kind: 'text', text: '터피야 배포 성공했어' },
  body: { emotion: 'calm', motion: 'idle', energy: 0.6, turns: 0, thinking: false },
  memory: emptyMemory(), activeApp: 'Code', now: new Date(2026, 9, 5, 15),
};

/** 질문 정의에 맞춰 답하는 가짜 엔진. 받은 질문·state를 기록한다 */
function fakeDecider(engine: string, costUsd: number, override: Record<string, unknown> = {}) {
  const calls: { keys: string[]; state: Record<string, unknown> }[] = [];
  const decider: Decider = {
    async decide(qs: Questions, state) {
      calls.push({ keys: Object.keys(qs), state });
      const base = exampleAnswers(qs) as Record<string, unknown>;
      for (const k of Object.keys(qs)) if (k in override) base[k] = override[k];
      return { answers: base as never, say: engine === 'free' ? '무료 대사' : null, engine, costUsd };
    },
  };
  return { decider, calls };
}

/** TypeSafe 키가 저장돼 있는 상태 */
const KEY = () => 'stored' as const;

const hooksWith = (paidLeft: number, freeLeft = 10) => {
  const spent: number[] = [];
  const logs: string[] = [];
  const hooks: EngineHooks = {
    log: (t) => logs.push(t), freeLeft: () => freeLeft, paidLeftUsd: () => paidLeft, spendPaid: (u) => spent.push(u),
  };
  return { hooks, spent, logs };
};

const voiceSaying = (line: string | null) => {
  const speak = vi.fn<Voice['speak']>().mockResolvedValue(line);
  return { voice: { speak } satisfies Voice, speak };
};

describe('thinkWith', () => {
  it('jev: 평가 → 표현 2회, 평가 답을 표현 state에 넣고 비용을 쌓는다', async () => {
    const jev = fakeDecider('typesafe/jev', 0.00004, { concern: { noul: 0.9 }, speak: { noul: 0.8 } });
    const { voice, speak } = voiceSaying('쉬어 쉬어 쉬어!');
    const { hooks, spent } = hooksWith(0.05);
    const r = await thinkWith('jev', ctx, { free: null, voice, jev: jev.decider, jevKey: KEY }, hooks);
    expect(jev.calls.map((c) => c.keys)).toEqual([Object.keys(APPRAISE), [...Object.keys(EXPRESS), 'reply']]);
    expect(jev.calls[1].state).toMatchObject({ appraisal: { concern: 0.9 } });
    expect(spent).toEqual([0.00004, 0.00004]);
    expect(speak).toHaveBeenCalledOnce();
    // 몸은 바로(say 없이), 말은 나중에 따로 온다
    expect(r?.out).toMatchObject({ say: null, decision: { engine: 'typesafe/jev' } });
    expect(await r?.pendingSay).toBe('쉬어 쉬어 쉬어!');
  });

  const replyOf = (choice: string, p: number, confidence = 0.8) =>
    ({ choice, probabilities: { [choice]: p, 'talk.ok': 1 - p }, confidence });

  it('jev: 대답 적합도가 높으면 모음의 문장을 쓰고 무료 LLM은 부르지 않는다', async () => {
    const jev = fakeDecider('jev-1.13.0', 0.00004, { speak: { noul: 0.9 }, reply: replyOf('rest.overwork', 0.7) });
    const { voice, speak } = voiceSaying('안 불려야 함');
    const r = await thinkWith('jev', ctx, { free: null, voice, jev: jev.decider, jevKey: KEY }, hooksWith(0.05).hooks);
    expect(speak).not.toHaveBeenCalled();
    expect(r?.pendingSay).toBeUndefined();
    expect(r?.out.say).toBe(LINES['rest.overwork'].say);
    expect(r?.out.thought.at(-1)).toContain('모음에서 고름');
  });

  it('jev: "알맞은 대답 없음"이면 무료 LLM이 대답을 쓴다', async () => {
    const jev = fakeDecider('jev-1.13.0', 0.00004, { speak: { noul: 0.9 }, reply: replyOf(NO_FIT, 0.8) });
    const { voice, speak } = voiceSaying('김치찌개 어때, 질문?');
    const r = await thinkWith('jev', ctx, { free: null, voice, jev: jev.decider, jevKey: KEY }, hooksWith(0.05).hooks);
    expect(speak).toHaveBeenCalledOnce();
    expect(r?.out.say).toBeNull();
    expect(await r?.pendingSay).toBe('김치찌개 어때, 질문?');
    expect(r?.out.thought.at(-1)).toContain('알맞은 대답 없음');
  });

  it('jev: 말할 확률이 낮으면 대사 호출(무료 한도)을 쓰지 않는다', async () => {
    const jev = fakeDecider('typesafe/jev', 0.00004, { speak: { noul: 0.2 } });
    const { voice, speak } = voiceSaying('안 불려야 함');
    const r = await thinkWith('jev', ctx, { free: null, voice, jev: jev.decider, jevKey: KEY }, hooksWith(0.05).hooks);
    expect(speak).not.toHaveBeenCalled();
    expect(r?.out.say).toBeNull();
    expect(r?.pendingSay).toBeUndefined();
  });

  it('jev: 대사 생성이 실패하면 말투 템플릿', async () => {
    const jev = fakeDecider('typesafe/jev', 0.00004, { speak: { noul: 0.9 } });
    const voice: Voice = { speak: vi.fn().mockRejectedValue(new Error('404')) };
    const r = await thinkWith('jev', ctx, { free: null, voice, jev: jev.decider, jevKey: KEY }, hooksWith(0.05).hooks);
    expect(await r?.pendingSay).toEqual(expect.any(String));
  });

  it('jev 비용 상한에 닿으면 jev를 부르지 않고 무료 LLM으로', async () => {
    const jev = fakeDecider('typesafe/jev', 0.00004);
    const free = fakeDecider('free', 0);
    const { hooks, logs } = hooksWith(0);
    const r = await thinkWith('jev', ctx, { free: free.decider, voice: null, jev: jev.decider, jevKey: KEY }, hooks);
    expect(jev.calls).toHaveLength(0);
    expect(free.calls[0].keys).toEqual(Object.keys(MIND));
    expect(r?.out.decision?.engine).toBe('free');
    expect(logs[0]).toContain('상한');
  });

  it('TypeSafe 키가 없으면 jev를 부르지 않고 무료 LLM으로', async () => {
    const jev = fakeDecider('jev-1.13.0', 0.00004);
    const free = fakeDecider('free', 0);
    const { hooks, logs } = hooksWith(0.05);
    const r = await thinkWith('jev', ctx, { free: free.decider, voice: null, jev: jev.decider, jevKey: () => null }, hooks);
    expect(jev.calls).toHaveLength(0);
    expect(r?.out.decision?.engine).toBe('free');
    expect(logs[0]).toContain('키 없음');
  });

  it('jev가 실패하면 무료 LLM으로', async () => {
    const jev: Decider = { decide: vi.fn().mockRejectedValue(new Error('jev 응답 504')) };
    const free = fakeDecider('free', 0);
    const r = await thinkWith('jev', ctx, { free: free.decider, voice: null, jev, jevKey: KEY }, hooksWith(0.05).hooks);
    expect(r?.out.decision?.engine).toBe('free');
  });

  it('중단되면(말소리 시작) 다른 엔진으로 내려가지 않고 null', async () => {
    const ctrl = new AbortController();
    const jev: Decider = { decide: vi.fn().mockImplementation(async () => { ctrl.abort(); throw new Error('중단됨'); }) };
    const free = fakeDecider('free', 0);
    const r = await thinkWith('jev', ctx, { free: free.decider, voice: null, jev, jevKey: KEY }, hooksWith(0.05).hooks, ctrl.signal);
    expect(r).toBeNull();
    expect(free.calls).toHaveLength(0);
  });

  it('이미 중단된 상태면 무료 LLM도 부르지 않는다', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    const free = fakeDecider('free', 0);
    expect(await thinkWith('free', ctx, { free: free.decider, voice: null, jev: null, jevKey: KEY }, hooksWith(0.05).hooks, ctrl.signal)).toBeNull();
    expect(free.calls).toHaveLength(0);
  });

  it('free: 무료 LLM 1회 (MIND 전체)', async () => {
    const free = fakeDecider('free', 0);
    const jev = fakeDecider('typesafe/jev', 0.00004);
    await thinkWith('free', ctx, { free: free.decider, voice: null, jev: jev.decider, jevKey: KEY }, hooksWith(0.05).hooks);
    expect(free.calls).toHaveLength(1);
    expect(jev.calls).toHaveLength(0);
  });

  it('쓸 엔진이 없으면 null (뇌가 본능으로)', async () => {
    const free = fakeDecider('free', 0);
    expect(await thinkWith('free', ctx, { free: free.decider, voice: null, jev: null, jevKey: KEY }, hooksWith(0, 0).hooks)).toBeNull();
  });
});

describe('typesafeDecider', () => {
  afterEach(() => vi.unstubAllGlobals());
  const ok = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

  it('TypeSafe API를 Bearer 키로 부르고, 페르소나는 state.character, 비용은 입력 토큰 × $0.042/1M', async () => {
    const answers = exampleAnswers(APPRAISE);
    const fetch = vi.fn().mockResolvedValue(ok({ answers, model: 'jev-1.13.0', usage: { input_tokens: 1000, output_tokens: 30 } }));
    vi.stubGlobal('fetch', fetch);
    const r = await typesafeDecider(() => 'ts-key-0123456789abcdef', 1000).decide(APPRAISE, { signal: 'text' }, '터피 페르소나');
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(TYPESAFE_URL);
    expect(init.headers.authorization).toBe('Bearer ts-key-0123456789abcdef');
    expect(JSON.parse(init.body)).toMatchObject({ model: 'jev-latest', state: { character: '터피 페르소나', signal: 'text' } });
    expect(r.engine).toBe('jev-1.13.0');
    expect(r.costUsd).toBeCloseTo(0.000042, 9);
  });

  it('키가 없으면 호출하지 않고, 401이면 키 거부로 알린다', async () => {
    const fetch = vi.fn().mockResolvedValue(ok({ error: 'unauthorized' }, 401));
    vi.stubGlobal('fetch', fetch);
    await expect(typesafeDecider(() => null, 1000).decide(APPRAISE, {}, 'p')).rejects.toThrow('키 없음');
    expect(fetch).not.toHaveBeenCalled();
    await expect(typesafeDecider(() => 'bad-key-0123456789', 1000).decide(APPRAISE, {}, 'p')).rejects.toThrow('키 거부 (401)');
  });
});
