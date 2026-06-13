import { useCallback, useEffect, useState } from 'react'
import type { Quiz, QuizResult } from '../../types/quiz'

interface QuizScreenProps {
  quizzes: Quiz[]
  currentIndex: number
  results: Map<string, QuizResult>
  onSelectOption: (option: number) => void
  onNext: () => void
  onShowResult: () => void
}

function getOptionStyle(
  optionIndex: number, // 1-based
  currentQuiz: Quiz,
  currentResult: QuizResult | undefined
): string {
  const BASE =
    'w-full text-left px-5 py-4 rounded-xl text-base transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 font-medium'

  if (!currentResult) {
    return `${BASE} bg-gray-800 hover:bg-gray-700 text-white cursor-pointer`
  }

  const isCorrectOption = optionIndex === currentQuiz.answer
  const isSelectedOption = optionIndex === currentResult.selectedOption

  if (isCorrectOption) {
    return `${BASE} bg-green-700 text-white cursor-default`
  }
  if (isSelectedOption && !isCorrectOption) {
    return `${BASE} bg-red-700 text-white cursor-default`
  }
  return `${BASE} bg-gray-800 text-gray-500 cursor-default`
}

export function QuizScreen({
  quizzes,
  currentIndex,
  results,
  onSelectOption,
  onNext,
  onShowResult,
}: QuizScreenProps) {
  const currentQuiz = quizzes[currentIndex]
  const totalCount = quizzes.length
  const correctCount = Array.from(results.values()).filter(
    (r) => r.status === 'correct'
  ).length
  const wrongCount = Array.from(results.values()).filter(
    (r) => r.status === 'wrong'
  ).length
  const progressPercent = totalCount > 0 ? (currentIndex / totalCount) * 100 : 0

  const currentResult = currentQuiz ? results.get(currentQuiz.id) : undefined
  const isAnswered = currentResult !== undefined
  const isLastQuestion = currentIndex === totalCount - 1

  const handleOptionClick = useCallback(
    (optionIndex: number) => {
      if (!isAnswered) {
        onSelectOption(optionIndex)
      }
    },
    [isAnswered, onSelectOption]
  )

  // UX-2: 문제별 경과 시간 (답변 후 정지)
  const [elapsedSec, setElapsedSec] = useState(0)
  useEffect(() => {
    setElapsedSec(0)
    if (isAnswered) return
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [currentIndex, isAnswered])

  if (!currentQuiz) return null

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* 헤더 영역 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">
              {currentIndex + 1} / {totalCount}
            </span>
            <span className="bg-blue-900 text-blue-400 text-xs font-medium px-2.5 py-1 rounded-full">
              {currentQuiz.category}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium">
            <span className="text-green-400" aria-label={`정답 ${correctCount}개`}>
              O {correctCount}
            </span>
            <span className="text-gray-600">·</span>
            <span className="text-red-400" aria-label={`오답 ${wrongCount}개`}>
              X {wrongCount}
            </span>
          </div>
        </div>

        {/* 진행 바 */}
        <div
          className="w-full bg-gray-800 rounded-full h-1.5"
          role="progressbar"
          aria-valuenow={currentIndex}
          aria-valuemin={0}
          aria-valuemax={totalCount}
          aria-label="퀴즈 진행률"
        >
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 질문 */}
      <div className="bg-gray-900 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white text-xl font-semibold leading-relaxed flex-1">
            {currentQuiz.question}
          </p>
          <span
            className="ml-4 text-gray-500 text-sm tabular-nums flex-shrink-0"
            aria-label={`경과 시간 ${elapsedSec}초`}
          >
            {elapsedSec}s
          </span>
        </div>
      </div>

      {/* 선택지 */}
      <div
        className="grid gap-3"
        role="group"
        aria-label="선택지"
      >
        {currentQuiz.options.map((option, idx) => {
          const optionIndex = idx + 1 // 1-based
          return (
            <button
              key={optionIndex}
              onClick={() => handleOptionClick(optionIndex)}
              disabled={isAnswered}
              className={getOptionStyle(optionIndex, currentQuiz, currentResult)}
              aria-pressed={currentResult?.selectedOption === optionIndex}
            >
              <span className="text-gray-400 mr-3 font-mono">{optionIndex}.</span>
              {option}
            </button>
          )
        })}
      </div>

      {/* 해설 + 다음 버튼 */}
      {isAnswered && (
        <div className="space-y-4" role="region" aria-label="해설">
          <div
            className={`rounded-xl p-5 border-l-4 ${
              currentResult.status === 'correct'
                ? 'bg-green-950 border-green-500'
                : 'bg-red-950 border-red-500'
            }`}
          >
            <p
              className={`text-sm font-semibold mb-2 ${
                currentResult.status === 'correct' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {currentResult.status === 'correct' ? '정답입니다!' : '오답입니다'}
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              {currentQuiz.explanation}
            </p>
          </div>

          {isLastQuestion ? (
            <button
              onClick={onShowResult}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              결과 보기
            </button>
          ) : (
            <button
              onClick={onNext}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              다음 문제
            </button>
          )}
        </div>
      )}
    </div>
  )
}
