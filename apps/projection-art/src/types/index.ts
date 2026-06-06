export type DemoType = 'particle-flow' | 'neon-tunnel' | 'audio-reactive' | 'hand-reactive' | 'pose-reactive'

export interface DemoInfo {
  id: DemoType
  label: string
  description: string
}

/** 기술 코드 ID → 자연어 표시 이름 매핑 */
export const DEMO_NATURAL_LABELS: Record<DemoType, string> = {
  'particle-flow': '빛나는 입자들',
  'neon-tunnel':   '빛의 통로',
  'audio-reactive':'소리로 그리기',
  'hand-reactive': '손으로 그리기',
  'pose-reactive': '온몸으로 그리기',
}

/** 기술 코드 ID → 자연어 설명 매핑 */
export const DEMO_DESCRIPTIONS: Record<DemoType, string> = {
  'particle-flow': '손을 움직이면 빛나는 입자들이 흘러요',
  'neon-tunnel':   '움직임에 따라 빛의 터널이 변해요',
  'audio-reactive':'음악에 맞춰 색과 형태가 춤춰요',
  'hand-reactive': '손을 들어 빛 입자를 조종해요',
  'pose-reactive': 'AI가 자세를 보고 색감을 바꿔줘요',
}

export interface InteractionPoint {
  x: number // 0–1 normalized screen coordinate
  y: number
  id?: string
}

export const DEMOS: DemoInfo[] = [
  { id: 'particle-flow', label: DEMO_NATURAL_LABELS['particle-flow'], description: DEMO_DESCRIPTIONS['particle-flow'] },
  { id: 'neon-tunnel',   label: DEMO_NATURAL_LABELS['neon-tunnel'],   description: DEMO_DESCRIPTIONS['neon-tunnel'] },
  { id: 'audio-reactive',label: DEMO_NATURAL_LABELS['audio-reactive'],description: DEMO_DESCRIPTIONS['audio-reactive'] },
  { id: 'hand-reactive', label: DEMO_NATURAL_LABELS['hand-reactive'], description: DEMO_DESCRIPTIONS['hand-reactive'] },
  { id: 'pose-reactive', label: DEMO_NATURAL_LABELS['pose-reactive'], description: DEMO_DESCRIPTIONS['pose-reactive'] },
]

export type PoseLabel =
  | 'arms-raised'
  | 'one-arm-raised'
  | 't-pose'
  | 'arms-wide'
  | 'standing'

export interface VisualParams {
  primaryColor: string
  accentColor: string
  particleDensity: number
  effectIntensity: number
  trailLength: number
}

export interface MousePosition {
  x: number
  y: number
  /** Normalized [0, 1] */
  nx: number
  ny: number
}

