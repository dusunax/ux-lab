import { useCallback, memo } from 'react'
import { saveImage } from '../db/images'
import { useImageUrl } from '../db/useImageUrl'

interface Props {
  value: string
  onChange: (bib: string) => void
  photoId: string | undefined
  onPhotoSave: (imageId: string) => void
}

export default memo(function BibInput({ value, onChange, photoId, onPhotoSave }: Props) {
  const previewUrl = useImageUrl(photoId)

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
          className="relative overflow-hidden border-2 border-dashed border-bark/30 rounded-lg cursor-pointer hover:border-gold transition-colors focus-within:ring-2 focus-within:ring-gold"
          aria-label="배번 사진 촬영 또는 업로드"
        >
          {previewUrl ? (
            <>
              <img src={previewUrl} alt="배번 사진 미리보기" className="w-full max-h-48 object-cover" />
              <div className="absolute inset-0 bg-ink/40 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-white" aria-hidden="true">
                  <path d="M14.5 4H9.5L7 7H4a1 1 0 00-1 1v10a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1h-3L14.5 4z"/>
                  <circle cx="12" cy="13" r="3"/>
                </svg>
                <span className="text-white text-sm font-medium">다시 촬영</span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center gap-2 px-4 py-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-bark/50 flex-shrink-0" aria-hidden="true">
                <path d="M14.5 4H9.5L7 7H4a1 1 0 00-1 1v10a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1h-3L14.5 4z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
              <span className="text-bark text-sm">카메라로 배번 촬영</span>
            </div>
          )}
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
