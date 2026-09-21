import { ACTIONS, type ActionId } from './actions'
import { MOOD_LABEL, type CatStats, type Mood, type TurnLog } from './types'

/**
 * 세션(이전 턴들)의 기록에 따라 달라지는 4가지 요소.
 *  1. 익숙해짐 — 같은 상황이 반복되면 덜 놀란다
 *  2. 싫증     — 같은 행동이 연속되면 지치고(에너지 감소) 다른 행동을 하고 싶어 한다
 *  3. 유대     — 친밀도가 높으면 다가오고 낮으면 경계한다
 *  4. 기분     — 지난 기분이 이어져 다음 반응에 영향을 준다
 */

export type Bond = 'wary' | 'normal' | 'close'

export interface SessionContext {
  /** 이 상황을 이전에 겪은 횟수 */
  repeats: number
  /** 가장 최근 행동이 연속된 횟수 */
  streak: { action: ActionId; count: number } | null
  bond: Bond
  /** 평온함(calm)이 아닌 기분이 연속된 횟수 */
  moodStreak: { mood: Mood; count: number } | null
}

export const BOND_CLOSE_AT = 70
export const BOND_WARY_AT = 20
/** 같은 행동이 이 횟수 이상 연속된 뒤 또 하면 싫증이 난다 */
export const FATIGUE_STREAK = 2
export const FATIGUE_ENERGY_COST = 5
/** 같은 상황이 반복될 때마다 놀람에 곱하는 비율 */
export const HABITUATION_RATE = 0.6
export const MOOD_STREAK_MIN = 2

/** 공백·문장부호·대소문자를 무시하고 같은 상황인지 비교하기 위한 정규화 */
export const normalizeSituation = (text: string) => text.toLowerCase().replace(/[\s.,!?~…'"]+/g, '')

function trailingRun<T>(items: T[], key: (item: T) => string | null): { key: string; count: number } | null {
  const last = items[items.length - 1]
  const lastKey = last === undefined ? null : key(last)
  if (lastKey === null) return null
  let count = 0
  for (let i = items.length - 1; i >= 0 && key(items[i]) === lastKey; i--) count++
  return { key: lastKey, count }
}

export function bondOf(affection: number): Bond {
  return affection >= BOND_CLOSE_AT ? 'close' : affection <= BOND_WARY_AT ? 'wary' : 'normal'
}

export function analyzeSession(logs: TurnLog[], situation: string, stats: CatStats): SessionContext {
  const target = normalizeSituation(situation)
  const streak = trailingRun(logs, (l) => l.decision.action)
  const moodRun = trailingRun(logs, (l) => (l.decision.mood === 'calm' ? null : l.decision.mood))
  return {
    repeats: logs.filter((l) => normalizeSituation(l.situation) === target).length,
    streak: streak ? { action: streak.key as ActionId, count: streak.count } : null,
    bond: bondOf(stats.affection),
    moodStreak: moodRun ? { mood: moodRun.key as Mood, count: moodRun.count } : null,
  }
}

/** 익숙해짐: 반복된 만큼 놀람 확률을 줄인다 */
export const startledAfterRepeats = (startled: number, repeats: number) => startled * HABITUATION_RATE ** repeats

/** 싫증: 같은 행동을 FATIGUE_STREAK번 이상 이어서 했는데 또 같은 행동을 했는가 */
export const isFatigued = (ctx: SessionContext, action: ActionId) =>
  ctx.streak !== null && ctx.streak.action === action && ctx.streak.count >= FATIGUE_STREAK

const BOND_LABEL: Record<Bond, string> = { wary: '경계함', normal: '보통', close: '친밀함' }

/** jev에게 전달하는 세션 요약 */
export function describeSession(ctx: SessionContext) {
  return {
    sameSituationBefore: ctx.repeats === 0 ? '처음 겪는 상황' : `이 상황을 이미 ${ctx.repeats}번 겪었다 (익숙해져 덜 놀란다)`,
    actionStreak: ctx.streak ? `${ACTIONS[ctx.streak.action].label} ${ctx.streak.count}번 연속` : '없음',
    bond: `${BOND_LABEL[ctx.bond]} (친밀함이면 다가오고 경계함이면 피한다)`,
    moodCarryOver: ctx.moodStreak ? `${MOOD_LABEL[ctx.moodStreak.mood]} ${ctx.moodStreak.count}턴 연속` : '없음',
  }
}

/** 말풍선 아래에 보여줄, 이번 반응에 영향을 준 세션 기록 */
export function buildNotes(ctx: SessionContext, fatigued: boolean): string[] {
  const notes: string[] = []
  if (ctx.repeats > 0) notes.push(`같은 상황 ${ctx.repeats + 1}번째 · 익숙해졌어요`)
  if (fatigued) notes.push(`같은 행동이 이어져 싫증났어요 · 에너지 -${FATIGUE_ENERGY_COST}`)
  if (ctx.bond === 'close') notes.push('친밀도가 높아 마음을 열었어요')
  if (ctx.bond === 'wary') notes.push('친밀도가 낮아 경계하고 있어요')
  if (ctx.moodStreak && ctx.moodStreak.count >= MOOD_STREAK_MIN) notes.push(`${MOOD_LABEL[ctx.moodStreak.mood]} 기분이 이어졌어요`)
  return notes
}

