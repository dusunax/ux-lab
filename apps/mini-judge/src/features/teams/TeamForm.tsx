import { useState } from 'react'
import type { TeamInput } from '../../types'

interface Props {
  onAdd: (input: Omit<TeamInput, 'id'>) => void
  onCancel: () => void
}

const EMPTY: Omit<TeamInput, 'id'> = {
  title: '',
  description: '',
  githubUrl: '',
  notionUrl: '',
  manualReadme: '',
  manualNotion: '',
}

export function TeamForm({ onAdd, onCancel }: Props) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  function set(key: keyof typeof EMPTY, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('팀/프로젝트명을 입력해주세요'); return }
    onAdd(form)
  }

  const showReadmeFallback = !form.githubUrl
  const showNotionFallback = !form.notionUrl

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="gh-label">Project name <span className="text-gh-red">*</span></label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="팀 / 프로젝트명"
            className="gh-input"
            autoFocus
          />
        </div>

        <div className="col-span-2">
          <label className="gh-label">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="한 줄 팀 소개 (선택)"
            rows={2}
            className="gh-textarea"
          />
        </div>

        <div>
          <label className="gh-label">GitHub URL</label>
          <input
            type="url"
            value={form.githubUrl}
            onChange={(e) => set('githubUrl', e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="gh-input font-mono text-xs"
          />
        </div>

        <div>
          <label className="gh-label">Notion URL</label>
          <input
            type="url"
            value={form.notionUrl}
            onChange={(e) => set('notionUrl', e.target.value)}
            placeholder="https://notion.so/..."
            className="gh-input font-mono text-xs"
          />
        </div>
      </div>

      {(showReadmeFallback || showNotionFallback) && (
        <details className="group">
          <summary className="text-gh-fg-muted font-sans text-xs cursor-pointer hover:text-gh-fg select-none list-none flex items-center gap-1">
            <svg className="w-3 h-3 group-open:rotate-90 transition-transform" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"/>
            </svg>
            URL 없이 직접 입력
          </summary>
          <div className="mt-3 space-y-3 pl-4 border-l-2 border-gh-border-muted">
            {showReadmeFallback && (
              <div>
                <label className="gh-label text-gh-fg-muted">README 내용 붙여넣기</label>
                <textarea
                  value={form.manualReadme}
                  onChange={(e) => set('manualReadme', e.target.value)}
                  placeholder="README.md 내용을 여기에 붙여넣으세요"
                  rows={4}
                  className="gh-textarea font-mono text-xs"
                />
              </div>
            )}
            {showNotionFallback && (
              <div>
                <label className="gh-label text-gh-fg-muted">Notion 내용 붙여넣기</label>
                <textarea
                  value={form.manualNotion}
                  onChange={(e) => set('manualNotion', e.target.value)}
                  placeholder="Notion 페이지 내용을 여기에 붙여넣으세요"
                  rows={4}
                  className="gh-textarea font-mono text-xs"
                />
              </div>
            )}
          </div>
        </details>
      )}

      {error && (
        <div className="bg-gh-red-subtle border border-gh-red/30 rounded-md px-3 py-2">
          <p className="font-sans text-gh-red text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button type="submit" className="gh-btn-primary">Add team</button>
        <button type="button" onClick={onCancel} className="gh-btn-secondary">Cancel</button>
      </div>
    </form>
  )
}
