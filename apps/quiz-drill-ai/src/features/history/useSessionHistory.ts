import { useCallback } from 'react'
import type { SessionRecord } from '../../types/quiz'

const STORAGE_PREFIX = 'quiz-drill:v1'
const SOURCES_INDEX_KEY = `${STORAGE_PREFIX}:sources`
const MAX_SESSIONS_PER_SOURCE = 50

function sourceStorageKey(source: string): string {
  const slug = source
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣-]/g, '')
    .slice(0, 40) || 'unknown'
  return `${STORAGE_PREFIX}:${slug}`
}

export function useSessionHistory() {
  const getHistory = useCallback((): SessionRecord[] => {
    try {
      const sources = JSON.parse(
        localStorage.getItem(SOURCES_INDEX_KEY) ?? '[]'
      ) as string[]

      return sources
        .flatMap((key) => {
          try {
            const raw = localStorage.getItem(key)
            return raw ? (JSON.parse(raw) as SessionRecord[]) : []
          } catch {
            return []
          }
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    } catch {
      return []
    }
  }, [])

  const addSession = useCallback((record: SessionRecord) => {
    try {
      const key = sourceStorageKey(record.source)

      const sources = JSON.parse(
        localStorage.getItem(SOURCES_INDEX_KEY) ?? '[]'
      ) as string[]
      if (!sources.includes(key)) {
        localStorage.setItem(SOURCES_INDEX_KEY, JSON.stringify([...sources, key]))
      }

      const existing = JSON.parse(localStorage.getItem(key) ?? '[]') as SessionRecord[]
      const updated = [record, ...existing].slice(0, MAX_SESSIONS_PER_SOURCE)
      localStorage.setItem(key, JSON.stringify(updated))
    } catch {
      // localStorage 미지원 또는 용량 초과 시 무시
    }
  }, [])

  return { getHistory, addSession }
}
