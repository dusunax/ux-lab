import type { ActionId } from './actions'
import type { CatTypeId } from './catTypes'
import type { Bond } from './session'

export const MOODS = ['happy', 'calm', 'nervous', 'annoyed', 'excited'] as const
export type Mood = (typeof MOODS)[number]

export const MOOD_LABEL: Record<Mood, string> = {
  happy: '기분 좋음',
  calm: '평온함',
  nervous: '불안함',
  annoyed: '짜증남',
  excited: '신남',
}

export type Gender = 'female' | 'male'

export const GENDER_LABEL: Record<Gender, string> = { female: '여아', male: '남아' }

/** 세 게이지 모두 0이 되면 위험하다 (0 = 바닥) */
export interface CatStats {
  /** 0(굶주림) ~ 100(배부름) */
  satiety: number
  /** 0(방전) ~ 100(팔팔) */
  energy: number
  /** 0(경계) ~ 100(껌딱지) */
  affection: number
}

export type DecisionSource = 'jev' | 'instinct'

/** jev 대신 본능으로 결정하게 된 이유 */
export type FallbackReason = 'network' | 'timeout' | 'server' | 'invalid'

export const FALLBACK_LABEL: Record<FallbackReason, string> = {
  network: '서버에 연결할 수 없어요',
  timeout: 'jev의 응답이 늦어졌어요',
  server: '서버에서 오류가 났어요',
  invalid: 'jev의 응답을 읽지 못했어요',
}

export interface Decision {
  action: ActionId
  mood: Mood
  /** 0~1, 깜짝 놀랐을 확률 */
  startled: number
  /** 0~1, 이 상황이 고양이에게 즐거운 일일 확률 (본능 결정에는 없다) */
  joy: number | null
  /** 행동별 확률 (jev가 준 값, 없으면 빈 객체) */
  actionProbabilities: Partial<Record<ActionId, number>>
  confidence: number | null
  source: DecisionSource
  /** source가 'instinct'일 때만 있다 */
  fallbackReason?: FallbackReason
}

export interface TurnLog {
  id: number
  situation: string
  catType: CatTypeId
  catName: string
  ageMonths: number
  decision: Decision
  narration: string
  /** 이번 반응에 영향을 준 세션 기록(익숙해짐·싫증·유대·기분) */
  notes: string[]
  /** 이번 턴 시작 시점의 유대 단계 */
  bond: Bond
}
