import { useState, useCallback } from 'react'
import type { Quiz, QuizResult } from '../../types/quiz'

/** Fisher-Yates shuffle — 새 배열 반환 (immutable) */
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i]
    result[i] = result[j] as T
    result[j] = temp as T
  }
  return result
}

interface QuizSessionState {
  quizzes: Quiz[]
  currentIndex: number
  results: Map<string, QuizResult>
  isSessionComplete: boolean
}

interface QuizSessionActions {
  loadQuizzes: (quizzes: Quiz[]) => void
  selectOption: (option: number) => void
  nextQuestion: () => void
  restartSession: () => void
  retryWrong: () => void
}

export function useQuizSession(): QuizSessionState & QuizSessionActions {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<Map<string, QuizResult>>(new Map())
  const [isSessionComplete, setIsSessionComplete] = useState(false)

  const loadQuizzes = useCallback((incoming: Quiz[]) => {
    setQuizzes(shuffleArray(incoming))
    setCurrentIndex(0)
    setResults(new Map())
    setIsSessionComplete(false)
  }, [])

  const selectOption = useCallback(
    (option: number) => {
      const current = quizzes[currentIndex]
      if (!current) return

      // 이미 답변한 경우 무시
      if (results.has(current.id)) return

      const isCorrect = option === current.answer
      setResults((prev) => {
        const next = new Map(prev)
        next.set(current.id, {
          quizId: current.id,
          status: isCorrect ? 'correct' : 'wrong',
          selectedOption: option,
        })
        return next
      })
    },
    [quizzes, currentIndex, results]
  )

  const nextQuestion = useCallback(() => {
    const nextIndex = currentIndex + 1
    if (nextIndex >= quizzes.length) {
      setIsSessionComplete(true)
    } else {
      setCurrentIndex(nextIndex)
    }
  }, [currentIndex, quizzes.length])

  const restartSession = useCallback(() => {
    setQuizzes((prev) => shuffleArray(prev))
    setCurrentIndex(0)
    setResults(new Map())
    setIsSessionComplete(false)
  }, [])

  const retryWrong = useCallback(() => {
    const wrongQuizzes = quizzes.filter((q) => {
      const result = results.get(q.id)
      return result?.status === 'wrong'
    })

    if (wrongQuizzes.length === 0) return

    setQuizzes(shuffleArray(wrongQuizzes))
    setCurrentIndex(0)
    setResults(new Map())
    setIsSessionComplete(false)
  }, [quizzes, results])

  return {
    quizzes,
    currentIndex,
    results,
    isSessionComplete,
    loadQuizzes,
    selectOption,
    nextQuestion,
    restartSession,
    retryWrong,
  }
}
