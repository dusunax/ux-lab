import { useMemo } from 'react'
import type { SessionRecord } from '../../types/quiz'

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function accuracyColor(pct: number): string {
  if (pct >= 80) return 'text-green-400'
  if (pct >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

interface HistoryViewProps {
  records: SessionRecord[]
  onRetryWrong: (record: SessionRecord) => void
}

export function HistoryView({ records, onRetryWrong }: HistoryViewProps) {
  const stats = useMemo(() => {
    if (records.length === 0) return null
    const totalQ = records.reduce((s, r) => s + r.total, 0)
    const totalC = records.reduce((s, r) => s + r.correct, 0)
    return {
      sessions: records.length,
      totalQ,
      totalC,
      accuracy: totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0,
    }
  }, [records])

  if (records.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-20 space-y-3">
        <p className="text-5xl">📋</p>
        <p className="text-gray-400">아직 학습 이력이 없습니다.</p>
        <p className="text-gray-600 text-sm">퀴즈를 완료하면 이력이 기록됩니다.</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-white">학습 이력</h2>
        <p className="text-gray-500 text-sm">최근 {records.length}세션</p>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { value: stats.sessions, label: '세션', color: 'text-white' },
            { value: stats.totalQ, label: '총 문항', color: 'text-white' },
            { value: stats.totalC, label: '정답', color: 'text-green-400' },
            {
              value: `${stats.accuracy}%`,
              label: '정답률',
              color: accuracyColor(stats.accuracy),
            },
          ].map(({ value, label, color }) => (
            <div key={label} className="bg-gray-900 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
              <p className="text-gray-500 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {records.map((record) => {
          const pct = record.total > 0 ? Math.round((record.correct / record.total) * 100) : 0
          const wrongCount = record.wrongQuizzes?.length ?? 0
          return (
            <div
              key={record.id}
              className="w-full bg-gray-900 rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="text-white text-sm font-medium truncate">{record.source}</p>
                <p className="text-gray-500 text-xs">
                  {formatDate(record.date)} · {formatDuration(record.durationMs)}
                </p>
                <p className="text-gray-600 text-xs">
                  {wrongCount > 0 ? `오답 ${wrongCount}개 다시 풀기` : '오답 없음'}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className={`text-lg font-bold tabular-nums ${accuracyColor(pct)}`}>{pct}%</p>
                <p className="text-gray-500 text-xs">
                  {record.correct}/{record.total}
                </p>
                <button
                  type="button"
                  onClick={() => onRetryWrong(record)}
                  disabled={wrongCount === 0}
                  className={`mt-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    wrongCount > 0
                      ? 'bg-blue-600 text-white hover:bg-blue-500'
                      : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  오답 다시 풀기
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
