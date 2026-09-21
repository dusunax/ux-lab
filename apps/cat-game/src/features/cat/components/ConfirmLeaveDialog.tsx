import { useEffect, useRef } from 'react'
import { josa } from 'es-hangul'
import type { CatTypeId } from '../catTypes'
import { CatAvatar } from './CatAvatar'
import { ImageButton } from './ImageButton'

/** 두 버튼의 원본 비율이 달라 높이를 맞춘다 (원본 60·88px 이하) */
const DIALOG_BUTTON_HEIGHT = 52

interface Props {
  typeId: CatTypeId
  catName: string
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmLeaveDialog({ typeId, catName, onCancel, onConfirm }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="modal" onClick={onCancel}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="leave-title" aria-describedby="leave-desc" onClick={(e) => e.stopPropagation()}>
        <CatAvatar typeId={typeId} expression="curled" size={120} className="dialog__cat" />
        <h2 id="leave-title">성격 선택 화면으로 돌아가시겠습니까?</h2>
        <p id="leave-desc" className="dialog__warn">{josa(catName, '와/과')} 다시 만날 수 없어요.</p>
        <div className="dialog__actions">
          {/* 왼쪽: 취소하고 게임으로 돌아간다, 오른쪽: 성격 선택으로 돌아간다(다시하기) */}
          <ImageButton buttonRef={cancelRef} sprite="btn-back" label="돌아가기" onClick={onCancel} height={DIALOG_BUTTON_HEIGHT} />
          <ImageButton sprite="btn-refresh" label="다시하기" onClick={onConfirm} height={DIALOG_BUTTON_HEIGHT} />
        </div>
      </div>
    </div>
  )
}
