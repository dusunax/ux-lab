import { ACTIONS, ACTION_IDS } from '../actions'
import { FALLBACK_LABEL, MOOD_LABEL, type Decision } from '../types'

const percent = (n: number) => `${Math.round(n * 100)}%`
const RING_RADIUS = 20
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

function Ring({ label, value }: { label: string; value: number }) {
  const clamped = Math.min(1, Math.max(0, value))
  return (
    <div className="ring" role="img" aria-label={`${label} ${percent(clamped)}`}>
      <svg viewBox="0 0 48 48" width="48" height="48">
        <circle cx="24" cy="24" r={RING_RADIUS} className="ring__track" />
        <circle
          cx="24"
          cy="24"
          r={RING_RADIUS}
          className="ring__value"
          strokeDasharray={`${RING_LENGTH * clamped} ${RING_LENGTH}`}
          transform="rotate(-90 24 24)"
        />
        <text x="24" y="28" textAnchor="middle" className="ring__text">
          {Math.round(clamped * 100)}
        </text>
      </svg>
      <span>{label}</span>
    </div>
  )
}

/** 결정 응답(행동별 확률 · 놀람 · 확신 · 기분)을 한눈에 보여주는 차트 */
export function DecisionChart({ decision }: { decision: Decision }) {
  const probs = decision.actionProbabilities
  const all = ACTION_IDS.map((id) => ({ id, value: probs[id] ?? 0 })).sort((a, b) => b.value - a.value)
  // 반올림해서 0%로 보이는 행동은 막대 대신 스켈레톤으로 접는다
  const rows = all.filter((r) => Math.round(r.value * 100) > 0)
  const hidden = all.filter((r) => Math.round(r.value * 100) === 0)
  const hasProbs = rows.length > 0

  return (
    <figure className="dchart">
      <figcaption>
        {decision.source === 'jev' ? 'jev의 결정' : `본능으로 결정 · ${FALLBACK_LABEL[decision.fallbackReason ?? 'network']}`} · {MOOD_LABEL[decision.mood]}
      </figcaption>
      {hasProbs && (
        <ul className="dchart__bars" aria-label="행동별 확률">
          {rows.map(({ id, value }) => (
            <li key={id} className={id === decision.action ? 'is-chosen' : ''}>
              <span className="dchart__label">{ACTIONS[id].label}</span>
              <span className="dchart__track">
                <span className="dchart__fill" style={{ width: percent(value) }} />
              </span>
              <span className="dchart__value">{percent(value)}</span>
            </li>
          ))}
        </ul>
      )}
      {hidden.length > 0 && (
        <div className="dchart__skeleton" role="img" aria-label={`확률 0%인 행동 ${hidden.length}개: ${hidden.map((h) => ACTIONS[h.id].label).join(', ')}`}>
          <span />
          <span />
        </div>
      )}
      {decision.source === 'jev' && (
        <div className="dchart__rings">
          <Ring label="놀람" value={decision.startled} />
          {decision.joy !== null && <Ring label="즐거움" value={decision.joy} />}
          {decision.confidence !== null && <Ring label="확신" value={decision.confidence} />}
        </div>
      )}
    </figure>
  )
}
