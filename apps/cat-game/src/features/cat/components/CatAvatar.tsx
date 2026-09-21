import type { CSSProperties } from 'react'
import type { CatTypeId } from '../catTypes'
import type { Expression } from '../expression'

/** 표정별 스프라이트 (public/sprites, scripts/slice-sprites.py 로 생성) */
const SPRITE: Record<Expression, string> = {
  idle: 'cat-idle',
  happy: 'cat-happy',
  excited: 'cat-excited',
  curious: 'cat-curious',
  scared: 'cat-scared',
  angry: 'cat-angry',
  sleepy: 'cat-sleep',
  meh: 'cat-back',
  eat: 'cat-eat',
  think: 'cat-think',
  curled: 'cat-curled',
}

/** 시트에는 주황 고양이뿐이라 타입별로 색조 필터를 적용한다 */
const TYPE_FILTER: Record<CatTypeId, string> = {
  glutton: 'none',
  timid: 'grayscale(1) brightness(0.9)',
  aloof: 'grayscale(1) brightness(1.3) contrast(0.95)',
  explorer: 'hue-rotate(85deg) saturate(0.8)',
  playful: 'sepia(0.5) hue-rotate(-12deg) saturate(1.7)',
}

export const spriteUrl = (name: string) => `${import.meta.env.BASE_URL}sprites/${name}.png`

interface Props {
  typeId: CatTypeId
  expression?: Expression
  size?: number
  /** true면 타입별 프로필 이미지 (선택 화면·채팅·기록용) */
  profile?: boolean
  className?: string
}

export function CatAvatar({ typeId, expression = 'idle', size = 140, profile = false, className }: Props) {
  const style: CSSProperties = { objectFit: 'contain', filter: TYPE_FILTER[typeId] }
  return (
    <img
      src={spriteUrl(profile ? `profile-${typeId}` : SPRITE[expression])}
      width={size}
      height={size}
      style={style}
      className={className}
      alt=""
      draggable={false}
    />
  )
}

/** 채팅 말풍선용 얼굴 아이콘 (시트의 얼굴 아이콘 줄, 타입별 색) */
export function CatFace({ typeId, size = 42, className }: { typeId: CatTypeId; size?: number; className?: string }) {
  return <img src={spriteUrl(`face-${typeId}`)} width={size} height={size} className={className} alt="" draggable={false} />
}
