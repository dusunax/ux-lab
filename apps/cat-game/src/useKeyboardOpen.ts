import { useEffect, useState } from 'react'

/** 키보드로 보이는 높이가 이만큼 이상 줄면 열린 것으로 본다 */
const KEYBOARD_MIN_DELTA = 120

/**
 * 터치 기기에서 소프트 키보드가 열렸는지 알려주고, 보이는 영역 높이(--vvh)와 위쪽 오프셋(--vv-top)을 CSS 변수로 내려준다.
 * - 키보드가 열리면 화면 높이가 줄어드는 만큼 레이아웃도 줄어든다(iOS Safari는 레이아웃 뷰포트가 그대로라 별도 처리가 필요하다).
 * - 데스크톱(마우스)에서는 아무것도 하지 않는다.
 */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv || !window.matchMedia('(pointer: coarse)').matches) return
    const root = document.documentElement
    let baseline = vv.height // 키보드가 닫혀 있을 때의 높이
    let lastWidth = window.innerWidth

    const isTyping = () => document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement

    const update = () => {
      if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth // 화면 회전
        baseline = vv.height
      }
      baseline = Math.max(baseline, vv.height)
      root.style.setProperty('--vvh', `${vv.height}px`)
      root.style.setProperty('--vv-top', `${vv.offsetTop}px`)
      setOpen(isTyping() && baseline - vv.height > KEYBOARD_MIN_DELTA)
    }

    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    // focusout 시점에는 document.activeElement 가 아직 이전 요소라, 한 틱 뒤에 다시 판정한다
    const updateSoon = () => setTimeout(update, 0)
    window.addEventListener('focusin', updateSoon)
    window.addEventListener('focusout', updateSoon)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      window.removeEventListener('focusin', updateSoon)
      window.removeEventListener('focusout', updateSoon)
      root.style.removeProperty('--vvh')
      root.style.removeProperty('--vv-top')
    }
  }, [])

  return open
}
