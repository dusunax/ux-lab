import { Img, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { asset } from '../asset'

interface Props {
  /** public/sprites/의 파일명(확장자 포함) */
  name: string
  x: number
  y: number
  size?: number
  /** 등장을 늦추는 프레임 수 (여러 개를 순차적으로 팝인시킬 때) */
  delay?: number
  rotate?: number
}

/**
 * 화면에 흩뿌리는 작은 스프라이트 아이콘 하나. 과장된 스프링(overshoot)으로 통통 튀며 팝인하고,
 * 이후에도 계속 둥실둥실 흔들린다.
 */
export function SpriteDeco({ name, x, y, size = 88, delay = 0, rotate = 0 }: Props) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const local = Math.max(0, frame - delay)
  const pop = spring({ frame: local, fps, config: { damping: 7, mass: 0.6, stiffness: 160 }, durationInFrames: 16 })
  const bob = Math.sin((frame + delay) / 9) * 8
  const wiggle = Math.sin((frame + delay) / 14) * 6

  return (
    <Img
      src={asset(`sprites/${name}`)}
      style={{
        position: 'absolute',
        left: x,
        top: y + bob,
        width: size,
        height: size,
        objectFit: 'contain',
        opacity: Math.min(1, pop),
        transform: `scale(${pop}) rotate(${rotate + wiggle}deg)`,
        filter: 'drop-shadow(0 6px 10px rgba(90,50,10,0.25))',
      }}
    />
  )
}
