import { describe, expect, it } from 'vitest';
import { LINES, LINE_IDS, NO_FIT } from './lines';
import { REPLY_MIN_CONFIDENCE, REPLY_MIN_P, pickReply } from './mind';

describe('터피 대답 모음', () => {
  it('jev choice 보기 한도(255) 안이고, 원형 화면 한 줄(24자)에 들어간다', () => {
    expect(LINE_IDS.length + 1).toBeLessThanOrEqual(255);
    const long = LINE_IDS.filter((id) => LINES[id].say.length > 24);
    expect(long).toEqual([]);
  });

  it('물음("화났어?")과 상태("화났어.")를 나눠 둔다', () => {
    for (const s of ['angry', 'sleepy', 'hungry', 'bored', 'okay', 'tired', 'sick', 'happy', 'scared', 'lonely', 'busy']) {
      expect(LINE_IDS).toContain(`ask.${s}`);
      expect(LINE_IDS).toContain(`feel.${s}`);
    }
  });

  it('none은 대답 아이디와 겹치지 않는다', () => {
    expect(LINE_IDS).not.toContain(NO_FIT);
  });
});

describe('pickReply', () => {
  const ans = (choice: string, p: number, confidence: number | null = 0.8) =>
    ({ choice, probabilities: { [choice]: p }, confidence }) as never;

  it('확률·확신이 기준 이상이면 모음 문장', () => {
    expect(pickReply(ans('greet.hi', 0.6))).toEqual({ use: 'line', text: LINES['greet.hi'].say, id: 'greet.hi', p: 0.6 });
  });

  it('none이거나 확률·확신이 낮으면 LLM', () => {
    expect(pickReply(ans(NO_FIT, 0.9)).use).toBe('llm');
    expect(pickReply(ans('greet.hi', REPLY_MIN_P - 0.01)).use).toBe('llm');
    expect(pickReply(ans('greet.hi', 0.6, REPLY_MIN_CONFIDENCE - 0.01)).use).toBe('llm');
  });
});
