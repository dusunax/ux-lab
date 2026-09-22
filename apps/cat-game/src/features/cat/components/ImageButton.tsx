import type { Ref } from 'react'
import { Sprite } from './Sprite'

interface Props {
  /** public/sprites 의 버튼 이미지 이름 (글자가 이미지에 포함되어 있다) */
  sprite: 'btn-start' | 'btn-select' | 'btn-decide' | 'btn-back' | 'btn-refresh'
  /** 이미지에 적힌 글자와 같은 접근성 라벨 */
  label: string
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  /** 표시 너비(px). 원본(약 250px)을 넘기지 않는다 */
  width?: number
  /** 높이(px)로 맞추고 싶을 때. 지정하면 width는 비율에 따라 자동으로 정해진다 */
  height?: number
  className?: string
  buttonRef?: Ref<HTMLButtonElement>
}

export function ImageButton({ sprite, label, onClick, type = 'button', disabled, width = 220, height, className, buttonRef }: Props) {
  return (
    <button ref={buttonRef} type={type} className={`img-btn${className ? ` ${className}` : ''}`} aria-label={label} onClick={onClick} disabled={disabled}>
      <Sprite name={sprite} {...(height ? { height } : { width })} draggable={false} />
    </button>
  )
}
