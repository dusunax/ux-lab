import { useState, useCallback, useRef, useEffect, memo } from 'react'
import { createPortal } from 'react-dom'
import { Decoration, RaceDecorations, StampAsset } from '../../types/decoration'
import { saveDecorations, getDecorations } from '../db/decorations'
import { STAMP_MAP } from './stamps'
import StampPicker from './StampPicker'

function generateDecoId(): string {
  return `deco-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

interface DraggableItemProps {
  deco: Decoration
  containerRef: React.RefObject<HTMLDivElement | null>
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onMove: (id: string, x: number, y: number) => void
  onDrop: (id: string, clientX: number, clientY: number) => void
}

const DraggableItem = memo(function DraggableItem({
  deco,
  containerRef,
  onDragStart,
  onDragEnd,
  onMove,
  onDrop,
}: DraggableItemProps) {
  const asset = STAMP_MAP.get(deco.assetId)
  const isDragging = useRef(false)
  const dragStart = useRef({ mouseX: 0, mouseY: 0, decoX: 0, decoY: 0 })

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLSpanElement>) => {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      onDragStart(deco.id)
      isDragging.current = true
      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        decoX: deco.x,
        decoY: deco.y,
      }
    },
    [deco.id, deco.x, deco.y, onDragStart]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLSpanElement>) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const dx = ((e.clientX - dragStart.current.mouseX) / rect.width) * 100
      const dy = ((e.clientY - dragStart.current.mouseY) / rect.height) * 100
      const newX = Math.max(0, Math.min(100, dragStart.current.decoX + dx))
      const newY = Math.max(0, Math.min(100, dragStart.current.decoY + dy))
      onMove(deco.id, newX, newY)
    },
    [deco.id, containerRef, onMove]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLSpanElement>) => {
      if (!isDragging.current) return
      isDragging.current = false
      onDrop(deco.id, e.clientX, e.clientY)
      onDragEnd()
    },
    [deco.id, onDrop, onDragEnd]
  )

  const handlePointerCancel = useCallback(() => {
    isDragging.current = false
    onDragEnd()
  }, [onDragEnd])

  if (!asset) return null

  return (
    <span
      role="img"
      aria-label={`${asset.label} 스티커, 위치 조정 가능`}
      className="absolute touch-none select-none cursor-grab active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-gold rounded"
      style={{
        left: `${deco.x}%`,
        top: `${deco.y}%`,
        transform: `translate(-50%, -50%) rotate(${deco.rotation}deg) scale(${deco.scale})`,
        fontSize: '2rem',
        pointerEvents: 'auto',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {asset.emoji}
    </span>
  )
})

interface Props {
  raceId: string
  readOnly?: boolean
  showPicker?: boolean
  onPickerChange?: (v: boolean) => void
}

export default function DecoLayer({ raceId, readOnly = false, showPicker = false }: Props) {
  const [decos, setDecos] = useState<Decoration[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [newStampDrag, setNewStampDrag] = useState<{ asset: StampAsset; x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const trashRef = useRef<HTMLDivElement>(null)
  const isDraggingNew = useRef(false)
  const newStampAssetRef = useRef<StampAsset | null>(null)

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
        // 저장 실패 시 조용히 처리
      }
    },
    [raceId]
  )

  const handleNewStampDragStart = useCallback((asset: StampAsset, clientX: number, clientY: number) => {
    newStampAssetRef.current = asset
    isDraggingNew.current = true
    setNewStampDrag({ asset, x: clientX, y: clientY })
  }, [])

  // Global pointer listeners for new stamp drag — registered once per persistDecos identity
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!isDraggingNew.current) return
      setNewStampDrag(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)
    }

    const onUp = (e: PointerEvent) => {
      if (!isDraggingNew.current) return
      isDraggingNew.current = false
      const asset = newStampAssetRef.current
      newStampAssetRef.current = null
      setNewStampDrag(null)

      if (!asset || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const inside =
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom

      if (inside) {
        const relX = ((e.clientX - rect.left) / rect.width) * 100
        const relY = ((e.clientY - rect.top) / rect.height) * 100
        const newDeco: Decoration = {
          id: generateDecoId(),
          assetId: asset.id,
          x: relX,
          y: relY,
          rotation: 0,
          scale: 1.0,
        }
        setDecos(prev => {
          const next = [...prev, newDeco]
          void persistDecos(next)
          return next
        })
      }
      // outside container → discard (do nothing)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [persistDecos])

  if (readOnly) {
    return (
      <div className="relative w-full h-full" aria-hidden="true" style={{ pointerEvents: 'none' }}>
        {decos.map((deco) => {
          const asset = STAMP_MAP.get(deco.assetId)
          if (!asset) return null
          return (
            <span
              key={deco.id}
              className="absolute"
              style={{
                left: `${deco.x}%`,
                top: `${deco.y}%`,
                transform: `translate(-50%, -50%) rotate(${deco.rotation}deg) scale(${deco.scale})`,
                fontSize: '2rem',
                pointerEvents: 'none',
              }}
            >
              {asset.emoji}
            </span>
          )
        })}
      </div>
    )
  }

  const handleDragStart = (id: string) => setDraggingId(id)
  const handleDragEnd = () => setDraggingId(null)

  const handleMove = (id: string, x: number, y: number) => {
    setDecos((prev) => prev.map((d) => (d.id === id ? { ...d, x, y } : d)))
  }

  const handleDrop = (id: string, clientX: number, clientY: number) => {
    // Trash zone takes priority
    if (trashRef.current) {
      const trashRect = trashRef.current.getBoundingClientRect()
      const inTrash =
        clientX >= trashRect.left &&
        clientX <= trashRect.right &&
        clientY >= trashRect.top &&
        clientY <= trashRect.bottom
      if (inTrash) {
        setDecos((prev) => {
          const next = prev.filter((d) => d.id !== id)
          void persistDecos(next)
          return next
        })
        return
      }
    }

    // Outside container → delete
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const inside =
        clientX >= rect.left && clientX <= rect.right &&
        clientY >= rect.top && clientY <= rect.bottom
      if (!inside) {
        setDecos((prev) => {
          const next = prev.filter((d) => d.id !== id)
          void persistDecos(next)
          return next
        })
        return
      }
    }

    setDecos((prev) => {
      void persistDecos(prev)
      return prev
    })
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ pointerEvents: 'none' }}
    >
      {decos.map((deco) => (
        <DraggableItem
          key={deco.id}
          deco={deco}
          containerRef={containerRef}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onMove={handleMove}
          onDrop={handleDrop}
        />
      ))}

      {/* 쓰레기통 — 기존 스티커 드래그 중에만 표시 */}
      {draggingId && (
        <div
          ref={trashRef}
          className="absolute bottom-4 right-4 z-20 w-12 h-12 flex items-center justify-center rounded-full border-2 border-red-400/60 bg-red-900/40 pointer-events-none"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-red-300">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* StampPicker portal */}
      {showPicker && createPortal(
        <div
          className="fixed bottom-0 left-0 right-0 z-50"
          style={{ transition: 'transform 0.2s ease-out' }}
        >
          <StampPicker onDragStart={handleNewStampDragStart} />
        </div>,
        document.body
      )}

      {/* Ghost element for new stamp drag */}
      {newStampDrag && createPortal(
        <div
          style={{
            position: 'fixed',
            left: newStampDrag.x,
            top: newStampDrag.y,
            transform: 'translate(-50%, -50%)',
            fontSize: '2.5rem',
            pointerEvents: 'none',
            zIndex: 9999,
            opacity: 0.8,
            userSelect: 'none',
          }}
          aria-hidden="true"
        >
          {newStampDrag.asset.emoji}
        </div>,
        document.body
      )}
    </div>
  )
}
