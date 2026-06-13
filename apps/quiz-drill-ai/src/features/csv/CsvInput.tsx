import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react'
import type { Quiz } from '../../types/quiz'
import { parseQuizCsv, type ParseError } from './parseQuizCsv'

type Tab = 'file' | 'text'

interface CsvInputProps {
  onLoad: (quizzes: Quiz[]) => void
}

export function CsvInput({ onLoad }: CsvInputProps) {
  const [activeTab, setActiveTab] = useState<Tab>('file')
  const [isDragging, setIsDragging] = useState(false)
  const [textContent, setTextContent] = useState('')
  const [errors, setErrors] = useState<ParseError[]>([])
  const [loadedCount, setLoadedCount] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleParse = useCallback(
    (csv: string) => {
      const { quizzes, errors: parseErrors } = parseQuizCsv(csv)
      setErrors(parseErrors)

      if (quizzes.length > 0) {
        setLoadedCount(quizzes.length)
        onLoad(quizzes)
      } else {
        setLoadedCount(null)
      }
    },
    [onLoad]
  )

  const readFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.csv')) {
        setErrors([{ row: 0, field: 'file', message: '.csv 파일만 지원합니다' }])
        setLoadedCount(null)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result
        if (typeof content === 'string') {
          handleParse(content)
        }
      }
      reader.readAsText(file, 'utf-8')
    },
    [handleParse]
  )

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) readFile(file)
    },
    [readFile]
  )

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) readFile(file)
    },
    [readFile]
  )

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleTextSubmit = useCallback(() => {
    if (textContent.trim()) {
      handleParse(textContent)
    }
  }, [textContent, handleParse])

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab)
    setErrors([])
    setLoadedCount(null)
  }, [])

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* 탭 */}
      <div className="flex border-b border-gray-700 mb-6" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'file'}
          onClick={() => handleTabChange('file')}
          className={`px-6 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            activeTab === 'file'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          파일 업로드
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'text'}
          onClick={() => handleTabChange('text')}
          className={`px-6 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            activeTab === 'text'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          텍스트 붙여넣기
        </button>
      </div>

      {/* 파일 업로드 탭 */}
      {activeTab === 'file' && (
        <div
          role="region"
          aria-label="파일 업로드 영역"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-950'
              : 'border-gray-600 hover:border-gray-500 bg-gray-900'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="sr-only"
            aria-label="CSV 파일 선택"
          />
          <div className="text-4xl mb-4" aria-hidden="true">
            {isDragging ? '📂' : '📄'}
          </div>
          <p className="text-gray-300 text-lg mb-2">
            CSV 파일을 드래그하거나 클릭하여 선택
          </p>
          <p className="text-gray-500 text-sm">.csv 파일만 지원합니다</p>
        </div>
      )}

      {/* 텍스트 붙여넣기 탭 */}
      {activeTab === 'text' && (
        <div className="space-y-4">
          <label htmlFor="csv-textarea" className="block text-sm text-gray-400">
            CSV 내용을 붙여넣기하세요
          </label>
          <textarea
            id="csv-textarea"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder={`id,category,question,option1,option2,option3,option4,answer,explanation\nq1,Activity,질문 내용,선택지1,선택지2,선택지3,선택지4,3,해설 내용`}
            className="w-full h-48 bg-gray-900 border border-gray-700 rounded-lg p-4 text-gray-200 text-sm font-mono resize-none focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleTextSubmit}
            disabled={!textContent.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            파싱하기
          </button>
        </div>
      )}

      {/* 성공 메시지 */}
      {loadedCount !== null && errors.length === 0 && (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 flex items-center gap-3 bg-green-950 border border-green-700 rounded-lg p-4"
        >
          <span className="text-green-400 text-lg" aria-hidden="true">✓</span>
          <p className="text-green-400 font-medium">{loadedCount}개 문제 로드됨</p>
        </div>
      )}

      {/* 오류 목록 */}
      {errors.length > 0 && (
        <div
          role="alert"
          aria-label="파싱 오류 목록"
          className="mt-6 bg-red-950 border border-red-700 rounded-lg p-4"
        >
          <p className="text-red-400 font-medium mb-3">{errors.length}개 오류 발생</p>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {errors.map((err, i) => (
              <li key={i} className="text-sm text-red-300">
                {err.row > 0 ? (
                  <span>
                    <span className="text-red-400 font-mono">{err.row}행</span>
                    {err.field !== 'row' && (
                      <span className="text-red-500"> · {err.field}</span>
                    )}
                    <span className="text-gray-400"> — </span>
                  </span>
                ) : null}
                {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
