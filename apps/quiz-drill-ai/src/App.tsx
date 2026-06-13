import { useState, useCallback, useEffect, useRef } from 'react'
import type { Quiz, SessionRecord, SessionQuizResult } from './types/quiz'
import { CsvInput } from './features/csv/CsvInput'
import { QuizScreen } from './features/quiz/QuizScreen'
import { SessionResult } from './features/quiz/SessionResult'
import { HistoryView } from './features/history/HistoryView'
import { useQuizSession } from './features/quiz/useQuizSession'
import { useSessionHistory } from './features/history/useSessionHistory'

type View = 'setup' | 'quiz' | 'result' | 'history'

const AUDIO_FADE_VALUE = 0.0001
const ANSWER_SOUND_VOLUME = 0.08
const CORRECT_SOUND_FREQUENCIES = [660, 880]
const WRONG_SOUND_FREQUENCIES = [440, 277]
const CORRECT_SOUND_DURATION_SEC = 0.12
const WRONG_SOUND_DURATION_SEC = 0.18

function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false

  const tagName = target.tagName
  return (
    target.isContentEditable ||
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT'
  )
}

function getPressedOptionNumber(e: KeyboardEvent): number | null {
  if (e.shiftKey) return null

  const digitMatch = /^Digit([1-9])$/.exec(e.code)
  if (digitMatch) return Number(digitMatch[1])

  const numpadMatch = /^Numpad([1-9])$/.exec(e.code)
  if (numpadMatch) return Number(numpadMatch[1])

  if (/^[1-9]$/.test(e.key)) return Number(e.key)

  return null
}

