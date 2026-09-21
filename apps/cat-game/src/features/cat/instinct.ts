import { ACTION_IDS, type ActionId } from './actions'
import type { CatType } from './catTypes'
import { FATIGUE_STREAK, MOOD_STREAK_MIN, type SessionContext } from './session'
import type { CatStats, Decision, FallbackReason } from './types'

const HUNGRY_LEVEL = 30
const TIRED_LEVEL = 25
const STAT_BOOST = 0.25
/** 상황마다 성향이 조금씩 다르게 나오도록 가중치에 곱하는 흔들림 범위 (0.5배 ~ 1.5배) */
const JITTER_MIN = 0.5
const JITTER_RANGE = 1

const scale = (weights: Record<ActionId, number>, factors: Partial<Record<ActionId, number>>) => {
  for (const [id, factor] of Object.entries(factors)) weights[id as ActionId] *= factor
}

function adjustedWeights(catType: CatType, stats: CatStats, session: SessionContext): Record<ActionId, number> {
  const weights: Record<ActionId, number> = {
    ...catType.weights,
    eat: catType.weights.eat + (stats.satiety <= HUNGRY_LEVEL ? STAT_BOOST : 0),
    sleep: catType.weights.sleep + (stats.energy <= TIRED_LEVEL ? STAT_BOOST : 0),
  }
  // 싫증: 같은 행동이 이어졌다면 그 행동은 덜 끌린다
  if (session.streak && session.streak.count >= FATIGUE_STREAK) weights[session.streak.action] *= 0.5
  // 유대: 친밀하면 다가오고 경계하면 숨거나 하악질한다
  if (session.bond === 'close') scale(weights, { cuddle: 1.8, play: 1.2, hiss: 0.4, hide: 0.5 })
  if (session.bond === 'wary') scale(weights, { hide: 1.6, hiss: 1.6, cuddle: 0.3 })
  // 기분: 지난 기분이 이어진다
  if (session.moodStreak && session.moodStreak.count >= MOOD_STREAK_MIN) {
    const { mood } = session.moodStreak
    if (mood === 'nervous') scale(weights, { hide: 1.5 })
    if (mood === 'annoyed') scale(weights, { hiss: 1.5 })
    if (mood === 'happy' || mood === 'excited') scale(weights, { play: 1.4, cuddle: 1.3 })
  }
  return weights
}

/** 문자열 → 0~1 난수 수열 (같은 시드는 항상 같은 값이라 결과를 다시 재현할 수 있다) */
function seededRandom(seed: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return () => {
    h = (h + 0x6d2b79f5) | 0
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * jev 호출이 실패했을 때 타입별 가중치 + 상태 + 상황(seed)으로 정하는 오프라인 본능.
 * 화면에 보이는 확률과 같이, 확률이 가장 높은 행동을 그대로 고른다.
 */
export function decideByInstinct(catType: CatType, stats: CatStats, reason: FallbackReason, seed: string, session: SessionContext): Decision {
  const random = seededRandom(seed)
  const weights = adjustedWeights(catType, stats, session)
  const jittered = ACTION_IDS.map((id) => [id, weights[id] * (JITTER_MIN + random() * JITTER_RANGE)] as const)
  const total = jittered.reduce((sum, [, w]) => sum + w, 0)
  const probabilities = Object.fromEntries(jittered.map(([id, w]) => [id, w / total])) as Record<ActionId, number>
  const action = ACTION_IDS.reduce((best, id) => (probabilities[id] > probabilities[best] ? id : best), ACTION_IDS[0])

  return {
    action,
    mood: 'calm',
    startled: 0,
    joy: null,
    actionProbabilities: probabilities,
    confidence: null,
    source: 'instinct',
    fallbackReason: reason,
  }
}
