export interface Quiz {
  id: string
  category: string
  question: string
  options: [string, string, string, string]
  answer: number // 1-based (1~4)
  explanation: string
}

export type QuizStatus = 'untouched' | 'correct' | 'wrong'

export interface QuizResult {
  quizId: string
  status: QuizStatus
  selectedOption: number | null
}

export interface SessionSummary {
  total: number
  correct: number
  wrong: number
}
