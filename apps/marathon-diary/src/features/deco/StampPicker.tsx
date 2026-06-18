import { memo } from 'react'
import { StampAsset } from '../../types/decoration'
import { STAMP_ASSETS } from './stamps'

interface Props {
  onSelect?: (asset: StampAsset) => void
  onDragStart?: (asset: StampAsset, clientX: number, clientY: number) => void
}

export default memo(function StampPicker({ onSelect = undefined, onDragStart }: Props) {
  return (
    <div
      className="bg-ink/90 backdrop-blur-md border-t border-white/10 px-3 py-4"
      role="region"
      aria-label="도장 팔레트"
      style={{ boxShadow: '0 -8px 32px rgba(0,0,0,0.5)' }}
    >
      <div
        className="flex gap-1 overflow-x-auto justify-center"
        style={{ scrollbarWidth: 'none', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {STAMP_ASSETS.map((stamp) => (
          <button
            key={stamp.id}
            type="button"
            className="flex-shrink-0 flex items-center justify-center rounded-lg active:scale-90 transition-transform focus-visible:ring-2 focus-visible:ring-gold touch-none"
            style={{
              width: '3.5rem',
              height: '3.5rem',
              fontSize: '2rem',
              scrollSnapAlign: 'center',
              background: 'rgba(255,255,255,0.06)',
            }}
            onPointerDown={(e) => {
              e.preventDefault()
              onDragStart?.(stamp, e.clientX, e.clientY)
            }}
            onClick={() => onSelect?.(stamp)}
            aria-label={stamp.label}
          >
            {stamp.emoji}
          </button>
        ))}
      </div>
    </div>
  )
})
