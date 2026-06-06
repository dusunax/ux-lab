// ─── 팔레트 ───────────────────────────────────────────────────────────────────
export const COLOR_DEEP    = '#000000'
export const COLOR_LIGHT   = '#caf0f8'
export const COLOR_SPREAD  = '#00b4d8'
export const COLOR_SURFACE = '#90e0ef'
export const COLOR_BIOLUM  = '#80ffdb'

// ─── 손 전체 연결 (MediaPipe Hands 21 landmarks) ─────────────────────────────
export const HAND_LINES: [number, number][] = [
  // 엄지
  [0, 1], [1, 2], [2, 3], [3, 4],
  // 검지
  [0, 5], [5, 6], [6, 7], [7, 8],
  // 중지
  [0, 9], [9, 10], [10, 11], [11, 12],
  // 약지
  [0, 13], [13, 14], [14, 15], [15, 16],
  // 소지
  [0, 17], [17, 18], [18, 19], [19, 20],
  // 손바닥
  [5, 9], [9, 13], [13, 17],
]

// ─── 손가락 끝 포인트 인덱스 ──────────────────────────────────────────────────
export const FINGERTIP_INDICES = [4, 8, 12, 16, 20] as const
export const INDEX_FINGER_TIP = 8

// ─── Trail / dotted frame 설정 ────────────────────────────────────────────────
export const HAND_FRAME_DOTS_PER_SEGMENT = 7
export const FINGERTIP_TRAIL_LENGTH = 52
export const FINGERTIP_TRAIL_COUNT = FINGERTIP_INDICES.length * 2
export const FINGERTIP_TRAIL_COLORS = [
  COLOR_LIGHT,
  COLOR_BIOLUM,
  COLOR_SURFACE,
  COLOR_BIOLUM,
  COLOR_LIGHT,
] as const

// ─── 파티클 ───────────────────────────────────────────────────────────────────
export const PLANKTON_COUNT   = 400
export const PLANKTON_RISE    = 0.0003
export const PLANKTON_PUSH_R  = 100
export const PLANKTON_PUSH_F  = 0.3
export const BIOLUM_ENERGY_TH = 0.6
export const BIOLUM_MAX_RATIO = 0.3
export const BUBBLE_COUNT     = 6
