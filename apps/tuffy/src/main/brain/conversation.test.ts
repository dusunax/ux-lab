import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LogLine } from '../../shared/state';
import { Brain } from './brain';
import type { Decider } from './decide/deciders';

const newBrain = () => {
  const brain = new Brain({ dailyBudget: 40, paidCapUsd: 0.05 });
  const logs: LogLine[] = [];
  brain.on('log', (l) => logs.push(l));
  return { brain, logs };
};

describe('대화 창', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('이름을 부르면 60초 동안 대화 중, 조용하면 끝난다', () => {
    const { brain } = newBrain();
    brain.sense({ kind: 'name-call' });
    expect(brain.inConversation).toBe(true);
    vi.advanceTimersByTime(59_000);
    expect(brain.inConversation).toBe(true);
    vi.advanceTimersByTime(2_000);
    expect(brain.inConversation).toBe(false);
  });

  it('주고받아도 부른 뒤 3분이 지나면 무조건 끝난다 (다시 부르면 새로 시작)', () => {
    const { brain } = newBrain();
    brain.sense({ kind: 'name-call' });
    for (let t = 50_000; t < 180_000; t += 50_000) {
      vi.advanceTimersByTime(50_000);
      // 이름 없는 말이지만 대화 창 안이라 이어 가기
      brain.sense({ kind: 'speech', text: '그리고 오늘 회의도 길었어' });
      expect(brain.inConversation).toBe(true);
    }
    vi.advanceTimersByTime(31_000); // 부른 지 181초
    expect(brain.inConversation).toBe(false);
    brain.sense({ kind: 'speech', text: '터피야 듣고 있어?', addressed: true });
    expect(brain.inConversation).toBe(true);
  });

  it('대화 창 밖의 이름 없는 말은 대화를 열지 않는다', () => {
    const { brain } = newBrain();
    brain.sense({ kind: 'speech', text: '회의 몇 시였지' });
    expect(brain.inConversation).toBe(false);
  });
});

describe('말소리로 생각 멈추기', () => {
  it('생각 중에 말소리가 시작되면 요청을 취소하고 행동하지 않는다', async () => {
    const { brain, logs } = newBrain();
    let aborted = false;
    // 중단될 때까지 끝나지 않는 엔진
    const hanging: Decider = {
      decide: (_qs, _state, _persona, signal) => new Promise((_, reject) => {
        signal?.addEventListener('abort', () => { aborted = true; reject(new Error('중단됨')); });
      }),
    };
    brain.setEngines({ free: hanging, voice: null, jev: null, jevKey: () => null });
    const acts: unknown[] = [];
    brain.on('act', (a) => acts.push(a));
    brain.sense({ kind: 'text', text: '터피야 오늘 날씨 어때?' });
    await new Promise((r) => setTimeout(r, 10));
    brain.interrupt('말소리 시작');
    await new Promise((r) => setTimeout(r, 10));
    expect(aborted).toBe(true);
    expect(acts).toHaveLength(0);
    expect(logs.some((l) => l.text.includes('생각 멈추고 듣기'))).toBe(true);
    expect(brain.inConversation).toBe(true);
    // 생각 중이 아니면 아무 일도 없다
    brain.interrupt('말소리 시작');
    expect(logs.filter((l) => l.text.includes('생각 멈추고 듣기'))).toHaveLength(1);
  });
});
