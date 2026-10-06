import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyMemory } from '../../../shared/state';
import { MIND, sampleMotion, toOutput, type MindContext } from '../mind';
import { freeDecider } from './deciders';
import { FREE_ROUTER, FreeRouter, RouterError, isFreeModel, type Budget } from './freeRouter';
import { choice, defineQuestions, exampleAnswers, noul, parseAnswers, score, toWire } from './questions';

/** 2026-10-05 실제 jev 응답(새벽 3시 "배포 성공했는데 새벽까지 일했어")에서 뽑은 값 */
const JEV_LIKE = {
  concern: { noul: 0.77 },
  joy: { noul: 0.4 },
  curiosity: { noul: 0.2 },
  emotion: { choice: 'calm', probabilities: { amaze: 0.16, curious: 0.02, sleepy: 0.06, worried: 0.14, calm: 0.61, focus: 0.01 }, confidence: 0.53 },
  motion: { choice: 'idle', probabilities: { shiver: 0.03, curl: 0.05, perk: 0.06, bounce: 0.03, wave: 0.1, idle: 0.72, scuttle: 0.01 }, confidence: 0.67 },
  intensity: { score: 0.35 },
  speak: { noul: 0.75 },
};

describe('questions', () => {
  const QS = defineQuestions({
    mood: choice(['up', 'down'] as const, '기분', { up: '좋다', down: '나쁘다' }),
    sure: noul('확실한가'),
    size: score('크기', '작다', '크다'),
  });

  it('jev wire 형식: score criteria는 [낮음, 높음] 배열', () => {
    expect(toWire(QS)).toEqual({
      mood: { type: 'choice', instructions: '기분', criteria: { up: '좋다', down: '나쁘다' } },
      sure: { type: 'noul', instructions: '확실한가', criteria: { true: '그렇다', false: '아니다' } },
      size: { type: 'score', instructions: '크기', criteria: ['작다', '크다'] },
    });
  });

  it('확률을 정규화하고 선택을 확률 1위로 맞춘다', () => {
    const a = parseAnswers(QS, { mood: { choice: 'up', probabilities: { up: 1, down: 3 } }, sure: { noul: 2 }, size: { score: 0.4 } });
    expect(a?.mood).toEqual({ choice: 'down', probabilities: { up: 0.25, down: 0.75 }, confidence: null });
    expect(a?.sure.noul).toBe(1);
  });

  it('확률이 없으면 선택에 1을 준다', () => {
    expect(parseAnswers(QS, { mood: { choice: 'up' }, sure: { noul: 0 }, size: { score: 0 } })?.mood.probabilities).toEqual({ up: 1, down: 0 });
  });

  it('jev score는 0 ~ (단계 수 - 1)이라 0~1로 맞춘다', () => {
    const levels = defineQuestions({ s: score('크기', '작다', '크다') });
    expect(parseAnswers(levels, { s: { score: 0.35, legend: { 0: '작다', 1: '크다' } } })?.s.score).toBe(0.35);
    const three = defineQuestions({ s: { type: 'score' as const, instructions: '크기', criteria: ['작다', '보통', '크다'] as const } });
    expect(parseAnswers(three, { s: { score: 1.5 } })?.s.score).toBe(0.75);
  });

  it('질문 하나라도 빠지거나 enum 밖이면 거부', () => {
    expect(parseAnswers(QS, { mood: { choice: 'sideways' }, sure: { noul: 0 }, size: { score: 0 } })).toBeNull();
    expect(parseAnswers(QS, { mood: { choice: 'up' }, size: { score: 0 } })).toBeNull();
  });

  it('한 겹 더 감싼 choice도 받는다 (실측 nemotron)', () => {
    const a = parseAnswers(QS, { mood: { choice: { choice: 'up', probabilities: { up: 0.7, down: 0.3 }, confidence: 0.8 } }, sure: { noul: 0 }, size: { score: 0 } });
    expect(a?.mood).toEqual({ choice: 'up', probabilities: { up: 0.7, down: 0.3 }, confidence: 0.8 });
  });

  it('예시 답은 그 자체로 계약을 통과한다', () => {
    expect(parseAnswers(MIND, exampleAnswers(MIND))).not.toBeNull();
  });

  it('실제 jev 응답 모양을 MIND 계약으로 받는다', () => {
    expect(parseAnswers(MIND, JEV_LIKE)?.emotion.choice).toBe('calm');
  });
});

const ctx: MindContext = {
  signal: { kind: 'speech', text: '터피야 새벽까지 일했어', addressed: true },
  body: { emotion: 'calm', motion: 'idle', energy: 0.6, turns: 3, thinking: false },
  memory: emptyMemory(), activeApp: 'Code', now: new Date(2026, 9, 5, 3, 12),
};

describe('toOutput', () => {
  const answers = parseAnswers(MIND, JEV_LIKE)!;

  it('감정은 1위, 말할 확률이 0.5 이상이면 대사를 붙인다', () => {
    const out = toOutput(ctx, answers, '쉬어 쉬어 쉬어!', 'free-model', () => 0);
    expect(out).toMatchObject({ emotion: 'calm', say: '쉬어 쉬어 쉬어!', intensity: 0.35 });
    expect(out.thought[0]).toBe('평가: 걱정 0.77 · 기쁨 0.40 · 궁금 0.20');
    expect(out.decision?.engine).toBe('free-model');
  });

  it('대사가 없으면 걱정 평가에 맞는 템플릿을 쓴다', () => {
    expect(toOutput(ctx, answers, null, 'jev', () => 0).say).toBe('친구 괜찮아, 질문?');
  });

  it('말할 확률이 낮으면 몸짓만', () => {
    expect(toOutput(ctx, { ...answers, speak: { noul: 0.2 } }, '안녕', 'jev').say).toBeNull();
  });
});

