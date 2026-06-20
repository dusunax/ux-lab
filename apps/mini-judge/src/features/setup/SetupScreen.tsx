import { useState } from 'react'
import { JudgeProfileSchema } from '../../types'
import type { JudgeLevel, JudgeProfile } from '../../types'

interface Props {
  onDone: (profile: JudgeProfile) => void
}

const LEVELS: { value: JudgeLevel; label: string; desc: string }[] = [
  { value: 'junior', label: 'JUNIOR', desc: '구현 경험 중심 질문' },
  { value: 'mid', label: 'MID', desc: '구현 + 설계 판단 질문' },
  { value: 'senior', label: 'SENIOR', desc: '설계 의도·트레이드오프 질문' },
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
    <div className="min-h-screen bg-judge-bg flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-12">
          <p className="font-display text-judge-gold tracking-widest text-sm mb-2">BOOTCAMP DEMO DAY</p>
          <h1 className="font-display text-judge-cream text-7xl leading-none tracking-wide">
            MINI<br />JUDGE
          </h1>
          <div className="mt-4 h-px bg-judge-border" />
          <p className="mt-4 font-sans text-judge-muted text-sm">
            URL 하나로 팀 고유 평가표와 질문 시트를 자동 생성합니다
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block font-display text-judge-gold tracking-widest text-xs mb-3">
              JUDGE NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              placeholder="심사위원 이름"
              className="w-full bg-judge-surface border border-judge-border text-judge-cream font-sans px-4 py-3 focus:outline-none focus:border-judge-gold transition-colors placeholder:text-judge-muted"
            />
          </div>

          <div>
            <label className="block font-display text-judge-gold tracking-widest text-xs mb-3">
              JUDGE LEVEL
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLevel(value)}
                  className={`border px-3 py-4 text-left transition-all ${
                    level === value
                      ? 'border-judge-gold bg-judge-gold/10'
                      : 'border-judge-border bg-judge-surface hover:border-judge-gold/50'
                  }`}
                >
                  <span className="block font-display text-judge-cream tracking-widest text-sm">
                    {label}
                  </span>
                  <span className="block font-sans text-judge-muted text-xs mt-1 leading-tight">
                    {desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="font-sans text-judge-error text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-judge-gold text-judge-bg font-display tracking-widest text-lg py-4 hover:bg-judge-cream transition-colors"
          >
            START SESSION
          </button>
        </form>
      </div>
    </div>
  )
}
