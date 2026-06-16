import { memo } from 'react'
import { StampAsset } from '../../types/decoration'
import { STAMP_ASSETS, CATEGORY_LABELS } from './stamps'

interface Props {
  onSelect: (asset: StampAsset) => void
}

export default memo(function StampPicker({ onSelect }: Props) {
  const categories = ['finish', 'weather', 'emotion', 'course'] as const

  return (
    <div
      className="flex flex-col gap-4 p-4 bg-cream border-t border-bark/10 max-h-64 overflow-y-auto"
      role="region"
      aria-label="도장·스티커 팔레트"
    >
      {categories.map((category) => {
        const stamps = STAMP_ASSETS.filter((s) => s.category === category)
        return (
          <div key={category}>
            <p className="text-bark-light text-xs font-medium mb-2 uppercase tracking-wide">
              {CATEGORY_LABELS[category]}
            </p>
            <div className="flex flex-wrap gap-2" role="list" aria-label={CATEGORY_LABELS[category]}>
              {stamps.map((stamp) => (
                <button
                  key={stamp.id}
                  className="flex flex-col items-center gap-0.5 p-2 rounded-lg hover:bg-bark/10 focus-visible:ring-2 focus-visible:ring-gold transition-colors"
                  onClick={() => onSelect(stamp)}
                  aria-label={`${stamp.label} 스티커 추가`}
                  role="listitem"
                  type="button"
                >
                  <span className="text-2xl" aria-hidden="true">{stamp.emoji}</span>
                  <span className="text-bark-light text-xs">{stamp.label}</span>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
})
