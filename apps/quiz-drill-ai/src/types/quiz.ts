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

export interface SessionQuizResult {
  quizId: string
  status: 'correct' | 'wrong'
  selected: number  // 1-based option index
}

export interface SessionRecord {
  id: string
  date: string        // ISO string
  source: string      // 파일명 또는 '텍스트 입력'
  total: number
  correct: number
  durationMs: number
  wrongQuizzes?: Quiz[]
  quizResults?: SessionQuizResult[]  // 문제별 정답 여부·선택지
}
