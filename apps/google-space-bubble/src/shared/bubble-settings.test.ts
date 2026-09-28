import { describe, expect, it } from 'vitest';
import { bubbleWindowSize, sanitizeBubbleSettings } from './bubble-settings';

describe('sanitizeBubbleSettings', () => {
  it('유효한 값만 남긴다', () => {
    expect(
      sanitizeBubbleSettings({
        bubbleFontSize: 15,
        bubblePosition: 'top-left',
        bubbleDisplay: 'primary',
        mascot: 'phone',
        bubbleDurationSec: 0,
        includeOwnMessages: false,
        extra: 1,
      }),
    ).toEqual({
      bubbleFontSize: 15,
      bubblePosition: 'top-left',
      bubbleDisplay: 'primary',
      mascot: 'phone',
      bubbleDurationSec: 0,
      includeOwnMessages: false,
    });
  });

  it.each([null, 'x', 42, { bubbleFontSize: 99 }, { bubblePosition: 'center' }, { bubbleDisplay: 'all' }, { mascot: 'cat' }, { bubbleDurationSec: 7 }, { includeOwnMessages: 'yes' }])(
    '잘못된 값은 버린다: %j',
    (input) => {
      expect(sanitizeBubbleSettings(input)).toEqual({});
    },
  );
});

describe('bubbleWindowSize', () => {
  it('기본 글자 크기에서 360×520', () => {
    expect(bubbleWindowSize(13)).toEqual({ width: 360, height: 520 });
  });

  it('글자 크기에 비례해 커진다', () => {
    expect(bubbleWindowSize(17).width).toBeGreaterThan(360);
  });
});
