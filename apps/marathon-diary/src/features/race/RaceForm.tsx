import { useState, useCallback } from 'react'
import { Race } from '../../types/race'
import { saveRace } from '../db/races'
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

function formatFinishTimeInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 6)
  const hh = digits.slice(0, 2)
  const mm = digits.slice(2, 4)
  const ss = digits.slice(4, 6)
  return [hh, mm, ss].filter(Boolean).join(':')
}

function clampTimePart(value: string, max: number): string {
  const parsed = parseInt(value, 10)
  if (Number.isNaN(parsed)) return '00'
  return String(Math.min(Math.max(parsed, 0), max)).padStart(2, '0')
}

function normalizeFinishTimeInput(value: string): string {
  if (!value.trim()) return ''
  const [hh = '', mm = '', ss = ''] = formatFinishTimeInput(value).split(':')
  return [
    clampTimePart(hh, 99),
    clampTimePart(mm, 59),
    clampTimePart(ss, 59),
  ].join(':')
}

interface Props {
  onNavigate: (route: { path: '/' }) => void
  landscape?: boolean
}

export default function RaceForm({ onNavigate, landscape = false }: Props) {
  const [bibNumber, setBibNumber] = useState('')
  const [bibPhotoId, setBibPhotoId] = useState<string | undefined>()
  const [record, setRecord] = useState<RecordValues>({
    date: getTodayString(),
    distance: 42.195,
    finishTime: '',
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
        onNavigate({ path: '/' })
      } catch {
        setError('저장에 실패했습니다. 다시 시도해주세요.')
      } finally {
        setSaving(false)
      }
    },
    [bibNumber, bibPhotoId, record, onNavigate] // eslint-disable-line react-hooks/exhaustive-deps
  )

  if (landscape) {
    return (
      <div className="h-full bg-cream p-8 overflow-hidden">
        <div
          className="w-full h-full flex flex-col justify-center gap-4"
          onPointerDownCapture={(e) => e.stopPropagation()}
          onMouseDownCapture={(e) => e.stopPropagation()}
          onTouchStartCapture={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-end justify-between border-b border-bark/10 pb-2">
            <p className="font-handwriting text-2xl text-ink leading-none">새 레이스 기록</p>
            <span className="text-[10px] tracking-[0.18em] uppercase text-bark-light">race note</span>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 min-h-0" noValidate>
            <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-5 min-h-0">
              <div className="min-w-0 flex flex-col justify-between gap-3 rounded border border-bark/10 bg-white/35 p-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-bark font-medium">배번호</label>
                  <input
                    type="text"
                    value={bibNumber}
                    onChange={(e) => setBibNumber(e.target.value)}
                    placeholder="12345"
                    className="border border-bark/25 rounded bg-white px-3 py-2.5 font-handwriting text-3xl leading-none text-ink shadow-inner focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>
                <p className="text-[10px] leading-relaxed text-bark-light">
                  앨범 페이지의 대표 배번호로 표시됩니다.
                </p>
              </div>
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_5rem] gap-3 min-h-0">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-bark font-medium">날짜</label>
                  <input type="date" value={record.date}
                    onChange={(e) => setRecord({ ...record, date: e.target.value })}
                    className="w-full min-w-0 border border-bark/25 rounded bg-white px-2.5 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-gold" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-bark font-medium">거리(km)</label>
                  <input type="number" min="0" max="500" step="0.1" value={record.distance || ''}
                    onChange={(e) => setRecord({ ...record, distance: parseFloat(e.target.value) || 0 })}
                    placeholder="42.195"
                    className="w-full min-w-0 border border-bark/25 rounded bg-white px-2.5 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-gold" />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs text-bark font-medium">완주 시간</label>
                  <input type="text" value={record.finishTime}
                    inputMode="numeric"
                    pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}"
                    maxLength={8}
                    onChange={(e) => setRecord({ ...record, finishTime: formatFinishTimeInput(e.target.value) })}
                    onBlur={(e) => setRecord({ ...record, finishTime: normalizeFinishTimeInput(e.target.value) })}
                    placeholder="04:00:00"
                    className="w-full border border-bark/25 rounded bg-white px-3 py-2 text-center font-handwriting text-xl leading-none text-gold placeholder:text-gold/35 focus:outline-none focus:ring-1 focus:ring-gold" />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-xs text-bark font-medium">대회명 <span className="text-bark-light font-normal">(선택)</span></label>
                  <input type="text" value={record.raceName} maxLength={50}
                    onChange={(e) => setRecord({ ...record, raceName: e.target.value })}
                    placeholder="예: 서울마라톤 2026"
                    className="w-full border border-bark/25 rounded bg-white px-2.5 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-gold" />
                </div>
              </div>
            </div>
            {error && <p className="text-red-600 text-xs flex-shrink-0" role="alert">{error}</p>}
            <button type="submit" className="btn-primary py-2 text-sm flex-shrink-0" disabled={saving} aria-busy={saving}>
              {saving ? '저장 중…' : '추가'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-cream">
      <header className="px-4 py-4 md:px-8 flex items-center border-b border-bark/10">
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
          {saving ? '저장 중…' : '추가'}
        </button>
      </form>
    </main>
  )
}
