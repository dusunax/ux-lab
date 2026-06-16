import { useState, useEffect, useRef, useCallback, forwardRef, memo } from 'react'
import HTMLFlipBook from 'react-pageflip'
import { Race } from '../../types/race'
import { getRaces } from '../db/races'
import { Route } from '../../App'
import RacePage from '../race/RacePage'

// react-pageflip는 children으로 forwardRef 컴포넌트를 요구합니다
const BookPage = forwardRef<HTMLDivElement, { children: React.ReactNode; pageNumber?: number }>(
  function BookPage({ children, pageNumber }, ref) {
    return (
      <div
        ref={ref}
        className="sticker-book-page w-full h-full overflow-hidden relative"
        aria-label={pageNumber !== undefined ? `페이지 ${pageNumber}` : undefined}
      >
        {children}
      </div>
    )
  }
)

interface CoverPageProps {
  year: number
  raceCount: number
}

const CoverPage = memo(function CoverPage({ year, raceCount }: CoverPageProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-cream-dark p-8">
      <div className="w-12 h-1 bg-gold rounded-full" aria-hidden="true" />
      <span className="font-handwriting text-7xl text-ink">{year}</span>
      <p className="font-handwriting text-2xl text-bark">마라톤 스티커북</p>
      <div className="w-12 h-1 bg-gold rounded-full" aria-hidden="true" />
      <p className="text-bark-light text-sm mt-4">
        {raceCount}번의 레이스
      </p>
      <span className="text-5xl mt-2" aria-hidden="true">🏅</span>
    </div>
  )
})

interface Props {
  year: number
  onNavigate: (route: Route) => void
}

export default function Album({ year, onNavigate }: Props) {
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null)

  const loadRaces = useCallback(async () => {
    try {
      setLoading(true)
      const all = await getRaces()
      const filtered = all
        .filter((r) => r.season === year)
        .sort((a, b) => a.date.localeCompare(b.date))
      setRaces(filtered)
    } catch {
      setError('레이스 데이터를 불러오는 데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    void loadRaces()
  }, [loadRaces])

  useEffect(() => {
    setTotalPages(races.length + 2)
  }, [races.length])

  const handleFlipNext = useCallback(() => {
    bookRef.current?.pageFlip().flipNext()
  }, [])

  const handleFlipPrev = useCallback(() => {
    bookRef.current?.pageFlip().flipPrev()
  }, [])

  const handleFlip = useCallback((e: { data: number }) => {
    setCurrentPage(e.data)
  }, [])

  const handleRaceClick = useCallback((raceId: string) => {
    setSelectedRaceId(raceId)
  }, [])

  const handleCloseRace = useCallback(() => {
    setSelectedRaceId(null)
    void loadRaces()
  }, [loadRaces])

  if (selectedRaceId) {
    return (
      <RacePage
        raceId={selectedRaceId}
        onNavigate={(route) => {
          if (route.path === '/') {
            handleCloseRace()
          } else {
            onNavigate(route)
          }
        }}
      />
    )
  }

  return (
    <main className="min-h-screen bg-cream flex flex-col">
      {/* 헤더 */}
      <header className="px-4 py-4 md:px-8 flex items-center gap-4 border-b border-bark/10">
        <button
          className="btn-ghost text-sm"
          onClick={() => onNavigate({ path: '/' })}
          aria-label="앨범 목록으로 돌아가기"
        >
          ← 목록
        </button>
        <h1 className="font-handwriting text-3xl text-ink">{year}년 앨범</h1>
        <button
          className="ml-auto btn-primary text-sm"
          onClick={() => onNavigate({ path: '/race/new' })}
          aria-label="새 레이스 추가"
        >
          + 레이스 추가
        </button>
      </header>

      {loading && (
        <div className="flex-1 flex items-center justify-center" role="status" aria-live="polite">
          <span className="text-bark-light">불러오는 중…</span>
        </div>
      )}

      {error && (
        <div className="m-8 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && races.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
          <span className="text-5xl" aria-hidden="true">📖</span>
          <p className="font-handwriting text-3xl text-bark">{year}년 레이스가 없습니다</p>
          <button className="btn-primary" onClick={() => onNavigate({ path: '/race/new' })}>
            첫 레이스 기록하기
          </button>
        </div>
      )}

      {!loading && !error && races.length > 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4 md:p-8">
          <div
            className="relative"
            role="region"
            aria-label={`${year}년 스티커북`}
          >
            <HTMLFlipBook
              ref={bookRef}
              width={320}
              height={440}
              size="fixed"
              minWidth={280}
              maxWidth={400}
              minHeight={380}
              maxHeight={500}
              maxShadowOpacity={0.5}
              drawShadow
              flippingTime={700}
              usePortrait
              startPage={0}
              autoSize={false}
              clickEventForward
              useMouseEvents
              swipeDistance={30}
              showPageCorners
              disableFlipByClick={false}
              onFlip={handleFlip}
              className="shadow-page rounded-sm"
              style={{}}
              startZIndex={0}
              mobileScrollSupport
              renderOnlyPageLengthChange={false}
              showCover={false}
            >
              <BookPage pageNumber={1}>
                <CoverPage year={year} raceCount={races.length} />
              </BookPage>

              {races.map((race, index) => (
                <BookPage key={race.id} pageNumber={index + 2}>
                  <button
                    className="w-full h-full text-left cursor-pointer hover:brightness-95 transition-all"
                    onClick={() => handleRaceClick(race.id)}
                    aria-label={`${race.date} 레이스 페이지 열기, 배번 #${race.bibNumber}`}
                  >
                    <RacePagePreview race={race} />
                  </button>
                </BookPage>
              ))}

              <BookPage pageNumber={races.length + 2}>
                <div className="w-full h-full flex flex-col items-center justify-center bg-bark/10 p-8 gap-4">
                  <span className="font-handwriting text-2xl text-bark">계속 달리세요</span>
                  <span className="text-4xl" aria-hidden="true">🏃</span>
                </div>
              </BookPage>
            </HTMLFlipBook>
          </div>

          <nav
            className="flex items-center gap-6"
            aria-label="페이지 네비게이션"
          >
            <button
              className="btn-ghost w-10 h-10 flex items-center justify-center rounded-full text-lg disabled:opacity-30"
              onClick={handleFlipPrev}
              disabled={currentPage === 0}
              aria-label="이전 페이지"
            >
              ←
            </button>
            <span className="text-bark-light text-sm" aria-live="polite" aria-atomic="true">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              className="btn-ghost w-10 h-10 flex items-center justify-center rounded-full text-lg disabled:opacity-30"
              onClick={handleFlipNext}
              disabled={currentPage >= totalPages - 1}
              aria-label="다음 페이지"
            >
              →
            </button>
          </nav>
        </div>
      )}
    </main>
  )
}

