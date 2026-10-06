import { describe, expect, it } from 'vitest';
import { LIMITS, sanitizeMemory, sanitizeSignal } from './state';

describe('sanitizeMemory', () => {
  const now = new Date(2026, 9, 4, 12);

  it('같은 날이면 대화 수를 유지하고, 날이 바뀌면 초기화한다', () => {
    expect(sanitizeMemory({ day: '2026-10-04', turns: 5, recent: [] }, now).turns).toBe(5);
    expect(sanitizeMemory({ day: '2026-10-03', turns: 5, recent: [] }, now).turns).toBe(0);
  });

  it('무료 호출 수·jev 비용은 같은 날에만 이어지고, 엔진 선택은 날짜와 무관하게 유지된다', () => {
    expect(sanitizeMemory({ day: '2026-10-04', llmCalls: 12, paidUsd: 0.002 }, now)).toMatchObject({ llmCalls: 12, paidUsd: 0.002 });
    expect(sanitizeMemory({ day: '2026-10-03', llmCalls: 12, paidUsd: 0.002, engine: 'jev' }, now)).toMatchObject({ llmCalls: 0, paidUsd: 0, engine: 'jev' });
    expect(sanitizeMemory({ engine: 'gpt' }, now).engine).toBe('free');
  });

  it('형식이 틀린 기억 줄은 버리고 최근 N줄만 남긴다', () => {
    const recent = [{ from: 'hacker', text: 'x' }, ...Array.from({ length: 12 }, (_, i) => ({ from: 'friend', text: `t${i}` }))];
    const m = sanitizeMemory({ day: '2026-10-04', turns: 1, recent }, now);
    expect(m.recent).toHaveLength(LIMITS.recentMax);
    expect(m.recent.every((r) => r.from === 'friend')).toBe(true);
  });

  it('쓰레기 값이면 빈 기억', () => {
    expect(sanitizeMemory('nope', now)).toMatchObject({ turns: 0, recent: [] });
  });
});

describe('sanitizeSignal', () => {
  it('허용 필드만 남긴다', () => {
    expect(sanitizeSignal({ kind: 'hum', hz: 220.4, app: 'x', evil: true })).toEqual({ kind: 'hum', hz: 220 });
  });

  it('알 수 없는 종류나 빈 텍스트는 거부한다', () => {
    expect(sanitizeSignal({ kind: 'telepathy' })).toBeNull();
    expect(sanitizeSignal({ kind: 'text', text: '   ' })).toBeNull();
  });
});