describe('sampleMotion', () => {
  const probs = { idle: 0.72, wave: 0.1, perk: 0.06, curl: 0.05, shiver: 0.03, bounce: 0.03, scuttle: 0.01, think: 0 };

  it('1위의 30% 미만 꼬리는 버린다 (idle .72면 .216 미만 제외 → idle만)', () => {
    for (const r of [0, 0.5, 0.999]) expect(sampleMotion(probs, () => r)).toBe('idle');
  });

  it('실측: bounce .50에 나머지 .07씩이면 bounce만 (자는 자세 curl이 뽑히지 않게)', () => {
    const flat = { bounce: 0.5, idle: 0.07, perk: 0.07, think: 0.07, scuttle: 0.07, wave: 0.07, shiver: 0.07, curl: 0.08 };
    for (const r of [0, 0.5, 0.999]) expect(sampleMotion(flat, () => r)).toBe('bounce');
  });

  it('비슷하게 갈리면 여러 후보에서 뽑는다 (wave .45 · shiver .25 · idle .20)', () => {
    const split = { wave: 0.45, shiver: 0.25, idle: 0.2, perk: 0.06, bounce: 0.04, think: 0, scuttle: 0, curl: 0 };
    // 후보 순서(MOTIONS): idle .20 → wave .45 → shiver .25, 합 .90
    expect(sampleMotion(split, () => 0.1)).toBe('idle');
    expect(sampleMotion(split, () => 0.5)).toBe('wave');
    expect(sampleMotion(split, () => 0.95)).toBe('shiver');
  });
});

describe('FreeRouter', () => {
  afterEach(() => vi.unstubAllGlobals());

  const budgetOf = (n: number): Budget & { used: number } => {
    const b = { used: 0, remaining: () => n - b.used, spend: () => void b.used++ };
    return b;
  };
  const reply = (status: number, content = '') =>
    new Response(JSON.stringify(status === 200 ? { choices: [{ message: { content } }] } : { error: {} }), { status });

  it(':free 모델과 무료 라우터만 호출한다', () => {
    expect(isFreeModel('openai/gpt-oss-120b')).toBe(false);
    expect(isFreeModel(FREE_ROUTER)).toBe(true);
    expect(isFreeModel('openrouter/auto')).toBe(false);
    const r = new FreeRouter({ url: 'x', models: ['a:free', 'paid/model'], timeoutMs: 1 }, budgetOf(5));
    expect(r.rejected).toEqual(['paid/model']);
  });

  it('호출당 요청은 1번 (폴백은 proxy 몫), 실패한 모델은 쉬고 다음 호출은 다음 모델로', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(reply(404)).mockResolvedValueOnce(reply(200, 'ok'));
    vi.stubGlobal('fetch', fetch);
    const budget = budgetOf(5);
    const r = new FreeRouter({ url: 'x', models: ['a:free', 'b:free'], timeoutMs: 1000 }, budget);
    await expect(r.chat([], 10)).rejects.toMatchObject({ reason: 'all-failed' } satisfies Partial<RouterError>);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(await r.chat([], 10)).toEqual({ content: 'ok', model: 'b:free', tried: ['b:free'] });
    expect(budget.used).toBe(2);
  });

  it('json 옵션이면 JSON 모드와 지원 모델만 고르게 요청한다', async () => {
    const fetch = vi.fn().mockResolvedValue(reply(200, '{}'));
    vi.stubGlobal('fetch', fetch);
    await new FreeRouter({ url: 'x', models: [FREE_ROUTER], timeoutMs: 1000 }, budgetOf(1)).chat([], 10, { json: true });
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({
      model: FREE_ROUTER, response_format: { type: 'json_object' }, provider: { require_parameters: true },
    });
  });

  it('예산이 없으면 호출하지 않는다', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const r = new FreeRouter({ url: 'x', models: ['a:free'], timeoutMs: 1 }, budgetOf(0));
    await expect(r.chat([], 10)).rejects.toMatchObject({ reason: 'budget' } satisfies Partial<RouterError>);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('freeDecider', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('코드 펜스로 감싼 {answers, say}를 MIND 계약으로 받는다', async () => {
    const content = '```json\n' + JSON.stringify({ answers: JEV_LIKE, say: '쉬어 쉬어 쉬어!' }) + '\n```';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content } }] }))));
    const router = new FreeRouter({ url: 'x', models: ['m:free'], timeoutMs: 1000 }, { remaining: () => 1, spend: () => {} });
    const r = await freeDecider(router).decide(MIND, {}, 'persona');
    expect(r).toMatchObject({ say: '쉬어 쉬어 쉬어!', engine: 'm:free' });
    expect(r.answers.motion.choice).toBe('idle');
  });

  it('계약을 어기면 던진다 (본능으로 대체되도록)', async () => {
    const content = JSON.stringify({ answers: { emotion: { choice: 'angry' } } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content } }] }))));
    const router = new FreeRouter({ url: 'x', models: ['m:free'], timeoutMs: 1000 }, { remaining: () => 1, spend: () => {} });
    await expect(freeDecider(router).decide(MIND, {}, 'persona')).rejects.toThrow('질문 계약');
  });
});
