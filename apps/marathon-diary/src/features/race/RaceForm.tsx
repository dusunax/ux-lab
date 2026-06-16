import { useState, useCallback } from 'react'
import { Race } from '../../types/race'
import { saveRace } from '../db/races'
import { Route } from '../../App'
import BibInput from './BibInput'
import RecordInput, { RecordValues } from './RecordInput'

function generateId(): string {
  return `race-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0] ?? ''
}

function getCurrentYear(): number {
  return new Date().getFullYear()
}

interface Props {
  onNavigate: (route: Route) => void
}

export default function RaceForm({ onNavigate }: Props) {
  const [bibNumber, setBibNumber] = useState('')
  const [bibPhotoId, setBibPhotoId] = useState<string | undefined>()
  const [record, setRecord] = useState<RecordValues>({
    date: getTodayString(),
    distance: 42.195,
    finishTime: '04:00:00',
    raceName: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!bibNumber.trim()) {
        setError('배번호를 입력해주세요.')
        return
      }
      if (!record.date) {
        setError('레이스 날짜를 입력해주세요.')
        return
      }
      if (!record.distance || record.distance <= 0) {
        setError('거리를 입력해주세요.')
        return
      }

      setError(null)
      setSaving(true)

      try {
        const race: Race = {
          id: generateId(),
          bibNumber: bibNumber.trim(),
          raceName: record.raceName.trim() || undefined,
          season: getCurrentYear(),
          date: record.date,
          distance: record.distance,
          finishTime: record.finishTime,
          photoIds: {
            bib: bibPhotoId,
          },
          createdAt: new Date().toISOString(),
        }

        await saveRace(race)
        onNavigate({ path: '/race/:id', id: race.id })
      } catch {
        setError('저장에 실패했습니다. 다시 시도해주세요.')
      } finally {
        setSaving(false)
      }
    },
    [bibNumber, bibPhotoId, record, onNavigate]
  )

  return (
    <main className="min-h-screen bg-cream">
      <header className="px-4 py-4 md:px-8 flex items-center gap-4 border-b border-bark/10">
        <button
          className="btn-ghost text-sm"
          onClick={() => onNavigate({ path: '/' })}
          type="button"
          aria-label="앨범 목록으로 돌아가기"
        >
          ← 취소
        </button>
        <h1 className="font-handwriting text-3xl text-ink">새 레이스 기록</h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-8"
        noValidate
        aria-label="새 레이스 기록 폼"
      >
        <section aria-labelledby="bib-section-heading">
          <h2 id="bib-section-heading" className="text-bark font-medium text-base mb-4 pb-1 border-b border-bark/10">
            배번호
          </h2>
          <BibInput
            value={bibNumber}
            onChange={setBibNumber}
            photoId={bibPhotoId}
            onPhotoSave={setBibPhotoId}
          />
        </section>

        <section aria-labelledby="record-section-heading">
          <h2 id="record-section-heading" className="text-bark font-medium text-base mb-4 pb-1 border-b border-bark/10">
            레이스 기록
          </h2>
          <RecordInput values={record} onChange={setRecord} />
        </section>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary w-full py-3 text-base font-medium disabled:opacity-50"
          disabled={saving}
          aria-busy={saving}
        >
          {saving ? '저장 중…' : '스티커 페이지 만들기 🏅'}
        </button>
      </form>
    </main>
  )
}
