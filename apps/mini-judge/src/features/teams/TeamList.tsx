import { useState } from 'react'
import type { Team, TeamInput, JudgeProfile } from '../../types'
import { TeamForm } from './TeamForm'
import { TeamCard } from './TeamCard'
import { exportTeamsCsv } from '../../utils/exportCsv'

interface Props {
  profile: JudgeProfile
  teams: Team[]
  onAdd: (input: Omit<TeamInput, 'id'>) => void
  onRemove: (id: string) => void
  onEdit: (id: string, input: Omit<TeamInput, 'id'>) => void
  onRun: (id: string) => void
  onFallback: (id: string, field: 'manualReadme', value: string) => void
  onReset: () => void
}

export function TeamList({ profile, teams, onAdd, onRemove, onEdit, onRun, onFallback, onReset }: Props) {
  const [showForm, setShowForm] = useState(false)

  function handleAdd(input: Omit<TeamInput, 'id'>) {
    onAdd(input)
    setShowForm(false)
  }

  const doneCount = teams.filter((t) => t.status === 'done').length

  return (
    <div className="min-h-screen bg-gh-canvas">
      {/* GitHub-style dark header */}
      <header className="bg-gh-header border-b border-black/30 px-6 py-3 flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <svg height="22" viewBox="0 0 16 16" width="22" fill="#f0f6fc">
              <path d="M7.467.133a1.748 1.748 0 0 1 1.066 0l5.25 1.68A1.75 1.75 0 0 1 15 3.48V8c0 3.045-1.86 5.61-4.655 6.753l-1.94.776a.75.75 0 0 1-.81 0l-1.94-.776C2.86 13.61 1 11.044 1 8V3.48a1.75 1.75 0 0 1 1.217-1.667Zm.61 1.429a.25.25 0 0 0-.153 0l-5.25 1.68a.25.25 0 0 0-.174.238V8c0 2.56 1.565 4.706 3.91 5.667l1.59.635 1.59-.635C11.435 12.706 13 10.559 13 8V3.48a.25.25 0 0 0-.174-.237ZM11.28 6.78l-3.5 3.5a.75.75 0 0 1-1.06 0l-1.5-1.5a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018l.97.97 2.97-2.97a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z" />
            </svg>
            <span className="text-gh-header-text font-sans font-semibold text-sm">mini-judge</span>
          </div>
          <span className="text-gh-header-muted text-sm">/</span>
          <span className="text-gh-header-text font-sans text-sm">{profile.name}</span>
        </div>
        <div className="flex items-center gap-4">
          {doneCount > 0 && (
            <>
              <span className="font-mono text-gh-header-muted text-xs">
                {doneCount}/{teams.length} done
              </span>
              <button
                onClick={() => exportTeamsCsv(teams)}
                className="font-sans text-gh-header-muted hover:text-gh-header-text text-xs transition-colors flex items-center gap-1.5"
              >
                <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
                  <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"/>
                  <path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.97a.749.749 0 1 1 1.06 1.061l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.061Z"/>
                </svg>
                Export CSV
              </button>
            </>
          )}
          <button
            onClick={onReset}
            className="font-sans text-gh-header-muted hover:text-gh-header-text text-xs transition-colors"
          >
            New session
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Page title (print only) */}
        <div className="hidden print:block mb-6">
          <h1 className="font-sans font-bold text-xl text-gh-fg">
            Mini Judge — {profile.name}
          </h1>
        </div>

        {teams.length === 0 && !showForm && (
          <div className="gh-card p-12 text-center">
            <div className="mx-auto mb-4 w-10 h-10 rounded-full bg-gh-canvas flex items-center justify-center">
              <svg viewBox="0 0 16 16" width="20" height="20" fill="#8c959f">
                <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8V1.5Z"/>
              </svg>
            </div>
            <h3 className="font-sans font-semibold text-gh-fg text-sm mb-1">팀이 없습니다</h3>
            <p className="font-sans text-gh-fg-muted text-xs">아래 버튼으로 팀을 추가하세요</p>
          </div>
        )}

        {/* Team cards */}
        {teams.map((team, i) => (
          <TeamCard
            key={team.input.id}
            team={team}
            index={i}
            onRun={() => onRun(team.input.id)}
            onRemove={() => onRemove(team.input.id)}
            onEdit={(input) => onEdit(team.input.id, input)}
            onFallback={(field, value) => onFallback(team.input.id, field, value)}
          />
        ))}

        {/* Add form */}
        {showForm ? (
          <div className="gh-card p-4">
            <h3 className="font-sans font-semibold text-gh-fg text-sm mb-4">Add team</h3>
            <TeamForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="no-print w-full border border-dashed border-gh-border text-gh-fg-muted font-sans text-sm py-4 rounded-md hover:bg-gh-surface hover:text-gh-fg hover:border-gh-fg-muted transition-colors flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
              <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"/>
            </svg>
            Add team
          </button>
        )}
      </main>
    </div>
  )
}
