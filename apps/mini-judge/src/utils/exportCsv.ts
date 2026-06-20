import type { Team } from '../types'

function cell(s: string): string {
  const v = s ?? ''
  return v.includes(',') || v.includes('"') || v.includes('\n')
    ? `"${v.replace(/"/g, '""')}"`
    : v
}

export function exportTeamsCsv(teams: Team[]) {
  const done = teams.filter((t) => t.status === 'done' && t.evalResult)
  if (!done.length) return

  const headers = ['조번호', '팀명', '설명', '프로젝트요약', '기술스택', '체크리스트', '레벨', '타입', '질문']
  const rows: string[][] = [headers]

  for (const team of done) {
    const { input, evalResult } = team
    if (!evalResult) continue

    const base = [
      input.teamNumber,
      input.title,
      input.description,
      evalResult.projectSummary,
      evalResult.techStack.join(' / '),
      evalResult.checklist.join(' | '),
    ]

    for (const level of ['junior', 'mid', 'senior'] as const) {
      for (const q of evalResult.questions[level]) {
        rows.push([...base, level, q.type, q.question])
      }
    }
  }

  const csv = rows.map((r) => r.map(cell).join(',')).join('\n')
  // BOM for Excel UTF-8 인식
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mini-judge-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
