export type DemoType = 'particle-flow' | 'neon-tunnel' | 'audio-reactive' | 'hand-reactive' | 'pose-reactive'

export interface DemoInfo {
  id: DemoType
  label: string
  naturalLabel: string
  description: string
}

export interface InteractionPoint {
  x: number // 0–1 normalized screen coordinate
  y: number
  id?: string
}

export const DEMOS: DemoInfo[] = [
  {
    id: 'particle-flow',
    label: '입자 흐름',
    naturalLabel: '빛나는 입자들',
    description: '손을 움직이면 빛나는 입자들이 흘러요',
  },
  {
    id: 'neon-tunnel',
    label: '빛의 통로',
    naturalLabel: '빛의 통로',
    description: '움직임에 따라 빛의 터널이 변해요',
  },
  {
    id: 'audio-reactive',
    label: '소리 그림',
    naturalLabel: '소리로 그리기',
    description: '음악에 맞춰 색과 형태가 춤춰요',
  },
  {
    id: 'hand-reactive',
    label: '손 그림자',
    naturalLabel: '손으로 그리기',
    description: '손을 들어 빛 입자를 조종해요',
  },
  {
    id: 'pose-reactive',
    label: '몸으로 그리기',
    naturalLabel: '온몸으로 그리기',
    description: 'AI가 자세를 보고 색감을 바꿔줘요',
  },
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

