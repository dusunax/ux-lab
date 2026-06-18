import { useState, useEffect } from 'react'
import { getImage } from './images'

export function useImageUrl(imageId: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!imageId) {
      setUrl(null)
      return
    }
    let objectUrl: string | null = null
    let cancelled = false

    getImage(imageId)
      .then((result) => {
        if (!cancelled && result) {
          objectUrl = result
          setUrl(result)
        }
      })
      .catch(() => { /* 이미지 없으면 null 유지 */ })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [imageId])

  return url
}
