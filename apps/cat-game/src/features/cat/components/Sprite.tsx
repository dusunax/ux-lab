import { useState, type CSSProperties, type ImgHTMLAttributes } from 'react'
import { SPRITE_SIZES } from '../spriteSizes'

export const spriteUrl = (name: string) => `${import.meta.env.BASE_URL}sprites/${name}.png`
export const backgroundUrl = (name: string) => `${import.meta.env.BASE_URL}backgrounds/${name}.webp`

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height' | 'onLoad'> {
  /** public/sprites(또는 background일 때 public/backgrounds)의 파일 이름(확장자 제외) */
  name: string
  background?: boolean
  width?: number
  height?: number
  /** width/height를 둘 다 생략했을 때 쓰는 정사각형 크기 */
  size?: number
  style?: CSSProperties
  /** true면 즉시·우선 로드한다(loading="eager" + fetchPriority="high"). 최초 화면에서 바로 보이는
   * 핵심 이미지(예: 랜딩의 히어로 고양이)에만 쓰고, 그 외에는 기본값(지연 로드)을 쓴다 */
  priority?: boolean
}

/**
 * <img>를 대체하는 스프라이트 컴포넌트 (이 프로젝트는 Vite+React라 next/image가 없어, 그 핵심 동작을 직접 구현한다).
 * width/height 중 하나만 주어지면 spriteSizes.ts(원본 픽셀 크기)의 가로세로비로 나머지를 계산해
 * 항상 두 값을 HTML 속성으로 내려보낸다 (레이아웃 쉬프트 방지, 네트워크 왕복 불필요).
 * 로드 전에는 은은한 shimmer 배경을 보여주고, 로드되면 opacity 트랜지션으로 페이드인한다.
 * priority가 아니면 기본적으로 지연 로드(loading="lazy")한다.
 * className/style은 그대로 실제 <img>에 전달되므로 기존 CSS 선택자(태그 선택자 포함)가 그대로 적용된다.
 */
export function Sprite({ name, background = false, width, height, size, alt = '', className, draggable = false, style, priority = false, ...rest }: Props) {
  const [loaded, setLoaded] = useState(false)
  const natural = SPRITE_SIZES[background ? `bg-${name}` : name]
  const ratio = natural ? natural[0] / natural[1] : 1

  let boxWidth = width
  let boxHeight = height
  if (boxWidth === undefined && boxHeight === undefined) {
    boxWidth = boxHeight = size ?? 48
  } else if (boxWidth === undefined) {
    boxWidth = Math.round((boxHeight as number) * ratio)
  } else if (boxHeight === undefined) {
    boxHeight = Math.round(boxWidth / ratio)
  }

  return (
    <img
      {...rest}
      src={background ? backgroundUrl(name) : spriteUrl(name)}
      alt={alt}
      width={boxWidth}
      height={boxHeight}
      draggable={draggable}
      style={style}
      className={`sprite-img${loaded ? ' is-loaded' : ''}${className ? ` ${className}` : ''}`}
      onLoad={() => setLoaded(true)}
      decoding="async"
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
    />
  )
}
