export type DemoType = 'particle-flow' | 'neon-tunnel' | 'audio-reactive'

export interface DemoInfo {
  id: DemoType
  label: string
  description: string
}

export const DEMOS: DemoInfo[] = [
  {
    id: 'particle-flow',
    label: 'Demo A — Particle Flow',
    description: '마우스 움직임을 따라 파티클이 생성·확산되는 인터랙티브 비주얼',
  },
  {
    id: 'neon-tunnel',
    label: 'Demo B — Neon Tunnel',
    description: '마우스 입력으로 시점·왜곡이 변화하는 3D 네온 터널',
  },
  {
    id: 'audio-reactive',
    label: 'Demo C — Audio Reactive',
    description: '음악과 마우스 입력이 결합된 오디오 반응형 비주얼',
  },
]

export interface MousePosition {
  x: number
  y: number
  /** Normalized [0, 1] */
  nx: number
  ny: number
}

export interface AudioAnalyzerState {
  isActive: boolean
  frequencyData: Uint8Array
  averageAmplitude: number
  bassAmplitude: number
  midAmplitude: number
  trebleAmplitude: number
}
