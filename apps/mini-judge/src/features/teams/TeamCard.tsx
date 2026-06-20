import { useState } from 'react'
import type { Team, TeamInput } from '../../types'
import { TeamForm } from './TeamForm'

interface Props {
  team: Team
  index: number
  onRun: () => void
  onRemove: () => void
  onEdit: (input: Omit<TeamInput, 'id'>) => void
  onFallback: (field: 'manualReadme', value: string) => void
}

const STATUS_CONFIG: Record<Team['status'], { label: string; cls: string }> = {
  pending:    { label: 'Pending',    cls: 'bg-gh-canvas text-gh-fg-muted border-gh-border' },
  parsing:    { label: 'Parsing…',   cls: 'bg-gh-yellow-subtle text-gh-yellow border-gh-yellow/30' },
  generating: { label: 'Generating…',cls: 'bg-gh-blue-subtle text-gh-blue border-gh-blue/30' },
  done:       { label: 'Done',       cls: 'bg-gh-green-subtle text-gh-green border-gh-green/30' },
  error:      { label: 'Error',      cls: 'bg-gh-red-subtle text-gh-red border-gh-red/30' },
}

function ParseBadge({ status }: { status: string }) {
  if (status === 'success') return <span className="text-gh-green text-xs font-mono">ok</span>
  if (status === 'failed')  return <span className="text-gh-red text-xs font-mono">fail</span>
  return <span className="text-gh-fg-subtle text-xs font-mono">—</span>
}

