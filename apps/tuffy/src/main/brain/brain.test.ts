import { describe, expect, it } from 'vitest';
import { emptyMemory, type BodyState } from '../../shared/state';
import { instinctThink } from './instinct';
import { buildState, type MindContext } from './mind';
import { ESCALATE_AT, reflex } from './reflex';

const body: BodyState = { emotion: 'calm', motion: 'idle', energy: 0.8, turns: 0, thinking: false };
const ctx = (signal: MindContext['signal']): MindContext => ({
  signal, body, memory: emptyMemory(), activeApp: 'Code', now: new Date(2026, 9, 4, 3, 12),
});

describe('reflex', () => {
  it('텍스트·이름 부르기는 cortex까지 올린다', () => {
    expect(reflex({ kind: 'text', text: 'hi' }).salience).toBeGreaterThanOrEqual(ESCALATE_AT);
    expect(reflex({ kind: 'name-call' }).salience).toBeGreaterThanOrEqual(ESCALATE_AT);
  });

  it('큰 소리·앱 전환은 반사만 한다', () => {
    expect(reflex({ kind: 'loud' }).salience).toBeLessThan(ESCALATE_AT);
    expect(reflex({ kind: 'app', app: 'Safari' }).salience).toBeLessThan(ESCALATE_AT);
  });

  it('개발 앱이면 집중 자세', () => {
    expect(reflex({ kind: 'app', app: 'Code' })).toMatchObject({ emotion: 'focus', motion: 'think' });
  });

  it('새벽 시각만 숙고 대상, 낮 정각은 반사', () => {
    expect(reflex({ kind: 'clock', hour: 3 }).salience).toBeGreaterThanOrEqual(ESCALATE_AT);
    expect(reflex({ kind: 'clock', hour: 14 }).salience).toBeLessThan(ESCALATE_AT);
  });

  it('짧은 부재 복귀는 반사만', () => {
    expect(reflex({ kind: 'return', awaySec: 180 }).salience).toBeLessThan(ESCALATE_AT);
    expect(reflex({ kind: 'return', awaySec: 1800 }).salience).toBeGreaterThanOrEqual(ESCALATE_AT);
  });
});

describe('instinctThink', () => {
  it('부정적인 말에는 걱정하며 같이 고치자고 한다', () => {
    const out = instinctThink(ctx({ kind: 'text', text: '버그 때문에 힘들어' }));
    expect(out).toMatchObject({ source: 'text', emotion: 'worried', motion: 'shiver' });
    expect(out.say).toContain('질문?');
  });

  it('self 사고는 rng로 고른다', () => {
    expect(instinctThink(ctx({ kind: 'self' }), () => 0).motion).toBe('scuttle');
    expect(instinctThink(ctx({ kind: 'self' }), () => 0.99).motion).toBe('bounce');
  });

  it('정각 신호에는 신호의 시각을 말한다 (판단 시점이 낮이어도)', () => {
    const afternoon = { ...ctx({ kind: 'clock', hour: 3 }), now: new Date(2026, 9, 5, 16, 20) };
    const out = instinctThink(afternoon);
    expect(out.say).toContain('03시');
    expect(out.thought[0]).toBe('시스템 시계 03:00');
  });
});

describe('buildState', () => {
  it('신호·활성 앱·최근 대화를 jev state로 넣는다', () => {
    const c = ctx({ kind: 'text', text: '안녕' });
    c.memory = { ...c.memory, recent: [{ from: 'friend', text: '어제 고마웠어' }] };
    const state = buildState(c);
    expect(state).toMatchObject({ signal: 'text "안녕"', activeApp: 'Code', recent: ['친구: 어제 고마웠어'] });
  });
});
