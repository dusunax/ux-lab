import type { HeartGain } from '../useCatGame'
import { spriteUrl } from './CatAvatar'

interface Props {
  hearts: number
  max: number
  gain: HeartGain | null
}

const HEART_WIDTH = 18
const HEART_GAP = 2

/** 체력 하트 게이지: 가득 찬 하트와 빈 하트(시트). 새로 차오른 칸은 반짝이며 커졌다 돌아온다 */
export function Hearts({ hearts, max, gain }: Props) {
  return (
    <div className="hearts" role="img" aria-label={`체력 ${hearts} / ${max}`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < hearts
        const gained = gain?.index === i && filled
        return (
          <img
            key={gained ? `gain-${gain.key}` : i}
            src={spriteUrl(filled ? 'heart-full' : 'heart-empty')}
            alt=""
            width={HEART_WIDTH}
            height={16}
            draggable={false}
            className={`${filled ? '' : 'is-lost'}${gained ? ' is-gain' : ''}`}
          />
        )
      })}
      {gain && gain.index < hearts && (
        <img key={`spark-${gain.key}`} className="hearts__spark" src={spriteUrl('item-sparkle')} alt="" width={22} style={{ left: gain.index * (HEART_WIDTH + HEART_GAP) - 4 }} />
      )}
    </div>
  )
}
