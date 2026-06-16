import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { RacePhotoSlot } from '../../types/race'
import { saveImage, getImage } from '../db/images'

const SLOT_LABELS: Record<RacePhotoSlot, string> = {
  bib: '배번호 사진',
  medal: '메달 사진',
  selfie: '셀카 사진',
}

const SLOT_ICONS: Record<RacePhotoSlot, string> = {
  bib: '📛',
  medal: '🏅',
  selfie: '🤳',
}

interface Props {
  slot: RacePhotoSlot
  imageId: string | undefined
  onSave: (imageId: string) => void
  readOnly?: boolean
}

export default memo(function PhotoSlot({ slot, imageId, onSave, readOnly = false }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // imageId가 있으면 IndexedDB에서 불러와 ObjectURL 생성
  useEffect(() => {
    if (!imageId) {
      setObjectUrl(null)
      return
    }

    let revoked = false
    const load = async () => {
      try {
        const url = await getImage(imageId)
        if (!revoked) setObjectUrl(url)
      } catch {
        if (!revoked) setError('이미지를 불러오지 못했습니다.')
      }
    }
    void load()

    return () => {
      revoked = true
      // ObjectURL 해제는 브라우저가 탭 닫을 때 처리; 컴포넌트 unmount 시 즉시 해제하지 않음
      // (같은 URL이 다른 곳에서도 사용될 수 있으므로)
    }
  }, [imageId])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setError(null)
      setLoading(true)
      try {
        const newId = `${slot}-${Date.now()}`
        await saveImage(newId, file)
        const url = URL.createObjectURL(file)
        setObjectUrl(url)
        onSave(newId)
      } catch {
        setError('이미지 저장에 실패했습니다.')
      } finally {
        setLoading(false)
        // input 값 초기화 (같은 파일 재선택 가능하도록)
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [slot, onSave]
  )

  const handleClick = useCallback(() => {
    if (!readOnly) inputRef.current?.click()
  }, [readOnly])

  const label = SLOT_LABELS[slot]
  const icon = SLOT_ICONS[slot]

  return (
    <div className="relative flex flex-col rounded-lg overflow-hidden border border-bark/20 bg-cream aspect-square">
      {/* 미리보기 영역 */}
      {objectUrl ? (
        <img
          src={objectUrl}
          alt={label}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 p-3">
          <span className="text-4xl" aria-hidden="true">{icon}</span>
          <p className="text-bark-light text-xs text-center">{label}</p>
          {!readOnly && (
            <p className="text-gold text-xs">눌러서 추가</p>
          )}
        </div>
      )}

      {/* 클릭 오버레이 (readOnly 아닐 때만) */}
      {!readOnly && (
        <>
          <button
            className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 transition-opacity bg-ink/20 flex items-center justify-center"
            onClick={handleClick}
            aria-label={`${label} ${objectUrl ? '변경' : '추가'}`}
            disabled={loading}
          >
            <span className="bg-white/90 text-ink text-xs px-2 py-1 rounded">
              {loading ? '저장 중…' : objectUrl ? '변경' : '사진 추가'}
            </span>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={handleFileChange}
            aria-label={`${label} 파일 선택`}
            tabIndex={-1}
          />
        </>
      )}

      {/* 슬롯 라벨 */}
      <div className="absolute top-1 left-1">
        <span className="bg-cream/80 text-bark-light text-xs px-1.5 py-0.5 rounded">
          {label}
        </span>
      </div>

      {error && (
        <div className="absolute bottom-0 inset-x-0 bg-red-600/80 text-white text-xs px-2 py-1 text-center" role="alert">
          {error}
        </div>
      )}
    </div>
  )
})
