import type { Team } from '../../types'

interface Props {
  team: Team
  index: number
  onRun: () => void
  onRemove: () => void
  onFallback: (field: 'manualReadme' | 'manualNotion', value: string) => void
}

const STATUS_LABEL: Record<Team['status'], string> = {
  pending: 'PENDING',
  parsing: 'PARSING...',
  generating: 'GENERATING...',
  done: 'DONE',
  error: 'ERROR',
}

const STATUS_COLOR: Record<Team['status'], string> = {
  pending: 'text-judge-muted border-judge-border',
  parsing: 'text-judge-warn border-judge-warn',
  generating: 'text-judge-gold border-judge-gold',
  done: 'text-judge-success border-judge-success',
  error: 'text-judge-error border-judge-error',
}

export function TeamCard({ team, index, onRun, onRemove, onFallback }: Props) {
  const { input, status, evalResult, parseResult, error } = team
  const isRunning = status === 'parsing' || status === 'generating'
  const needsFallbackReadme = parseResult?.githubStatus === 'failed' && !input.manualReadme
  const needsFallbackNotion = parseResult?.notionStatus === 'failed' && !input.manualNotion

  return (
    <div className="border border-judge-border bg-judge-surface">
      {/* Card header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-judge-border">
        <div className="flex items-center gap-4">
          <span className="font-display text-judge-gold-dim text-2xl leading-none">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div>
            <h3 className="font-display text-judge-cream tracking-wide text-lg leading-none">
              {input.title}
            </h3>
            {input.description && (
              <p className="font-sans text-judge-muted text-xs mt-1">{input.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`font-display tracking-widest text-xs border px-2 py-1 ${STATUS_COLOR[status]}`}>
            {STATUS_LABEL[status]}
          </span>
          <button
            onClick={onRemove}
            disabled={isRunning}
            className="font-sans text-judge-muted hover:text-judge-error text-xs transition-colors disabled:opacity-30"
          >
            REMOVE
          </button>
        </div>
      </div>

      {/* Parse status */}
      {parseResult && (
        <div className="px-5 py-3 border-b border-judge-border flex gap-6 text-xs font-mono">
          <span className={parseResult.githubStatus === 'success' ? 'text-judge-success' : parseResult.githubStatus === 'failed' ? 'text-judge-error' : 'text-judge-muted'}>
            GitHub: {parseResult.githubStatus}
          </span>
          <span className={parseResult.notionStatus === 'success' ? 'text-judge-success' : parseResult.notionStatus === 'failed' ? 'text-judge-error' : 'text-judge-muted'}>
            Notion: {parseResult.notionStatus}
          </span>
        </div>
      )}

      {/* Fallback inputs */}
      {(needsFallbackReadme || needsFallbackNotion) && (
        <div className="px-5 py-4 border-b border-judge-border space-y-4 bg-judge-error/5">
          <p className="font-display text-judge-error tracking-widest text-xs">
            PARSE FAILED — 수동 보강 필요
          </p>
          {needsFallbackReadme && (
            <div>
              <label className="block font-display text-judge-muted tracking-widest text-xs mb-2">
                README 내용 직접 입력
              </label>
              <textarea
                rows={3}
                placeholder="GitHub README 내용을 붙여넣으세요"
                className="w-full bg-judge-bg border border-judge-border text-judge-cream font-mono px-3 py-2 focus:outline-none focus:border-judge-gold text-xs resize-none placeholder:text-judge-muted"
                onChange={(e) => onFallback('manualReadme', e.target.value)}
              />
            </div>
          )}
          {needsFallbackNotion && (
            <div>
              <label className="block font-display text-judge-muted tracking-widest text-xs mb-2">
                NOTION 내용 직접 입력
              </label>
              <textarea
                rows={3}
                placeholder="Notion 페이지 내용을 붙여넣으세요"
                className="w-full bg-judge-bg border border-judge-border text-judge-cream font-mono px-3 py-2 focus:outline-none focus:border-judge-gold text-xs resize-none placeholder:text-judge-muted"
                onChange={(e) => onFallback('manualNotion', e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {status === 'error' && error && (
        <div className="px-5 py-3 border-b border-judge-border">
          <p className="font-mono text-judge-error text-xs">{error}</p>
        </div>
      )}

      {/* Eval result */}
      {evalResult && status === 'done' && (
        <div className="px-5 py-5 space-y-5">
          {/* Summary */}
          <div>
            <p className="font-display text-judge-gold tracking-widest text-xs mb-2">PROJECT SUMMARY</p>
            <p className="font-sans text-judge-cream text-sm leading-relaxed">{evalResult.projectSummary}</p>
          </div>

          {/* Tech stack */}
          <div>
            <p className="font-display text-judge-gold tracking-widest text-xs mb-2">TECH STACK</p>
            <div className="flex flex-wrap gap-2">
              {evalResult.techStack.map((t, i) => (
                <span key={i} className="font-mono text-judge-cream text-xs border border-judge-border px-2 py-1">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Checklist */}
          <div>
            <p className="font-display text-judge-gold tracking-widest text-xs mb-3">CHECKLIST</p>
            <ul className="space-y-2">
              {evalResult.checklist.map((item, i) => (
                <li key={i} className="flex items-start gap-3 font-sans text-judge-cream text-sm">
                  <span className="mt-0.5 w-4 h-4 border border-judge-border flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Questions */}
          <div>
            <p className="font-display text-judge-gold tracking-widest text-xs mb-3">QUESTIONS</p>
            <ol className="space-y-3">
              {evalResult.questions.map((q, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-display text-judge-gold-dim text-sm w-5 flex-shrink-0">
                    {i + 1}.
                  </span>
                  <div>
                    <span className={`font-display tracking-widest text-xs mr-2 ${q.type === 'tech' ? 'text-judge-gold' : 'text-judge-muted'}`}>
                      [{q.type.toUpperCase()}]
                    </span>
                    <span className="font-sans text-judge-cream text-sm">{q.question}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-4 border-t border-judge-border flex gap-3">
        {status !== 'done' && (
          <button
            onClick={onRun}
            disabled={isRunning}
            className="font-display tracking-widest text-sm px-6 py-2.5 bg-judge-gold text-judge-bg hover:bg-judge-cream transition-colors disabled:opacity-40"
          >
            {isRunning ? STATUS_LABEL[status] : status === 'error' ? 'RETRY' : 'GENERATE'}
          </button>
        )}
        {status === 'done' && (
          <button
            onClick={() => window.print()}
            className="font-display tracking-widest text-sm px-6 py-2.5 border border-judge-gold text-judge-gold hover:bg-judge-gold hover:text-judge-bg transition-colors"
          >
            PRINT
          </button>
        )}
      </div>
    </div>
  )
}
