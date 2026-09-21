import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ImageButton } from './ImageButton'

const EXAMPLES = [
  '초인종이 울렸다',
  '주인이 참치캔을 딴다',
  '낯선 택배 상자가 도착했다',
  '창밖에 새가 날아왔다',
  '주인이 갑자기 안아 올렸다',
  '청소기 소리가 켜졌다',
  '새 장난감이 생겼다',
  '낯선 고양이가 창밖에 나타났다',
  '주인이 집을 비운다',
  '천둥이 크게 쳤다',
]
const MAX_LENGTH = 100

/** 터치 기기(폰·태블릿)인가. 이 경우 자동 포커스를 하지 않아 키보드가 저절로 열리지 않는다 */
const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches

interface Props {
  disabled: boolean
  onSubmit: (situation: string) => void
}

export function ChatInput({ disabled, onSubmit }: Props) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const wasDisabled = useRef(disabled)

  // 결정이 끝나 입력이 다시 열리면 바로 이어서 쓸 수 있게 포커스를 돌려준다 (터치 기기는 제외)
  useEffect(() => {
    if (wasDisabled.current && !disabled && !isTouchDevice()) inputRef.current?.focus()
    wasDisabled.current = disabled
  }, [disabled])

  const send = (value: string) => {
    if (!value.trim() || disabled) return
    onSubmit(value)
    setText('')
    // 모바일에서는 전송하면 키보드를 닫아 채팅이 다 보이게 한다
    if (isTouchDevice()) inputRef.current?.blur()
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    send(text)
  }

  return (
    <div className="composer">
      <div className="chips" aria-label="빠른 예시">
        <div className="chips__track">
          {[0, 1].map((copy) => (
            <div key={copy} className="chips__set" aria-hidden={copy === 1}>
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" className="chip" disabled={disabled} tabIndex={copy === 1 ? -1 : undefined} onClick={() => send(ex)}>
                  {ex}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <form className="composer__form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          value={text}
          maxLength={MAX_LENGTH}
          placeholder="무슨 일이 생겼나요?"
          aria-label="고양이에게 벌어진 상황"
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          autoComplete="off"
        />
        <ImageButton type="submit" sprite="btn-decide" label="결정하기" width={104} disabled={disabled || !text.trim()} />
      </form>
    </div>
  )
}
