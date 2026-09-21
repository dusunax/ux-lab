import { formatAge } from '../age'
import { CAT_TYPES, type CatTypeId } from '../catTypes'
import { EXPRESSION_BY_ACTION, type Expression } from '../expression'
import { GENDER_LABEL, type CatStats, type Gender, type TurnLog } from '../types'
import { CatAvatar, spriteUrl } from './CatAvatar'
import { Hearts } from './Hearts'
import { PullCat } from './PullCat'
import { MAX_HEARTS } from '../turn'
import type { HeartGain } from '../useCatGame'

interface Props {
  typeId: CatTypeId
  catName: string
  gender: Gender
  ageMonths: number
  hearts: number
  gain: HeartGain | null
  stats: CatStats
  last: TurnLog | undefined
  thinking: boolean
}

const STAT_ROWS: { key: keyof CatStats; label: string; icon: string }[] = [
  { key: 'satiety', label: '포만감', icon: 'icon-hunger' },
  { key: 'energy', label: '에너지', icon: 'icon-energy' },
  { key: 'affection', label: '친밀도', icon: 'icon-affection' },
]

const BUBBLE: Partial<Record<Expression, string>> = {
  think: 'bubble-dots',
  scared: 'bubble-alert',
  curious: 'bubble-question',
}

export function CatStatus({ typeId, catName, gender, ageMonths, hearts, gain, stats, last, thinking }: Props) {
  const action = last?.decision.action
  const expression: Expression = thinking ? 'think' : action ? EXPRESSION_BY_ACTION[action] : 'idle'
  const motion = thinking ? 'is-thinking' : action ? `act-${action}` : ''
  const bubble = BUBBLE[expression]

  return (
    <section className="status">
      <div className="status__stage">
        <div className={`status__cat ${motion}`}>
          <PullCat>
            <CatAvatar typeId={typeId} expression={expression} size={104} />
          </PullCat>
        </div>
        {bubble && <img className="status__bubble" src={spriteUrl(bubble)} alt="" width={44} />}
      </div>
      <div className="status__info">
        <div className="status__head">
          <h2>
            {catName} <small>
              {[CAT_TYPES[typeId].name, GENDER_LABEL[gender], formatAge(ageMonths)].map((token, i, all) => (
                <span key={token} className="nowrap">
                  {token}
                  {i < all.length - 1 ? ' ·' : ''}{' '}
                </span>
              ))}
            </small>
          </h2>
          <Hearts hearts={hearts} max={MAX_HEARTS} gain={gain} />
        </div>
        <dl className="stats">
          {STAT_ROWS.map(({ key, label, icon }) => (
            <div key={key} className="stat">
              <dt>
                <img src={spriteUrl(icon)} alt="" height={16} /> {label}
              </dt>
              <dd>
                <div className="stat__track">
                  <div className={`stat__fill stat__fill--${key}`} style={{ width: `${stats[key]}%` }} />
                </div>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
