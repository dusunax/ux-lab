import { useCallback, memo } from 'react'
import { saveImage } from '../db/images'

interface Props {
  value: string
  onChange: (bib: string) => void
  photoId: string | undefined
  onPhotoSave: (imageId: string) => void
}

export default memo(function BibInput({ value, onChange, photoId, onPhotoSave }: Props) {
  const handleCameraCapture = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      try {
        const newId = `bib-photo-${Date.now()}`
        await saveImage(newId, file)
        onPhotoSave(newId)
      } catch {
        // 사진 저장 실패는 조용히 처리 (배번 수동 입력은 계속 가능)
      }
      e.target.value = ''
    },
    [onPhotoSave]
  )

  const handleBibChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6)
      onChange(cleaned)
    },
    [onChange]
  )

  return (
    <div className="flex flex-col gap-4">
      {/* 배번호 수동 입력 */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="bib-number" className="text-bark text-sm font-medium">
          배번호 <span className="text-bark-light font-normal">(숫자만, 최대 6자리)</span>
        </label>
        <input
          id="bib-number"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={handleBibChange}
          placeholder="예: 12345"
          className="w-full border border-bark/30 rounded-lg px-4 py-3 text-3xl font-handwriting text-center text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-gold placeholder:text-bark/30"
          aria-label="배번호 입력"
          maxLength={6}
        />
      </div>

      {/* 배번 사진 촬영 */}
      <div className="flex flex-col gap-1.5">
        <span className="text-bark text-sm font-medium">배번 사진 촬영</span>
        <label
          className="flex items-center justify-center gap-2 border-2 border-dashed border-bark/30 rounded-lg px-4 py-3 cursor-pointer hover:border-gold hover:bg-gold/5 transition-colors focus-within:ring-2 focus-within:ring-gold"
          aria-label="배번 사진 촬영 또는 업로드"
        >
          <span className="text-2xl" aria-hidden="true">{photoId ? '✅' : '📷'}</span>
          <span className="text-bark text-sm">
            {photoId ? '사진이 저장됨 (다시 촬영)' : '카메라로 배번 촬영'}
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={handleCameraCapture}
            aria-hidden="true"
            tabIndex={-1}
          />
        </label>
      </div>
    </div>
  )
})
