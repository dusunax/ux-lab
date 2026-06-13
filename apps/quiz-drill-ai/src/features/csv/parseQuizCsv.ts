import { z } from 'zod'
import type { Quiz } from '../../types/quiz'

export interface ParseError {
  row: number
  field: string
  message: string
}

export interface ParseResult {
  quizzes: Quiz[]
  errors: ParseError[]
}

const EXPECTED_HEADERS = [
  'id',
  'category',
  'question',
  'option1',
  'option2',
  'option3',
  'option4',
  'answer',
  'explanation',
]

const rowSchema = z.object({
  id: z.string().min(1, 'id는 비어있을 수 없습니다'),
  category: z.string().min(1, 'category는 비어있을 수 없습니다'),
  question: z.string().min(1, 'question은 비어있을 수 없습니다'),
  option1: z.string().min(1, 'option1은 비어있을 수 없습니다'),
  option2: z.string().min(1, 'option2는 비어있을 수 없습니다'),
  option3: z.string().min(1, 'option3은 비어있을 수 없습니다'),
  option4: z.string().min(1, 'option4는 비어있을 수 없습니다'),
  answer: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(
      z
        .number()
        .int()
        .min(1, 'answer는 1 이상이어야 합니다')
        .max(4, 'answer는 4 이하이어야 합니다')
    ),
  explanation: z.string().min(1, 'explanation은 비어있을 수 없습니다'),
})

/**
 * 따옴표로 묶인 셀을 처리하는 간단한 CSV 행 파서.
 * 라이브러리 없이 직접 구현.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // 이스케이프된 따옴표 ("") → 리터럴 "
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}

export function parseQuizCsv(rawCsv: string): ParseResult {
  const quizzes: Quiz[] = []
  const errors: ParseError[] = []

  const lines = rawCsv.split('\n').map((l) => l.trimEnd())
  const nonEmptyLines = lines.filter((l) => l.trim().length > 0)

  if (nonEmptyLines.length === 0) {
    return { quizzes, errors }
  }

  // 헤더 확인
  const headerLine = nonEmptyLines[0]
  const headers = parseCsvLine(headerLine).map((h) => h.trim().toLowerCase())

  const missingHeaders = EXPECTED_HEADERS.filter((h) => !headers.includes(h))
  if (missingHeaders.length > 0) {
    errors.push({
      row: 1,
      field: 'header',
      message: `누락된 헤더: ${missingHeaders.join(', ')}`,
    })
    return { quizzes, errors }
  }

  const dataLines = nonEmptyLines.slice(1)

  dataLines.forEach((line, idx) => {
    const rowNumber = idx + 2 // 헤더가 1행이므로 데이터는 2행~
    const cells = parseCsvLine(line)

    if (cells.length !== headers.length) {
      errors.push({
        row: rowNumber,
        field: 'row',
        message: `컬럼 수 불일치: 예상 ${headers.length}개, 실제 ${cells.length}개`,
      })
      return
    }

    const rawObj: Record<string, string> = {}
    headers.forEach((header, i) => {
      rawObj[header] = (cells[i] ?? '').trim()
    })

    const parseResult = rowSchema.safeParse(rawObj)

    if (!parseResult.success) {
      parseResult.error.errors.forEach((err) => {
        errors.push({
          row: rowNumber,
          field: err.path[0]?.toString() ?? 'unknown',
          message: err.message,
        })
      })
      return
    }

    const data = parseResult.data
    quizzes.push({
      id: data.id,
      category: data.category,
      question: data.question,
      options: [data.option1, data.option2, data.option3, data.option4],
      answer: data.answer,
      explanation: data.explanation,
    })
  })

  return { quizzes, errors }
}
