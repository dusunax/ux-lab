import { useCallback } from 'react'
import type { SessionRecord } from '../../types/quiz'

const STORAGE_KEY = 'quiz-drill:history'
const MAX_SESSIONS = 50

export function useSessionHistory() {
  const getHistory = useCallback((): SessionRecord[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as SessionRecord[]) : []
    } catch {
      return []
    }
  }, [])

  const addSession = useCallback(
    (record: SessionRecord) => {
      try {
        const history = getHistory()
        const updated = [record, ...history].slice(0, MAX_SESSIONS)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // localStorage 미지원 또는 용량 초과 시 무시
      }
    },
    [getHistory]
  )

  return { getHistory, addSession }
}
