import { useState } from 'react'
import type { Team, TeamInput } from '../../types'
import type { JudgeProfile } from '../../types'
import { TeamForm } from './TeamForm'
import { TeamCard } from './TeamCard'

interface Props {
  profile: JudgeProfile
  teams: Team[]
  onAdd: (input: Omit<TeamInput, 'id'>) => void
  onRemove: (id: string) => void
  onRun: (id: string) => void
  onFallback: (id: string, field: 'manualReadme' | 'manualNotion', value: string) => void
  onReset: () => void
}

const LEVEL_LABEL: Record<JudgeProfile['level'], string> = {
  junior: 'JUNIOR',
  mid: 'MID',
  senior: 'SENIOR',
}

export function TeamList({ profile, teams, onAdd, onRemove, onRun, onFallback, onReset }: Props) {
  const [showForm, setShowForm] = useState(false)

  function handleAdd(input: Omit<TeamInput, 'id'>) {
    onAdd(input)
    setShowForm(false)
  }

  const doneCount = teams.filter((t) => t.status === 'done').length

  return (
    <div className="min-h-screen bg-judge-bg">
      {/* Top bar */}
      <header className="border-b border-judge-border px-6 py-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-6">
          <span className="font-display text-judge-gold tracking-widest text-lg">MINI JUDGE</span>
          <span className="h-4 w-px bg-judge-border" />
          <span className="font-sans text-judge-cream text-sm">{profile.name}</span>
          <span className="font-display text-judge-gold-dim tracking-widest text-xs border border-judge-border px-2 py-0.5">
            {LEVEL_LABEL[profile.level]}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {doneCount > 0 && (
            <span className="font-mono text-judge-success text-xs">
              {doneCount} / {teams.length} DONE
            </span>
          )}
          <button
            onClick={onReset}
            className="font-display tracking-widest text-xs text-judge-muted hover:text-judge-cream transition-colors"
          >
            NEW SESSION
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Team cards */}
        {teams.map((team, i) => (
          <TeamCard
            key={team.input.id}
            team={team}
            index={i}
            onRun={() => onRun(team.input.id)}
            onRemove={() => onRemove(team.input.id)}
            onFallback={(field, value) => onFallback(team.input.id, field, value)}
          />
        ))}

        {/* Add form */}
        {showForm ? (
          <div className="border border-judge-gold/40 bg-judge-surface px-5 py-5">
            <p className="font-display text-judge-gold tracking-widest text-xs mb-4">ADD TEAM</p>
            <TeamForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full border border-dashed border-judge-border text-judge-muted font-display tracking-widest text-sm py-5 hover:border-judge-gold hover:text-judge-gold transition-colors print:hidden"
          >
            + ADD TEAM
          </button>
        )}
      </main>

      {/* Print styles: show all cards cleanly */}
      <style>{`
        @media print {
          header, button { display: none !important; }
          .border-dashed { display: none !important; }
        }
      `}</style>
    </div>
  )
}
