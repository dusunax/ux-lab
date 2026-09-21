import { useCallback, useRef, useState } from 'react'
import { ACTIONS } from './actions'
import { ageAfterTurns } from './age'
import { CAT_TYPES, DEFAULT_CAT_NAME, MAX_CAT_NAME_LENGTH } from './catTypes'
import { DecideError, FALLBACK_HINT, decideWithJev } from './decideApi'
import { decideByInstinct } from './instinct'
import { DEFAULT_OWNER_NAME, MAX_OWNER_NAME_LENGTH, OWNER_SPRITE } from './owners'
import { DEFAULT_CAT_PROFILE, type CatProfile } from './profile'
import { FATIGUE_ENERGY_COST, analyzeSession, buildNotes, isFatigued, startledAfterRepeats } from './session'
import { MAX_HEARTS, resolveTurn } from './turn'
import type { CatStats, TurnLog } from './types'

const INITIAL_STATS: CatStats = { satiety: 60, energy: 70, affection: 30 }
const MAX_SITUATION_LENGTH = 200

const normalizeName = (name: string) => name.trim().slice(0, MAX_CAT_NAME_LENGTH) || DEFAULT_CAT_NAME
const normalizeOwnerName = (name: string) => name.trim().slice(0, MAX_OWNER_NAME_LENGTH) || DEFAULT_OWNER_NAME

/** 하트가 새로 차오른 칸 (key가 바뀌면 애니메이션을 다시 재생한다) */
export interface HeartGain {
  key: number
  index: number
}

export function useCatGame() {
  const [profile, setProfile] = useState<CatProfile>(DEFAULT_CAT_PROFILE)
  const [stats, setStats] = useState<CatStats>(INITIAL_STATS)
  const [hearts, setHearts] = useState(MAX_HEARTS)
  const [healNext, setHealNext] = useState(false)
  const [gain, setGain] = useState<HeartGain | null>(null)
  const [logs, setLogs] = useState<TurnLog[]>([])
  const [thinking, setThinking] = useState(false)
  const [pending, setPending] = useState<string | null>(null)
  const nextId = useRef(1)
  const ageMonths = ageAfterTurns(profile.startAgeMonths, logs.length)
  const gameOver = hearts === 0

  /** 선택 화면에서 정한 설정으로 새로 시작한다 (기록·게이지·하트 초기화) */
  const start = useCallback((next: CatProfile) => {
    setProfile({ ...next, name: normalizeName(next.name), ownerName: normalizeOwnerName(next.ownerName) })
    setStats(INITIAL_STATS)
    setHearts(MAX_HEARTS)
    setHealNext(false)
    setGain(null)
    setLogs([])
  }, [])

  const reset = useCallback(() => start(DEFAULT_CAT_PROFILE), [start])

  const submitSituation = useCallback(
    async (rawSituation: string) => {
      const situation = rawSituation.trim().slice(0, MAX_SITUATION_LENGTH)
      if (!situation || thinking || gameOver) return
      const { typeId, name, gender, ownerGender, ownerName } = profile
      const catType = CAT_TYPES[typeId]
      const memory = logs.map((l) => ({ situation: l.situation, action: l.decision.action }))
      const session = analyzeSession(logs, situation, stats)

      setThinking(true)
      setPending(situation)
      const decision = await decideWithJev({ catType, catName: name, gender, owner: { name: ownerName, gender: ownerGender }, session, ageMonths, stats, situation, memory }).catch((error) => {
        const reason = error instanceof DecideError ? error.kind : 'network'
        // 앱 오류가 아니라 의도된 대체 동작이므로 경고로 남기고, 원인과 해결 방법을 함께 알려준다
        console.warn(`jev 결정 실패(${reason}) → 본능으로 대체합니다. ${FALLBACK_HINT[reason]}`)
        return decideByInstinct(catType, stats, reason, `${situation}|${logs.length}`, session)
      })

      const info = ACTIONS[decision.action]
      // 세션 기록 반영: 반복된 상황은 덜 놀라고(익숙해짐), 같은 행동이 이어지면 싫증으로 에너지가 더 줄어든다
      const fatigued = isFatigued(session, decision.action)
      const delta = fatigued ? { ...info.delta, energy: info.delta.energy - FATIGUE_ENERGY_COST } : info.delta
      const shown = { ...decision, startled: startledAfterRepeats(decision.startled, session.repeats) }
      const turn = resolveTurn({ stats, hearts, healNext }, delta)
      setStats(turn.stats)
      setHearts(turn.hearts)
      setHealNext(turn.healNext)
      setGain(turn.gainedIndex !== null ? { key: nextId.current, index: turn.gainedIndex } : null)
      setLogs((prev) => [
        ...prev,
        { id: nextId.current++, situation, catType: typeId, catName: name, ageMonths, decision: shown, narration: info.narration(name), notes: buildNotes(session, fatigued), bond: session.bond },
      ])
      setThinking(false)
      setPending(null)
    },
    [ageMonths, gameOver, healNext, hearts, logs, profile, stats, thinking],
  )

  return {
    typeId: profile.typeId,
    catName: profile.name,
    gender: profile.gender,
    ownerId: OWNER_SPRITE[profile.ownerGender],
    ownerName: profile.ownerName,
    ageMonths,
    stats,
    hearts,
    gain,
    gameOver,
    logs,
    thinking,
    pending,
    start,
    reset,
    submitSituation,
  }
}
