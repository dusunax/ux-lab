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
        <svg height="28" viewBox="0 0 16 16" width="28" fill="#f0f6fc">
          <path d="M7.467.133a1.748 1.748 0 0 1 1.066 0l5.25 1.68A1.75 1.75 0 0 1 15 3.48V8c0 3.045-1.86 5.61-4.655 6.753l-1.94.776a.75.75 0 0 1-.81 0l-1.94-.776C2.86 13.61 1 11.044 1 8V3.48a1.75 1.75 0 0 1 1.217-1.667Zm.61 1.429a.25.25 0 0 0-.153 0l-5.25 1.68a.25.25 0 0 0-.174.238V8c0 2.56 1.565 4.706 3.91 5.667l1.59.635 1.59-.635C11.435 12.706 13 10.559 13 8V3.48a.25.25 0 0 0-.174-.237ZM11.28 6.78l-3.5 3.5a.75.75 0 0 1-1.06 0l-1.5-1.5a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018l.97.97 2.97-2.97a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z" />
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
