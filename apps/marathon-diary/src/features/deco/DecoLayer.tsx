import { useState, useCallback, useRef, useEffect, memo } from 'react'
import { Decoration, RaceDecorations, StampAsset } from '../../types/decoration'
import { saveDecorations, getDecorations } from '../db/decorations'
import { STAMP_MAP } from './stamps'
import StampPicker from './StampPicker'

const MIN_SCALE = 0.5
const MAX_SCALE = 2.0
const SCALE_STEP = 0.25
const ROTATION_STEP = 15

function generateDecoId(): string {
  return `deco-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

interface DraggableItemProps {
  deco: Decoration
  isSelected: boolean
  onSelect: (id: string) => void
  onDragEnd: (id: string, x: number, y: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

const DraggableItem = memo(function DraggableItem({
  deco,
  isSelected,
  onSelect,
  onDragEnd,
  containerRef,
}: DraggableItemProps) {
  const asset = STAMP_MAP.get(deco.assetId)
  const isDragging = useRef(false)
  const dragStart = useRef({ mouseX: 0, mouseY: 0, decoX: 0, decoY: 0 })

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      onSelect(deco.id)
      isDragging.current = true
      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        decoX: deco.x,
        decoY: deco.y,
      }
    },
    [deco.id, deco.x, deco.y, onSelect]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const dx = ((e.clientX - dragStart.current.mouseX) / rect.width) * 100
      const dy = ((e.clientY - dragStart.current.mouseY) / rect.height) * 100
      const newX = Math.max(0, Math.min(100, dragStart.current.decoX + dx))
      const newY = Math.max(0, Math.min(100, dragStart.current.decoY + dy))
      onDragEnd(deco.id, newX, newY)
    },
    [deco.id, containerRef, onDragEnd]
  )

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  if (!asset) return null

  return (
    <button
      type="button"
      className="absolute touch-none select-none cursor-grab active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-gold rounded"
      style={{
        left: `${deco.x}%`,
        top: `${deco.y}%`,
        transform: `translate(-50%, -50%) rotate(${deco.rotation}deg) scale(${deco.scale})`,
        fontSize: '2rem',
        outline: isSelected ? '2px dashed #C9A84C' : undefined,
        outlineOffset: isSelected ? '2px' : undefined,
        zIndex: isSelected ? 10 : 1,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      aria-label={`${asset.label} 스티커, 위치 조정 가능`}
      aria-pressed={isSelected}
    >
      <span aria-hidden="true">{asset.emoji}</span>
    </button>
  )
})

interface Props {
  raceId: string
  readOnly?: boolean
}

export default function DecoLayer({ raceId, readOnly = false }: Props) {
  const [decos, setDecos] = useState<Decoration[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 저장된 데코레이션 로드
  useEffect(() => {
    const load = async () => {
      try {
        const saved = await getDecorations(raceId)
        if (saved) setDecos(saved.items)
      } catch {
        // 데코 없으면 빈 배열 유지
      }
    }
    void load()
  }, [raceId])

  const persistDecos = useCallback(
    async (items: Decoration[]) => {
      const record: RaceDecorations = { raceId, items }
      try {
        await saveDecorations(record)
      } catch {
        // 저장 실패 시 조용히 처리 (다음 조작 시 재시도됨)
      }
    },
    [raceId]
  )

  const handleAddStamp = useCallback(
    (asset: StampAsset) => {
      const newDeco: Decoration = {
        id: generateDecoId(),
        assetId: asset.id,
        x: 50,
        y: 50,
        rotation: 0,
        scale: 1.0,
      }
      setDecos((prev) => {
        const next = [...prev, newDeco]
        void persistDecos(next)
        return next
      })
      setSelectedId(newDeco.id)
      setShowPicker(false)
    },
    [persistDecos]
  )

  const handleDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      setDecos((prev) => {
        const next = prev.map((d) => (d.id === id ? { ...d, x, y } : d))
        void persistDecos(next)
        return next
      })
    },
    [persistDecos]
  )

  const handleRotate = useCallback(
    (delta: number) => {
      if (!selectedId) return
      setDecos((prev) => {
        const next = prev.map((d) =>
          d.id === selectedId ? { ...d, rotation: d.rotation + delta } : d
        )
        void persistDecos(next)
        return next
      })
    },
    [selectedId, persistDecos]
  )

  const handleScale = useCallback(
    (delta: number) => {
      if (!selectedId) return
      setDecos((prev) => {
        const next = prev.map((d) =>
          d.id === selectedId
            ? { ...d, scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, d.scale + delta)) }
            : d
        )
        void persistDecos(next)
        return next
      })
    },
    [selectedId, persistDecos]
  )

  const handleDelete = useCallback(() => {
    if (!selectedId) return
    setDecos((prev) => {
      const next = prev.filter((d) => d.id !== selectedId)
      void persistDecos(next)
      return next
    })
    setSelectedId(null)
  }, [selectedId, persistDecos])

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setSelectedId(null)
  }, [])

  const selectedDeco = decos.find((d) => d.id === selectedId)

  return (
    <div className="flex flex-col h-full">
      {/* 데코 오버레이 */}
      <div
        ref={containerRef}
        className="relative flex-1"
        onClick={handleContainerClick}
        aria-label="스티커 배치 영역"
        role="region"
      >
        {decos.map((deco) => (
          <DraggableItem
            key={deco.id}
            deco={deco}
            isSelected={deco.id === selectedId}
            onSelect={setSelectedId}
            onDragEnd={handleDragEnd}
            containerRef={containerRef}
          />
        ))}
      </div>

      {/* 컨트롤 바 */}
      {!readOnly && (
        <div
          className="flex flex-col border-t border-bark/10"
          role="toolbar"
          aria-label="스티커 편집 도구"
        >
          {/* 선택된 아이템 컨트롤 */}
          {selectedDeco && (
            <div className="flex items-center justify-between px-3 py-2 bg-cream-dark gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <ToolButton
                  onClick={() => handleRotate(-ROTATION_STEP)}
                  aria-label={`반시계 방향으로 ${ROTATION_STEP}도 회전`}
                >
                  ↺
                </ToolButton>
                <ToolButton
                  onClick={() => handleRotate(ROTATION_STEP)}
                  aria-label={`시계 방향으로 ${ROTATION_STEP}도 회전`}
                >
                  ↻
                </ToolButton>
                <span className="text-bark-light text-xs w-px bg-bark/20 h-5 mx-1" aria-hidden="true" />
                <ToolButton
                  onClick={() => handleScale(-SCALE_STEP)}
                  aria-label="스티커 축소"
                  disabled={selectedDeco.scale <= MIN_SCALE}
                >
                  −
                </ToolButton>
                <span className="text-bark text-xs min-w-8 text-center">
                  {Math.round(selectedDeco.scale * 100)}%
                </span>
                <ToolButton
                  onClick={() => handleScale(SCALE_STEP)}
                  aria-label="스티커 확대"
                  disabled={selectedDeco.scale >= MAX_SCALE}
                >
                  +
                </ToolButton>
              </div>
              <ToolButton
                onClick={handleDelete}
                aria-label="선택한 스티커 삭제"
                className="text-red-500 hover:bg-red-50"
              >
                삭제
              </ToolButton>
            </div>
          )}

          {/* 스티커 팔레트 토글 */}
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-bark-light text-xs">
              {decos.length > 0 ? `스티커 ${decos.length}개` : '스티커를 추가해보세요'}
            </span>
            <button
              type="button"
              className="btn-ghost text-sm flex items-center gap-1.5"
              onClick={() => setShowPicker((v) => !v)}
              aria-expanded={showPicker}
              aria-controls="stamp-picker"
            >
              <span aria-hidden="true">{showPicker ? '✕' : '＋'}</span>
              {showPicker ? '닫기' : '스티커 추가'}
            </button>
          </div>

          {showPicker && (
            <div id="stamp-picker">
              <StampPicker onSelect={handleAddStamp} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ToolButtonProps {
  onClick: () => void
  children: React.ReactNode
  'aria-label': string
  disabled?: boolean
  className?: string
}

function ToolButton({
  onClick,
  children,
  disabled,
  className = '',
  ...ariaProps
}: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 flex items-center justify-center rounded text-sm text-bark hover:bg-bark/10 disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-gold transition-colors ${className}`}
      {...ariaProps}
    >
      {children}
    </button>
  )
}
