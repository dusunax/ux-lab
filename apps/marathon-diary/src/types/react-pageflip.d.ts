declare module 'react-pageflip' {
  import { Component, ReactNode, CSSProperties, ForwardRefExoticComponent, RefAttributes } from 'react'

  interface HTMLFlipBookProps {
    width: number
    height: number
    size?: 'fixed' | 'stretch'
    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number
    drawShadow?: boolean
    flippingTime?: number
    usePortrait?: boolean
    startZIndex?: number
    autoSize?: boolean
    maxShadowOpacity?: number
    showCover?: boolean
    mobileScrollSupport?: boolean
    clickEventForward?: boolean
    useMouseEvents?: boolean
    swipeDistance?: number
    showPageCorners?: boolean
    disableFlipByClick?: boolean
    startPage?: number
    renderOnlyPageLengthChange?: boolean
    className?: string
    style?: CSSProperties
    children: ReactNode
    onFlip?: (e: { data: number }) => void
    onChangeOrientation?: (e: { data: string }) => void
    onChangeState?: (e: { data: string }) => void
    onInit?: (e: { data: { page: number; mode: string } }) => void
    onUpdate?: (e: { data: { page: number; mode: string } }) => void
  }

  interface PageFlipInstance {
    flipNext: (corner?: 'top' | 'bottom') => void
    flipPrev: (corner?: 'top' | 'bottom') => void
    turnToPage: (pageNum: number) => void
    turnToNextPage: () => void
    turnToPrevPage: () => void
    flip: (pageNum: number, corner?: 'top' | 'bottom') => void
    getCurrentPageIndex: () => number
    getPageCount: () => number
    getOrientation: () => 'portrait' | 'landscape'
    destroy: () => void
  }

  interface HTMLFlipBookRef {
    pageFlip: () => PageFlipInstance
  }

  const HTMLFlipBook: ForwardRefExoticComponent<HTMLFlipBookProps & RefAttributes<HTMLFlipBookRef>>
  export default HTMLFlipBook
}