function RacePagePreview({ race }: { race: Race }) {
  return (
    <div className="w-full h-full p-4 flex flex-col gap-3">
      <div className="text-center border-b border-bark/20 pb-2">
        <p className="font-handwriting text-2xl text-ink">#{race.bibNumber}</p>
        <p className="text-bark-light text-xs">{race.date}</p>
        {race.raceName && <p className="text-bark text-xs mt-0.5">{race.raceName}</p>}
      </div>

      <div className="grid grid-cols-2 gap-2 flex-1">
        <SlotPreview label="배번" hasContent={!!race.photoIds.bib} emoji="📛" />
        <SlotPreview label="메달" hasContent={!!race.photoIds.medal} emoji="🏅" />
        <div className="flex flex-col items-center justify-center border border-dashed border-bark/30 rounded p-2 bg-cream/50">
          <p className="font-handwriting text-lg text-gold">{race.finishTime}</p>
          <p className="text-bark-light text-xs">{race.distance}km</p>
        </div>
        <SlotPreview label="셀카" hasContent={!!race.photoIds.selfie} emoji="🤳" />
      </div>

      <p className="text-center text-bark-light text-xs">눌러서 꾸미기 →</p>
    </div>
  )
}

function SlotPreview({
  label,
  hasContent,
  emoji,
}: {
  label: string
  hasContent: boolean
  emoji: string
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-bark/30 rounded p-2 bg-cream/50 gap-1">
      <span className="text-2xl" aria-hidden="true">{emoji}</span>
      <p className="text-bark-light text-xs">{label}</p>
      {hasContent && <span className="text-gold text-xs">✓</span>}
    </div>
  )
}