export default function App() {
  const [view, setView] = useState<View>('setup')
  const [sessionDurationMs, setSessionDurationMs] = useState(0)
  const [historyRecords, setHistoryRecords] = useState<SessionRecord[]>([])

  const session = useQuizSession()
  const { loadQuizzes, restartSession, retryWrong } = session
  const { addSession, getHistory } = useSessionHistory()

  const appRootRef = useRef<HTMLDivElement>(null)
  const quizKeyInputRef = useRef<HTMLInputElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const lastSourceRef = useRef<string>('')
  const sessionStartRef = useRef<number | null>(null)

  const playAnswerSound = useCallback((isCorrect: boolean) => {
    const AudioContextClass = window.AudioContext
    if (!AudioContextClass) return

    const context = audioContextRef.current ?? new AudioContextClass()
    audioContextRef.current = context

    if (context.state === 'suspended') {
      void context.resume()
    }

    const startAt = context.currentTime
    const frequencies = isCorrect ? CORRECT_SOUND_FREQUENCIES : WRONG_SOUND_FREQUENCIES

    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const toneStart = startAt + index * 0.08
      const toneEnd =
        toneStart + (isCorrect ? CORRECT_SOUND_DURATION_SEC : WRONG_SOUND_DURATION_SEC)

      oscillator.type = isCorrect ? 'sine' : 'square'
      oscillator.frequency.setValueAtTime(frequency, toneStart)
      gain.gain.setValueAtTime(AUDIO_FADE_VALUE, toneStart)
      gain.gain.exponentialRampToValueAtTime(ANSWER_SOUND_VOLUME, toneStart + 0.01)
      gain.gain.exponentialRampToValueAtTime(AUDIO_FADE_VALUE, toneEnd)

      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(toneStart)
      oscillator.stop(toneEnd + 0.02)
    })
  }, [])

  const handleLoad = useCallback(
    (quizzes: Quiz[], source: string) => {
      loadQuizzes(quizzes)
      lastSourceRef.current = source
    },
    [loadQuizzes]
  )

  const handleInvalidInput = useCallback(() => {
    loadQuizzes([])
    lastSourceRef.current = ''
  }, [loadQuizzes])

  const handleStart = useCallback(() => {
    if (session.quizzes.length > 0) {
      sessionStartRef.current = Date.now()
      setView('quiz')
    }
  }, [session.quizzes.length])

  const selectOptionWithFeedback = useCallback(
    (option: number) => {
      const currentQuiz = session.quizzes[session.currentIndex]
      if (!currentQuiz || session.results.has(currentQuiz.id)) return

      playAnswerSound(option === currentQuiz.answer)
      session.selectOption(option)
    },
    [playAnswerSound, session]
  )

  const handleShowResult = useCallback(() => {
    const durationMs = sessionStartRef.current
      ? Date.now() - sessionStartRef.current
      : 0
    const correct = Array.from(session.results.values()).filter(
      (r) => r.status === 'correct'
    ).length
    const wrongQuizzes = session.quizzes.filter((quiz) => {
      const result = session.results.get(quiz.id)
      return result?.status === 'wrong'
    })
    const quizResults: SessionQuizResult[] = session.quizzes.map((quiz) => {
      const result = session.results.get(quiz.id)
      return {
        quizId: quiz.id,
        status: result?.status === 'correct' ? 'correct' : 'wrong',
        selected: result?.selectedOption ?? 0,
      }
    })
    const record: SessionRecord = {
      id: String(Date.now()),
      date: new Date().toISOString(),
      source: lastSourceRef.current || '알 수 없음',
      total: session.quizzes.length,
      correct,
      durationMs,
      wrongQuizzes,
      quizResults,
    }
    addSession(record)
    setSessionDurationMs(durationMs)
    setView('result')
  }, [session.results, session.quizzes, addSession])

  const handleRestart = useCallback(() => {
    restartSession()
    sessionStartRef.current = Date.now()
    setView('quiz')
  }, [restartSession])

  const handleRetryWrong = useCallback(() => {
    retryWrong()
    sessionStartRef.current = Date.now()
    setView('quiz')
  }, [retryWrong])

  const handleShowHistory = useCallback(() => {
    setHistoryRecords(getHistory())
    setView('history')
  }, [getHistory])

  const handleRetryHistoryWrong = useCallback(
    (record: SessionRecord) => {
      if (!record.wrongQuizzes || record.wrongQuizzes.length === 0) return

      loadQuizzes(record.wrongQuizzes)
      lastSourceRef.current = `${record.source} 오답`
      sessionStartRef.current = Date.now()
      setView('quiz')
    },
    [loadQuizzes]
  )

  const focusQuizKeyInput = useCallback(() => {
    if (view !== 'quiz') return

    const frameId = requestAnimationFrame(() => {
      quizKeyInputRef.current?.focus({ preventScroll: true })
    })

    return frameId
  }, [view])

  useEffect(() => {
    const frameId = focusQuizKeyInput()
    return () => {
      if (frameId !== undefined) cancelAnimationFrame(frameId)
    }
  }, [focusQuizKeyInput, session.currentIndex, session.results])

  useEffect(() => {
    if (view !== 'quiz') return

    const handleWindowFocus = () => {
      focusQuizKeyInput()
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') focusQuizKeyInput()
    }

    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [focusQuizKeyInput, view])

  const handleQuizKeyInput = useCallback(() => {
    const input = quizKeyInputRef.current
    if (!input) return

    const value = input.value
    input.value = ''

    const optionNumber = Number(value.match(/[1-9]/)?.[0] ?? 0)
    const currentQuiz = session.quizzes[session.currentIndex]
    const isAnswered = currentQuiz ? session.results.has(currentQuiz.id) : false

    if (view !== 'quiz' || !currentQuiz || isAnswered) return
    if (!optionNumber || optionNumber > currentQuiz.options.length) return

    selectOptionWithFeedback(optionNumber)
  }, [selectOptionWithFeedback, session, view])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentQuiz = session.quizzes[session.currentIndex]
      const isAnswered = currentQuiz ? session.results.has(currentQuiz.id) : false
      const isLastQuestion = session.currentIndex === session.quizzes.length - 1
      const optionNumber = getPressedOptionNumber(e)

      if (view === 'setup' && e.key === 'Enter' && session.quizzes.length > 0) {
        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return

        e.preventDefault()
        handleStart()
        return
      }

      if (view !== 'quiz' || !currentQuiz) return
      const isQuizKeyInput = e.target === quizKeyInputRef.current
      if (!isQuizKeyInput && isTextEntryTarget(e.target)) return
      if (e.altKey || e.ctrlKey || e.metaKey) return

      if (!isAnswered) {
        if (!optionNumber || optionNumber > currentQuiz.options.length) return
        if (isQuizKeyInput) return

        e.preventDefault()
        selectOptionWithFeedback(optionNumber)
        return
      }

      if (e.key !== 'Enter' && e.key !== ' ') return

      e.preventDefault()
      if (isLastQuestion) handleShowResult()
      else session.nextQuestion()
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [handleShowResult, handleStart, selectOptionWithFeedback, session, view])

  return (
    <div
      ref={appRootRef}
      tabIndex={-1}
      onPointerDownCapture={() => {
        focusQuizKeyInput()
      }}
      className="min-h-screen bg-gray-950 text-white focus:outline-none"
    >
      {view === 'quiz' && (
        <input
          ref={quizKeyInputRef}
          id="quiz-key-catcher"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          aria-hidden="true"
          onInput={handleQuizKeyInput}
          onBlur={() => {
            focusQuizKeyInput()
          }}
          className="fixed left-0 top-0 h-px w-px opacity-0"
        />
      )}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setView('setup')}
            className="text-lg font-bold text-white hover:text-blue-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            aria-label="홈으로 돌아가기"
          >
            Quiz Drill
          </button>
          <div className="flex items-center gap-2">
            {view !== 'history' && (
              <button
                onClick={handleShowHistory}
                className="text-sm text-gray-400 hover:text-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-2 py-1"
                aria-label="학습 이력 보기"
              >
                이력
              </button>
            )}
            {view !== 'setup' && (
              <button
                onClick={() => setView('setup')}
                className="text-sm text-gray-400 hover:text-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-2 py-1"
              >
                새 세션
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="px-6 py-10">
        {view === 'setup' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-white">Quiz Drill AI</h1>
              <p className="text-gray-400">CSV / TSV 파일로 나만의 퀴즈를 만들어 보세요</p>
            </div>

            <CsvInput onLoad={handleLoad} onInvalid={handleInvalidInput} />

            <div className="min-h-[60px] text-center">
              {session.quizzes.length > 0 && (
                <button
                  onClick={handleStart}
                  className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  시작하기 ({session.quizzes.length}문제)
                </button>
              )}
            </div>
          </div>
        )}

        {view === 'quiz' && (
          <QuizScreen
            quizzes={session.quizzes}
            currentIndex={session.currentIndex}
            results={session.results}
            onSelectOption={selectOptionWithFeedback}
            onNext={session.nextQuestion}
            onShowResult={handleShowResult}
          />
        )}

        {view === 'result' && (
          <SessionResult
            total={session.quizzes.length}
            results={session.results}
            durationMs={sessionDurationMs}
            onRestart={handleRestart}
            onRetryWrong={handleRetryWrong}
          />
        )}

        {view === 'history' && (
          <HistoryView records={historyRecords} onRetryWrong={handleRetryHistoryWrong} />
        )}
      </main>

      <footer className="px-6 pb-6 text-center text-xs text-gray-600">
        숫자키 1-4: 답 선택 · Enter/Space: 다음
      </footer>
    </div>
  )
}
