import { useState } from 'react'
import { JudgeProfileSchema } from '../../types'
import type { JudgeLevel, JudgeProfile } from '../../types'

interface Props {
  onDone: (profile: JudgeProfile) => void
}

const LEVELS: { value: JudgeLevel; label: string; desc: string; color: string }[] = [
  { value: 'junior', label: 'Junior', desc: '구현 경험 중심 — 어떻게 만들었나요?', color: 'gh-green' },
  { value: 'mid', label: 'Mid', desc: '구현 + 설계 판단 — 왜 이 방법인가요?', color: 'gh-blue' },
  { value: 'senior', label: 'Senior', desc: '트레이드오프 — 이 설계의 한계는?', color: 'gh-purple' },
]

export function SetupScreen({ onDone }: Props) {
  const [name, setName] = useState('')
  const [level, setLevel] = useState<JudgeLevel>('mid')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = JudgeProfileSchema.safeParse({ name, level })
    if (!result.success) {
      setError(result.error.errors[0].message)
      return
    }
    onDone(result.data)
  }

  return (
    <div className="min-h-screen bg-gh-canvas">
      {/* GitHub-style dark header */}
      <header className="bg-gh-header border-b border-black/30 px-6 py-3 flex items-center gap-3">
        <svg height="32" viewBox="0 0 16 16" width="32" fill="#f0f6fc">
          <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
        </svg>
        <span className="text-gh-header-text font-sans font-semibold text-sm">mini-judge</span>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-gh-fg font-sans font-bold text-2xl mb-1">Session Setup</h1>
          <p className="text-gh-fg-muted font-sans text-sm">
            URL 하나로 팀 고유 평가표와 질문 시트를 자동 생성합니다
          </p>
        </div>

        <form onSubmit={handleSubmit} className="gh-card p-6 space-y-5">
          <div>
            <label className="gh-label">Judge name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              placeholder="심사위원 이름"
              className="gh-input"
              autoFocus
            />
          </div>

          <div>
            <label className="gh-label">Judge level</label>
            <p className="text-gh-fg-muted text-xs font-sans mb-3">
              레벨에 따라 질문 관점이 달라집니다 (피심사자 난이도는 동일)
            </p>
            <div className="flex flex-col gap-2">
              {LEVELS.map(({ value, label, desc }) => (
                <label
                  key={value}
                  className={`flex items-start gap-3 border rounded-md px-4 py-3 cursor-pointer transition-colors ${
                    level === value
                      ? 'border-gh-blue bg-gh-blue-subtle'
                      : 'border-gh-border bg-gh-surface hover:bg-gh-canvas'
                  }`}
                >
                  <input
                    type="radio"
                    name="level"
                    value={value}
                    checked={level === value}
                    onChange={() => setLevel(value)}
                    className="mt-0.5 accent-gh-blue"
                  />
                  <div>
                    <span className="font-sans font-semibold text-gh-fg text-sm">{label}</span>
                    <span className="block font-sans text-gh-fg-muted text-xs mt-0.5">{desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-gh-red-subtle border border-gh-red/30 rounded-md px-3 py-2">
              <p className="font-sans text-gh-red text-sm">{error}</p>
            </div>
          )}

          <button type="submit" className="gh-btn-primary w-full py-2 text-center">
            Start session
          </button>
        </form>
      </main>
    </div>
  )
}
