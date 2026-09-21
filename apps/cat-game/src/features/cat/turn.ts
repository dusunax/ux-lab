import type { StatDelta } from './actions'
import type { CatStats } from './types'

export const MAX_HEARTS = 5
export const STAT_MIN = 0
export const STAT_MAX = 100

const clamp = (n: number) => Math.min(STAT_MAX, Math.max(STAT_MIN, n))

export interface TurnState {
  stats: CatStats
  hearts: number
  /** 지난 턴에 게이지가 100%가 되어 이번 턴에 하트가 한 칸 차오르는지 */
  healNext: boolean
}

export interface TurnResult extends TurnState {
  /** 새로 차오른 하트 칸(0부터). 같은 턴에 다시 줄었다면 null */
  gainedIndex: number | null
}

/**
 * 한 턴을 정산한다.
 * - 지난 턴에 100%가 된 게이지가 있었다면 하트가 한 칸 차오른다.
 * - 이번 턴 결과로 0이 된 게이지가 하나라도 있으면 하트가 한 칸 줄어든다.
 * - 이번 턴 결과로 100%가 된 게이지가 있으면 다음 턴에 하트가 차오른다.
 */
export function resolveTurn({ stats, hearts, healNext }: TurnState, delta: StatDelta): TurnResult {
  const next: CatStats = {
    satiety: clamp(stats.satiety + delta.satiety),
    energy: clamp(stats.energy + delta.energy),
    affection: clamp(stats.affection + delta.affection),
  }
  const values = Object.values(next)

  let nextHearts = hearts
  let gainedIndex: number | null = null
  if (healNext && nextHearts < MAX_HEARTS) {
    gainedIndex = nextHearts
    nextHearts += 1
  }
  if (values.some((v) => v === STAT_MIN)) nextHearts = Math.max(0, nextHearts - 1)

  return {
    stats: next,
    hearts: nextHearts,
    healNext: values.some((v) => v === STAT_MAX),
    gainedIndex: gainedIndex !== null && nextHearts > gainedIndex ? gainedIndex : null,
  }
}
