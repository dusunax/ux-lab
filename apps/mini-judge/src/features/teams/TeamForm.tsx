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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block font-display text-judge-gold tracking-widest text-xs mb-2">
          PROJECT NAME *
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="팀 / 프로젝트명"
          className="w-full bg-judge-bg border border-judge-border text-judge-cream font-sans px-4 py-2.5 focus:outline-none focus:border-judge-gold transition-colors placeholder:text-judge-muted text-sm"
        />
      </div>

      <div>
        <label className="block font-display text-judge-gold tracking-widest text-xs mb-2">
          DESCRIPTION
        </label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="팀 소개 또는 프로젝트 한 줄 설명"
          rows={2}
          className="w-full bg-judge-bg border border-judge-border text-judge-cream font-sans px-4 py-2.5 focus:outline-none focus:border-judge-gold transition-colors placeholder:text-judge-muted text-sm resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-judge-gold tracking-widest text-xs mb-2">
            GITHUB URL
          </label>
          <input
            type="url"
            value={form.githubUrl}
            onChange={(e) => set('githubUrl', e.target.value)}
            placeholder="https://github.com/..."
            className="w-full bg-judge-bg border border-judge-border text-judge-cream font-mono px-4 py-2.5 focus:outline-none focus:border-judge-gold transition-colors placeholder:text-judge-muted text-xs"
          />
        </div>
        <div>
          <label className="block font-display text-judge-gold tracking-widest text-xs mb-2">
            NOTION URL
          </label>
          <input
            type="url"
            value={form.notionUrl}
            onChange={(e) => set('notionUrl', e.target.value)}
            placeholder="https://notion.so/..."
            className="w-full bg-judge-bg border border-judge-border text-judge-cream font-mono px-4 py-2.5 focus:outline-none focus:border-judge-gold transition-colors placeholder:text-judge-muted text-xs"
          />
        </div>
      </div>

      {/* Manual fallback fields */}
      {(!form.githubUrl) && (
        <div>
          <label className="block font-display text-judge-muted tracking-widest text-xs mb-2">
            README 직접 입력 (GitHub URL 없을 때)
          </label>
          <textarea
            value={form.manualReadme}
            onChange={(e) => set('manualReadme', e.target.value)}
            placeholder="README 내용을 붙여넣으세요"
            rows={3}
            className="w-full bg-judge-bg border border-judge-border text-judge-cream font-mono px-4 py-2.5 focus:outline-none focus:border-judge-gold/50 transition-colors placeholder:text-judge-muted text-xs resize-none"
          />
        </div>
      )}

      {(!form.notionUrl) && (
        <div>
          <label className="block font-display text-judge-muted tracking-widest text-xs mb-2">
            NOTION 내용 직접 입력 (Notion URL 없을 때)
          </label>
          <textarea
            value={form.manualNotion}
            onChange={(e) => set('manualNotion', e.target.value)}
            placeholder="Notion 페이지 내용을 붙여넣으세요"
            rows={3}
            className="w-full bg-judge-bg border border-judge-border text-judge-cream font-mono px-4 py-2.5 focus:outline-none focus:border-judge-gold/50 transition-colors placeholder:text-judge-muted text-xs resize-none"
          />
        </div>
      )}

      {error && <p className="font-sans text-judge-error text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 bg-judge-gold text-judge-bg font-display tracking-widest text-sm py-3 hover:bg-judge-cream transition-colors"
        >
          ADD TEAM
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 border border-judge-border text-judge-muted font-display tracking-widest text-sm py-3 hover:border-judge-gold hover:text-judge-cream transition-colors"
        >
          CANCEL
        </button>
      </div>
    </form>
  )
}
