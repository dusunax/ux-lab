import type { QuizResult } from '../../types/quiz'

interface SessionResultProps {
  total: number
  results: Map<string, QuizResult>
  durationMs: number
  onRestart: () => void
  onRetryWrong: () => void
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function SessionResult({
  total,
  results,
  durationMs,
  onRestart,
  onRetryWrong,
}: SessionResultProps) {
  const correctCount = Array.from(results.values()).filter(
    (r) => r.status === 'correct'
  ).length
  const wrongCount = Array.from(results.values()).filter(
    (r) => r.status === 'wrong'
  ).length
  const accuracyPercent =
    total > 0 ? Math.round((correctCount / total) * 100) : 0

  const hasWrong = wrongCount > 0

  const scoreColor =
    accuracyPercent >= 80
      ? 'text-green-400'
      : accuracyPercent >= 50
      ? 'text-yellow-400'
      : 'text-red-400'

  return (
    <div
      className="w-full max-w-md mx-auto space-y-8 text-center"
      role="main"
      aria-label="세션 결과"
    >
      <div className="space-y-2">
        <p className="text-gray-400 text-sm uppercase tracking-widest">결과</p>
        <p className={`text-6xl font-bold tabular-nums ${scoreColor}`}>
          {correctCount}
          <span className="text-gray-600 text-4xl"> / {total}</span>
        </p>
        <p className="text-gray-400 text-lg">정답률 {accuracyPercent}%</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-gray-900 rounded-xl p-4">
          <p className="text-2xl font-bold text-white tabular-nums">{total}</p>
          <p className="text-gray-500 text-xs mt-1">전체</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4">
          <p className="text-2xl font-bold text-green-400 tabular-nums">{correctCount}</p>
          <p className="text-gray-500 text-xs mt-1">정답</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4">
          <p className="text-2xl font-bold text-red-400 tabular-nums">{wrongCount}</p>
          <p className="text-gray-500 text-xs mt-1">오답</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-300 tabular-nums">{formatDuration(durationMs)}</p>
          <p className="text-gray-500 text-xs mt-1">소요 시간</p>
        </div>
      </div>

      {/* 버튼 */}
      <div className="space-y-3">
        <button
          onClick={onRestart}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          다시 풀기
        </button>
        <button
          onClick={onRetryWrong}
          disabled={!hasWrong}
          aria-disabled={!hasWrong}
          className={`w-full py-4 font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            hasWrong
              ? 'bg-gray-800 hover:bg-gray-700 text-white'
              : 'bg-gray-900 text-gray-600 cursor-not-allowed'
          }`}
        >
          {hasWrong ? `오답만 풀기 (${wrongCount}개)` : '오답 없음'}
        </button>
      </div>
    </div>
  )
}
