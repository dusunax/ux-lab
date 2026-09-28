import { describe, expect, it } from 'vitest';
import { normalizeSpaceId, spaceUrl } from './space-id';

describe('normalizeSpaceId', () => {
  it.each([
    ['spaces/AAQAjcBG2QA', 'spaces/AAQAjcBG2QA'],
    ['AAQAjcBG2QA', 'spaces/AAQAjcBG2QA'],
    ['  AAQA-jc_BG  ', 'spaces/AAQA-jc_BG'],
    ['https://chat.google.com/room/AAQAjcBG2QA', 'spaces/AAQAjcBG2QA'],
    ['https://chat.google.com/room/AAQAjcBG2QA?cls=7', 'spaces/AAQAjcBG2QA'],
    ['https://mail.google.com/chat/u/0/#chat/space/AAQAjcBG2QA', 'spaces/AAQAjcBG2QA'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeSpaceId(input)).toBe(expected);
  });

  it.each(['', '   ', 'hello world', 'https://example.com/?a=b'])('인식 불가: %j', (input) => {
    expect(normalizeSpaceId(input)).toBeNull();
  });
});

describe('spaceUrl', () => {
  it('Chat room URL을 만든다', () => {
    expect(spaceUrl('spaces/AAQAjcBG2QA')).toBe('https://chat.google.com/room/AAQAjcBG2QA');
  });

  it('잘못된 ID는 거부한다', () => {
    expect(() => spaceUrl('spaces/../evil')).toThrow();
  });
});
