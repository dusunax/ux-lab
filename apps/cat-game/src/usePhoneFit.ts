import { useEffect, type RefObject } from 'react'

/** 데스크톱에서 보이는 폰 프레임의 고정 크기(테두리 포함) */
const PHONE_WIDTH = 410
const PHONE_HEIGHT = 864
/** index.css 의 폰 프레임 조건과 같아야 한다 (마우스가 있는 데스크톱만) */
const FRAME_QUERY = '(min-width: 1024px) and (hover: hover) and (pointer: fine)'
const TOP_MARGIN = 16
const GROUND_GAP = 10
/** 잔디 띠 높이(index.css 의 .backdrop__ground 와 같은 vw 비율) */
const GROUND_VW = 0.046

/**
 * 창이 폰 프레임보다 작으면 프레임 전체를 비율대로 줄여 페이지 스크롤이 생기지 않게 한다.
 * (zoom은 레이아웃 크기도 함께 줄어든다. 실제 폰 크기(430px 미만)에서는 전체 화면이라 적용하지 않는다.)
 */
export function usePhoneFit(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const fit = () => {
      const el = ref.current
      if (!el) return
      if (!window.matchMedia(FRAME_QUERY).matches) {
        el.style.removeProperty('zoom')
        return
      }
      const bottom = window.innerWidth * GROUND_VW + GROUND_GAP
      const scale = Math.min(1, (window.innerHeight - TOP_MARGIN - bottom) / PHONE_HEIGHT, (window.innerWidth - 32) / PHONE_WIDTH)
      el.style.setProperty('zoom', String(scale))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [ref])
}
