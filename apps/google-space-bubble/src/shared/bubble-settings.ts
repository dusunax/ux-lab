export const BUBBLE_POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left'] as const;
export type BubblePosition = (typeof BUBBLE_POSITIONS)[number];

export const BUBBLE_DISPLAYS = ['cursor', 'primary'] as const;
export type BubbleDisplay = (typeof BUBBLE_DISPLAYS)[number];

export const MASCOTS = [
  { value: 'wave', label: '인사' },
  { value: 'phone', label: '폰 보기' },
  { value: 'custom', label: '내 이미지' },
  { value: 'none', label: '없음' },
] as const;
export type Mascot = (typeof MASCOTS)[number]['value'];

export const FONT_SIZES = [
  { value: 12, label: '작게' },
  { value: 13, label: '보통' },
  { value: 15, label: '크게' },
  { value: 17, label: '아주 크게' },
] as const;

/** 0 = 직접 닫을 때까지 유지 */
export const DURATIONS = [
  { value: 5, label: '5초' },
  { value: 10, label: '10초' },
  { value: 30, label: '30초' },
  { value: 0, label: '닫을 때까지' },
] as const;

export type BubbleSettings = {
  bubbleDurationSec: number;
  bubbleFontSize: number;
  bubblePosition: BubblePosition;
  bubbleDisplay: BubbleDisplay;
  mascot: Mascot;
  /** 내가 보낸 메시지도 알림할지 */
  includeOwnMessages: boolean;
};

export const DEFAULT_BUBBLE_SETTINGS: BubbleSettings = {
  bubbleDurationSec: 10,
  bubbleFontSize: 13,
  bubblePosition: 'bottom-right',
  bubbleDisplay: 'cursor',
  mascot: 'wave',
  includeOwnMessages: true,
};

const BASE_FONT = 13;
const BASE_WIDTH = 360;
const BASE_HEIGHT = 520;

/** 글자 크기에 비례한 Bubble 창 크기 */
export function bubbleWindowSize(fontSize: number): { width: number; height: number } {
  const scale = fontSize / BASE_FONT;
  return { width: Math.round(BASE_WIDTH * scale), height: Math.round(BASE_HEIGHT * scale) };
}

/** Renderer에서 들어온 설정 변경 값 검증. 유효한 필드만 남긴다. */
export function sanitizeBubbleSettings(input: unknown): Partial<BubbleSettings> {
  if (typeof input !== 'object' || input === null) return {};
  const src = input as Record<string, unknown>;
  const out: Partial<BubbleSettings> = {};
  if (FONT_SIZES.some((f) => f.value === src.bubbleFontSize)) out.bubbleFontSize = src.bubbleFontSize as number;
  if (BUBBLE_POSITIONS.includes(src.bubblePosition as BubblePosition)) {
    out.bubblePosition = src.bubblePosition as BubblePosition;
  }
  if (BUBBLE_DISPLAYS.includes(src.bubbleDisplay as BubbleDisplay)) {
    out.bubbleDisplay = src.bubbleDisplay as BubbleDisplay;
  }
  if (MASCOTS.some((m) => m.value === src.mascot)) out.mascot = src.mascot as Mascot;
  if (typeof src.includeOwnMessages === 'boolean') out.includeOwnMessages = src.includeOwnMessages;
  if (DURATIONS.some((d) => d.value === src.bubbleDurationSec)) out.bubbleDurationSec = src.bubbleDurationSec as number;
  return out;
}
