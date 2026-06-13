import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react'
import type { Quiz } from '../../types/quiz'
import { parseQuizCsv, type ParseError } from './parseQuizCsv'

type Tab = 'file' | 'text'

const SAMPLE_FILES = [
  {
    label: '모바일앱 프로그래밍 149문제',
    path: '/samples/mobile-programming-149.csv',
    source: '샘플: mobile-programming-149.csv',
  },
  {
    label: '데이터 정보처리 100문제',
    path: '/samples/data-processing-100.csv',
    source: '샘플: data-processing-100.csv',
  },
  {
    label: '데이터 정보처리 77문제',
    path: '/samples/data-info-processing-77.csv',
    source: '샘플: 데이터 정보처리 77문제',
  },
  {
    label: '데이터 정보처리 핵심 25문제',
    path: '/samples/data-info-processing-core-25.csv',
    source: '샘플: 데이터 정보처리 핵심 25문제',
  },
]

interface CsvInputProps {
  onLoad: (quizzes: Quiz[], source: string) => void
  onInvalid: () => void
}

export function CsvInput({ onLoad, onInvalid }: CsvInputProps) {
  const [activeTab, setActiveTab] = useState<Tab>('file')
  const [isDragging, setIsDragging] = useState(false)
  const [isSampleLoading, setIsSampleLoading] = useState(false)
  const [selectedSamplePath, setSelectedSamplePath] = useState<string | null>(null)
  const [textContent, setTextContent] = useState('')
  const [errors, setErrors] = useState<ParseError[]>([])
  const [loadedCount, setLoadedCount] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleParse = useCallback(
    (csv: string, source: string, samplePath: string | null = null) => {
      const { quizzes, errors: parseErrors } = parseQuizCsv(csv)
      setErrors(parseErrors)

      if (quizzes.length > 0 && parseErrors.length === 0) {
        setLoadedCount(quizzes.length)
        setSelectedSamplePath(samplePath)
        onLoad(quizzes, source)
      } else {
        setLoadedCount(null)
        setSelectedSamplePath(null)
        onInvalid()
      }
    },
    [onInvalid, onLoad]
  )

  const readFile = useCallback(
    (file: File) => {
      const isValidExt = file.name.endsWith('.csv') || file.name.endsWith('.tsv')
      if (!isValidExt) {
        setErrors([{ row: 0, field: 'file', message: '.csv 또는 .tsv 파일만 지원합니다' }])
        setLoadedCount(null)
        setSelectedSamplePath(null)
        onInvalid()
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result
        if (typeof content === 'string') {
          handleParse(content, file.name)
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
      handleParse(textContent, '텍스트 입력')
    }
  }, [textContent, handleParse])

  const handleSampleLoad = useCallback(async (sample: (typeof SAMPLE_FILES)[number]) => {
    setIsSampleLoading(true)
    setErrors([])
    setLoadedCount(null)

    try {
      const response = await fetch(sample.path)
      if (!response.ok) {
        throw new Error('sample not found')
      }
      handleParse(await response.text(), sample.source, sample.path)
    } catch {
      setErrors([{ row: 0, field: 'sample', message: '샘플 데이터를 불러오지 못했습니다' }])
      setSelectedSamplePath(null)
      onInvalid()
    } finally {
      setIsSampleLoading(false)
    }
  }, [handleParse, onInvalid])

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
            accept=".csv,.tsv"
            onChange={handleFileChange}
            className="sr-only"
            aria-label="CSV/TSV 파일 선택"
          />
          <div className="text-4xl mb-4" aria-hidden="true">
            {isDragging ? '📂' : '📄'}
          </div>
          <p className="text-gray-300 text-lg mb-2">
            파일을 드래그하거나 클릭하여 선택
          </p>
          <p className="text-gray-500 text-sm">.csv / .tsv 지원 · 탭 구분자 자동 감지</p>
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

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {SAMPLE_FILES.map((sample) => (
          <button
            key={sample.path}
            type="button"
            onClick={() => handleSampleLoad(sample)}
            disabled={isSampleLoading}
            aria-pressed={selectedSamplePath === sample.path}
            className={`w-full py-3 font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:bg-gray-900 disabled:text-gray-600 ${
              selectedSamplePath === sample.path
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 hover:bg-gray-700 text-white'
            }`}
          >
            {isSampleLoading ? '...' : sample.label}
          </button>
        ))}
      </div>

      <div className="mt-6 min-h-[58px]">
        {/* 성공 메시지 */}
        {loadedCount !== null && errors.length === 0 && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-3 bg-green-950 border border-green-700 rounded-lg p-4"
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
            className="bg-red-950 border border-red-700 rounded-lg p-4"
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
                  {err.value ? (
                    <p className="mt-1 rounded bg-red-900/50 px-2 py-1 font-mono text-xs text-red-100 break-all">
                      {err.value}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
