import { useState } from 'react'
import type { JudgeProfile, ParseResult, ParseStatus, Team, TeamInput } from '../types'
import { parseGitHub } from '../features/parse/parseGitHub'
import { parseNotion } from '../features/parse/parseNotion'
import { generateEval } from '../features/ai/generateEval'

function makeId() {
  return Math.random().toString(36).slice(2, 9)
}

export function useJudgeStore() {
  const [profile, setProfile] = useState<JudgeProfile | null>(null)
  const [teams, setTeams] = useState<Team[]>([])

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

  async function runTeam(id: string) {
    if (!profile) return

    const team = teams.find((t) => t.input.id === id)
    if (!team) return

    setTeams((prev) =>
      prev.map((t) => (t.input.id === id ? { ...t, status: 'parsing', error: undefined } : t)),
    )

    let githubContent = ''
    let notionContent = ''
    let githubStatus: ParseStatus = 'idle'
    let notionStatus: ParseStatus = 'idle'

    if (team.input.githubUrl) {
      try {
        githubContent = await parseGitHub(team.input.githubUrl)
        githubStatus = 'success'
      } catch {
        githubStatus = 'failed'
      }
    }

    if (team.input.notionUrl) {
      try {
        notionContent = await parseNotion(team.input.notionUrl)
        notionStatus = 'success'
      } catch {
        notionStatus = 'failed'
      }
    }

    const parseResult: ParseResult = { githubContent, notionContent, githubStatus, notionStatus }

    const hasContext =
      githubContent ||
      notionContent ||
      team.input.manualReadme ||
      team.input.manualNotion ||
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
      const evalResult = await generateEval(team.input, parseResult, profile.level)
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

  return { profile, setProfile, teams, addTeam, removeTeam, updateTeamInput, runTeam }
}
