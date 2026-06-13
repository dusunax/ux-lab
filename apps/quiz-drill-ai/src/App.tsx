import { useState, useCallback } from 'react'
import type { Quiz } from './types/quiz'
import { CsvInput } from './features/csv/CsvInput'
import { QuizScreen } from './features/quiz/QuizScreen'
import { SessionResult } from './features/quiz/SessionResult'
import { useQuizSession } from './features/quiz/useQuizSession'

type View = 'setup' | 'quiz' | 'result'

export default function App() {
  const [view, setView] = useState<View>('setup')

  const session = useQuizSession()
  const { loadQuizzes, restartSession, retryWrong } = session

  const handleLoad = useCallback(
    (quizzes: Quiz[]) => {
      loadQuizzes(quizzes)
    },
    [loadQuizzes]
  )

  const handleStart = useCallback(() => {
    if (session.quizzes.length > 0) {
      setView('quiz')
    }
  }, [session.quizzes.length])

  const handleShowResult = useCallback(() => {
    setView('result')
  }, [])

  const handleRestart = useCallback(() => {
    restartSession()
    setView('quiz')
  }, [restartSession])

  const handleRetryWrong = useCallback(() => {
    retryWrong()
    setView('quiz')
  }, [retryWrong])

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* 네비게이션 헤더 */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setView('setup')}
            className="text-lg font-bold text-white hover:text-blue-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            aria-label="홈으로 돌아가기"
          >
            Quiz Drill
          </button>
          {view !== 'setup' && (
            <button
              onClick={() => setView('setup')}
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-2 py-1"
            >
              새 세션
            </button>
          )}
        </div>
      </header>

      <main className="px-6 py-10">
        {view === 'setup' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-white">Quiz Drill AI</h1>
              <p className="text-gray-400">CSV 파일로 나만의 퀴즈를 만들어 보세요</p>
            </div>

            <CsvInput onLoad={handleLoad} />

            {session.quizzes.length > 0 && (
              <div className="text-center">
                <button
                  onClick={handleStart}
                  className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  시작하기 ({session.quizzes.length}문제)
                </button>
              </div>
            )}
          </div>
        )}

        {view === 'quiz' && (
          <QuizScreen
            quizzes={session.quizzes}
            currentIndex={session.currentIndex}
            results={session.results}
            onSelectOption={session.selectOption}
            onNext={session.nextQuestion}
            onShowResult={handleShowResult}
          />
        )}

        {view === 'result' && (
          <SessionResult
            total={session.quizzes.length}
            results={session.results}
            onRestart={handleRestart}
            onRetryWrong={handleRetryWrong}
          />
        )}
      </main>
    </div>
  )
}
