import { useState, useEffect } from 'react'
import type { JudgeProfile, ParseResult, ParseStatus, Team, TeamInput } from '../types'
import { parseGitHub } from '../features/parse/parseGitHub'
import { generateEval } from '../features/ai/generateEval'

const STORAGE_KEY = 'mini-judge-v1'

interface StoredState {
  profile: JudgeProfile | null
  teams: Team[]
}

function loadStorage(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { profile: null, teams: [] }
    const state = JSON.parse(raw) as StoredState
    // reset in-flight states on reload
    const teams = state.teams.map((t) =>
      t.status === 'parsing' || t.status === 'generating'
        ? { ...t, status: 'pending' as const, error: undefined }
        : t,
    )
    return { ...state, teams }
  } catch {
    return { profile: null, teams: [] }
  }
}

function saveStorage(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

function makeId() {
  return Math.random().toString(36).slice(2, 9)
}

export function useJudgeStore() {
  const [profile, setProfileState] = useState<JudgeProfile | null>(() => loadStorage().profile)
  const [teams, setTeams] = useState<Team[]>(() => loadStorage().teams)

  useEffect(() => {
    saveStorage({ profile, teams })
  }, [profile, teams])

  function setProfile(p: JudgeProfile | null) {
    if (!p) {
      localStorage.removeItem(STORAGE_KEY)
      setTeams([])
    }
    setProfileState(p)
  }

  function addTeam(input: Omit<TeamInput, 'id'>) {
    setTeams((prev) => [
      ...prev,
      { input: { ...input, id: makeId() }, status: 'pending' },
    ])
  }

  function removeTeam(id: string) {
    setTeams((prev) => prev.filter((t) => t.input.id !== id))
  }

  function updateTeamInput(id: string, patch: Partial<TeamInput>) {
    setTeams((prev) =>
      prev.map((t) =>
        t.input.id === id ? { ...t, input: { ...t.input, ...patch } } : t,
      ),
    )
  }

  function editTeam(id: string, input: Omit<TeamInput, 'id'>) {
    setTeams((prev) =>
      prev.map((t) =>
        t.input.id === id
          ? { input: { ...input, id }, status: 'pending', parseResult: undefined, evalResult: undefined, error: undefined }
          : t,
      ),
    )
  }

  async function runTeam(id: string) {
    if (!profile) return

    const team = teams.find((t) => t.input.id === id)
    if (!team) return

    setTeams((prev) =>
      prev.map((t) => (t.input.id === id ? { ...t, status: 'parsing', error: undefined } : t)),
    )

    let githubContent = ''
    let githubStatus: ParseStatus = 'idle'

    if (team.input.githubUrl) {
      try {
        githubContent = await parseGitHub(team.input.githubUrl)
        githubStatus = 'success'
      } catch {
        githubStatus = 'failed'
      }
    }

    const parseResult: ParseResult = { githubContent, notionContent: '', githubStatus, notionStatus: 'idle' }

    const hasContext =
      githubContent ||
      team.input.manualReadme ||
      team.input.notionImage ||
      team.input.description

    if (!hasContext) {
      setTeams((prev) =>
        prev.map((t) =>
          t.input.id === id
            ? { ...t, parseResult, status: 'error', error: '파싱 실패 — 수동으로 내용을 입력해주세요' }
            : t,
        ),
      )
      return
    }

    setTeams((prev) =>
      prev.map((t) => (t.input.id === id ? { ...t, parseResult, status: 'generating' } : t)),
    )

    try {
      const evalResult = await generateEval(team.input, parseResult)
      setTeams((prev) =>
        prev.map((t) => (t.input.id === id ? { ...t, evalResult, status: 'done' } : t)),
      )
    } catch (err) {
      setTeams((prev) =>
        prev.map((t) =>
          t.input.id === id
            ? { ...t, status: 'error', error: err instanceof Error ? err.message : 'AI 생성 실패' }
            : t,
        ),
      )
    }
  }

  return { profile, setProfile, teams, addTeam, removeTeam, updateTeamInput, editTeam, runTeam }
}