export function TeamCard({ team, index, onRun, onRemove, onEdit, onFallback }: Props) {
  const { input, status, evalResult, parseResult, error } = team
  const [readmeFallback, setReadmeFallback] = useState(input.manualReadme ?? '')
  const [isEditing, setIsEditing] = useState(false)
  const isRunning = status === 'parsing' || status === 'generating'
  const { label, cls } = STATUS_CONFIG[status]

  const needsFallbackReadme = parseResult?.githubStatus === 'failed'

  if (isEditing) {
    const { id: _id, ...currentValues } = input
    return (
      <div className="gh-card p-4">
        <h3 className="font-sans font-semibold text-gh-fg text-sm mb-4">
          Edit — <span className="text-gh-fg-muted font-normal">{input.teamNumber ? `${input.teamNumber} ` : ''}{input.title}</span>
        </h3>
        <TeamForm
          initialValues={currentValues}
          submitLabel="Save changes"
          onAdd={(updated) => { onEdit(updated); setIsEditing(false) }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    )
  }

  return (
    <div className="gh-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gh-border-muted bg-gh-canvas">
        <div className="flex items-center gap-3">
          <span className="font-mono text-gh-fg-subtle text-xs">#{String(index + 1).padStart(2, '0')}</span>
          <div>
            <span className="font-sans font-semibold text-gh-fg text-sm">
              {input.teamNumber ? `${input.teamNumber} ` : ''}{input.title}
            </span>
            {input.description && (
              <span className="ml-2 font-sans text-gh-fg-muted text-xs">{input.description}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-sans text-xs font-medium border rounded-full px-2.5 py-0.5 ${cls}`}>
            {label}
          </span>
          <button
            onClick={() => setIsEditing(true)}
            disabled={isRunning}
            className="text-gh-fg-muted hover:text-gh-fg text-xs font-sans transition-colors disabled:opacity-30"
            title="Edit"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
              <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Zm-2.262 2.468L8.726 3.516 3.75 8.49v.252l.594.594H4.5l.609-.609.124.124-.325.326H5l.594.594v.252l-1.05 1.05-.327-.327.326-.325.124.124-.609.609v.094l.594.594H4.5l4.975-4.974Z"/>
            </svg>
          </button>
          <button
            onClick={onRemove}
            disabled={isRunning}
            className="text-gh-fg-muted hover:text-gh-red text-xs font-sans transition-colors disabled:opacity-30 ml-1"
            title="Remove"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
              <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Parse status row */}
      {parseResult && parseResult.githubStatus !== 'idle' && (
        <div className="px-4 py-2 border-b border-gh-border-muted flex gap-4 text-xs">
          <span className="text-gh-fg-subtle font-sans">
            GitHub: <ParseBadge status={parseResult.githubStatus} />
          </span>
          <span className="text-gh-fg-subtle font-sans">
            Notion: {input.notionImage
              ? <span className="text-gh-green font-mono">ok</span>
              : <span className="text-gh-fg-subtle font-mono">—</span>}
          </span>
        </div>
      )}

      {/* Generating spinner */}
      {status === 'generating' && (
        <div className="px-4 py-5 border-b border-gh-border-muted flex items-center gap-3">
          <svg className="animate-spin text-gh-blue" viewBox="0 0 16 16" width="14" height="14" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25"/>
            <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="font-sans text-gh-fg-muted text-xs">질문 생성 중…</span>
        </div>
      )}

      {/* Fallback: GitHub parse failed */}
      {needsFallbackReadme && (
        <div className="px-4 py-4 border-b border-gh-border-muted bg-gh-yellow-subtle/40">
          <div className="flex items-center gap-2 mb-3">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="#9a6700">
              <path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
            </svg>
            <span className="font-sans text-gh-yellow text-xs font-semibold">
              GitHub 파싱 실패 — README 내용을 직접 입력해주세요
            </span>
          </div>
          <textarea
            rows={3}
            placeholder="README.md 내용을 붙여넣으세요"
            className="gh-textarea font-mono text-xs"
            value={readmeFallback}
            onChange={(e) => {
              setReadmeFallback(e.target.value)
              onFallback('manualReadme', e.target.value)
            }}
          />
        </div>
      )}

      {/* Error */}
      {status === 'error' && error && (
        <div className="px-4 py-3 border-b border-gh-border-muted bg-gh-red-subtle/50">
          <p className="font-mono text-gh-red text-xs">{error}</p>
        </div>
      )}

      {/* Eval result */}
      {evalResult && status === 'done' && (
        <div className="p-4 space-y-5">
          {/* Summary */}
          <div>
            <h4 className="font-sans font-semibold text-gh-fg text-xs uppercase tracking-wide text-gh-fg-muted mb-1.5">
              Project Summary
            </h4>
            <p className="font-sans text-gh-fg text-sm leading-relaxed">{evalResult.projectSummary}</p>
          </div>

          {/* Tech stack */}
          <div>
            <h4 className="font-sans font-semibold text-xs uppercase tracking-wide text-gh-fg-muted mb-2">
              Tech Stack
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {evalResult.techStack.map((t, i) => (
                <span key={i} className="font-mono text-xs bg-gh-purple-subtle text-gh-purple border border-gh-purple/20 rounded-full px-2.5 py-0.5">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Checklist */}
          <div>
            <h4 className="font-sans font-semibold text-xs uppercase tracking-wide text-gh-fg-muted mb-2">
              Completeness Checklist
            </h4>
            <ul className="space-y-1.5">
              {evalResult.checklist.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 font-sans text-gh-fg text-sm">
                  <svg className="mt-0.5 flex-shrink-0 text-gh-fg-muted" viewBox="0 0 16 16" width="14" height="14" fill="none">
                    <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Questions */}
          <div className="space-y-5">
            {(
              [
                { key: 'junior', label: 'Junior', cls: 'bg-gh-green-subtle text-gh-green border-gh-green/30' },
                { key: 'mid',    label: 'Mid',    cls: 'bg-gh-blue-subtle text-gh-blue border-gh-blue/30' },
                { key: 'senior', label: 'Senior', cls: 'bg-gh-purple-subtle text-gh-purple border-gh-purple/30' },
              ] as const
            ).map(({ key, label, cls }) => (
              <div key={key}>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-sans font-semibold text-xs uppercase tracking-wide text-gh-fg-muted">
                    Questions
                  </h4>
                  <span className={`font-sans text-xs font-semibold border rounded-full px-2 py-0.5 ${cls}`}>
                    {label}
                  </span>
                </div>
                <ol className="space-y-2.5">
                  {evalResult.questions[key].map((q, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="font-mono text-gh-fg-subtle text-xs mt-0.5 w-4 flex-shrink-0">{i + 1}.</span>
                      <div>
                        <span className={`inline-block font-sans text-xs font-semibold rounded px-1.5 py-0.5 mr-2 ${
                          q.type === 'tech'
                            ? 'bg-gh-blue-subtle text-gh-blue'
                            : 'bg-gh-canvas text-gh-fg-muted border border-gh-border'
                        }`}>
                          {q.type === 'tech' ? 'Tech' : 'General'}
                        </span>
                        <span className="font-sans text-gh-fg text-sm">{q.question}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gh-border-muted bg-gh-canvas flex gap-2">
        {status !== 'done' && (
          <button
            onClick={onRun}
            disabled={isRunning}
            className="gh-btn-primary disabled:opacity-50"
          >
            {isRunning ? label : status === 'error' ? 'Retry' : 'Generate'}
          </button>
        )}
        {status === 'done' && (
          <>
            <button onClick={onRun} className="gh-btn-secondary text-xs">Regenerate</button>
            <button
              onClick={() => window.print()}
              className="gh-btn-secondary text-xs flex items-center gap-1.5"
            >
              <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
                <path d="M3.75 1h8.5c.966 0 1.75.784 1.75 1.75v3.536a2.246 2.246 0 0 1 1.5 2.107v3a.75.75 0 0 1-.75.75H13.5v.857A1.643 1.643 0 0 1 11.857 14H4.143A1.643 1.643 0 0 1 2.5 12.357V12H1a.75.75 0 0 1-.75-.75v-3c0-1.18.91-2.143 2.075-2.216V2.75C2.325 1.783 2.784 1 3.75 1Zm.5 5.5h7.5V2.75a.25.25 0 0 0-.25-.25h-7a.25.25 0 0 0-.25.25V6.5Zm-.5 5.857V10h8.5v2.357a.143.143 0 0 1-.143.143H4.143a.143.143 0 0 1-.143-.143ZM13.5 8a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"/>
              </svg>
              Print
            </button>
          </>
        )}
      </div>
    </div>
  )
}
