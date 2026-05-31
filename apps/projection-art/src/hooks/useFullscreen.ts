import { useState, useCallback, useEffect } from 'react'

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const enter = useCallback(() => {
    document.documentElement.requestFullscreen().catch(() => {
      // Ignore fullscreen request errors (e.g., not triggered by user gesture)
    })
  }, [])

  const exit = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }, [])

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      exit()
    } else {
      enter()
    }
  }, [enter, exit])

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  return { isFullscreen, enter, exit, toggle }
}
