import { useRef, useState } from 'react'
import type { TeamInput } from '../../types'

interface Props {
  onAdd: (input: Omit<TeamInput, 'id'>) => void
  onCancel: () => void
  initialValues?: Omit<TeamInput, 'id'>
  submitLabel?: string
}

const EMPTY: Omit<TeamInput, 'id'> = {
  teamNumber: '',
  title: '',
  description: '',
  githubUrl: '',
  notionUrl: '',
  manualReadme: '',
  notionImage: '',
}

function NotionImageInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function readFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => onChange(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handlePaste(e: React.ClipboardEvent) {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith('image/'))
    if (item) readFile(item.getAsFile()!)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) readFile(file)
  }

  if (value) {
    return (
      <div className="relative rounded-md overflow-hidden border border-gh-border">
        <img src={value} alt="Notion screenshot" className="w-full max-h-48 object-cover object-top" />
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute top-2 right-2 bg-gh-header/80 text-gh-header-text rounded-md px-2 py-1 font-sans text-xs hover:bg-gh-header transition-colors"
        >
          Remove
        </button>
      </div>
    )
  }

  return (
    <div
      tabIndex={0}
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onClick={() => fileRef.current?.click()}
      className={`flex flex-col items-center justify-center gap-2 rounded-md border border-dashed cursor-pointer py-6 transition-colors ${
        dragging
          ? 'border-gh-blue bg-gh-blue-subtle'
          : 'border-gh-border hover:border-gh-fg-muted hover:bg-gh-canvas'
      }`}
    >
      <svg viewBox="0 0 16 16" width="20" height="20" fill="#8c959f">
        <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8V1.5Z"/>
      </svg>
      <div className="text-center">
        <p className="font-sans text-gh-fg-muted text-xs">스크린샷을 붙여넣거나 파일 선택</p>
        <p className="font-sans text-gh-fg-subtle text-xs mt-0.5">Ctrl+V · 드래그 앤 드롭 · 클릭</p>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])}
      />
    </div>
  )
}

export function TeamForm({ onAdd, onCancel, initialValues, submitLabel = 'Add team' }: Props) {
  const [form, setForm] = useState(initialValues ?? EMPTY)
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="gh-label">Team number</label>
          <input
            type="text"
            value={form.teamNumber}
            onChange={(e) => set('teamNumber', e.target.value)}
            placeholder="1조, 2팀 …"
            className="gh-input"
            autoFocus
          />
        </div>

        <div>
          <label className="gh-label">Project name <span className="text-gh-red">*</span></label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="팀 / 프로젝트명"
            className="gh-input"
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
          <label className="gh-label">Notion URL <span className="text-gh-fg-subtle font-normal">(참고용)</span></label>
          <input
            type="url"
            value={form.notionUrl}
            onChange={(e) => set('notionUrl', e.target.value)}
            placeholder="https://notion.so/..."
            className="gh-input font-mono text-xs"
          />
        </div>

        <div className="col-span-2">
          <label className="gh-label">Notion 스크린샷</label>
          <NotionImageInput value={form.notionImage} onChange={(v) => set('notionImage', v)} />
        </div>
      </div>

      {!form.githubUrl && (
        <details className="group">
          <summary className="text-gh-fg-muted font-sans text-xs cursor-pointer hover:text-gh-fg select-none list-none flex items-center gap-1">
            <svg className="w-3 h-3 group-open:rotate-90 transition-transform" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"/>
            </svg>
            GitHub URL 없이 README 직접 입력
          </summary>
          <div className="mt-3 pl-4 border-l-2 border-gh-border-muted">
            <label className="gh-label text-gh-fg-muted">README 내용 붙여넣기</label>
            <textarea
              value={form.manualReadme}
              onChange={(e) => set('manualReadme', e.target.value)}
              placeholder="README.md 내용을 여기에 붙여넣으세요"
              rows={4}
              className="gh-textarea font-mono text-xs"
            />
          </div>
        </details>
      )}

      {error && (
        <div className="bg-gh-red-subtle border border-gh-red/30 rounded-md px-3 py-2">
          <p className="font-sans text-gh-red text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button type="submit" className="gh-btn-primary">{submitLabel}</button>
        <button type="button" onClick={onCancel} className="gh-btn-secondary">Cancel</button>
      </div>
    </form>
  )
}
