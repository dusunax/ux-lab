import { useState, useEffect, useRef, useCallback, forwardRef, memo } from 'react'
import HTMLFlipBook from 'react-pageflip'
import { Race } from '../../types/race'
import { getRaces } from '../db/races'
import { Route } from '../../App'
import RacePage from '../race/RacePage'
import { useImageUrl } from '../db/useImageUrl'

const BookPage = forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  function BookPage({ children }, ref) {
    return (
      <div ref={ref} className="sticker-book-page w-full h-full overflow-hidden relative">
        {children}
      </div>
    )
  }
)

const CoverPage = memo(function CoverPage({ year, raceCount }: { year: number; raceCount: number }) {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-5 p-10 relative"
      style={{ background: 'linear-gradient(160deg, #e8d8b0 0%, #d4c490 50%, #c8b878 100%)' }}
    >
      <div className="absolute inset-4 border-2 border-gold/40 rounded pointer-events-none" />
      <div className="absolute inset-6 border border-gold/20 rounded pointer-events-none" />
      <div className="w-14 h-0.5 bg-gold/70 rounded-full" />
      <span className="font-handwriting text-8xl text-ink/80 leading-none">{year}</span>
      <p className="font-handwriting text-3xl text-bark tracking-widest">마라톤 스티커북</p>
      <div className="w-14 h-0.5 bg-gold/70 rounded-full" />
      <p className="text-bark-light text-sm mt-2 tracking-wide">{raceCount}번의 레이스</p>
      <span className="text-6xl mt-1">🏅</span>
    </div>
  )
})

function BackCoverPage() {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-4 relative"
      style={{ background: 'linear-gradient(160deg, #c8b878 0%, #d4c490 50%, #e8d8b0 100%)' }}
    >
      <div className="absolute inset-4 border-2 border-gold/40 rounded pointer-events-none" />
      <span className="font-handwriting text-2xl text-bark/70">계속 달리세요</span>
      <span className="text-5xl">🏃</span>
    </div>
  )
}

function PageStack({ side, count, maxCount }: { side: 'left' | 'right'; count: number; maxCount: number }) {
  const thickness = Math.max(4, Math.round((count / Math.max(maxCount, 1)) * 40))
  const lines = Math.min(count, 20)

  return (
    <div
      className="absolute top-[1%] bottom-[1%] pointer-events-none"
      style={{
        [side]: 0,
        width: `${thickness}px`,
        transform: side === 'left' ? 'translateX(-100%)' : 'translateX(100%)',
        zIndex: 10,
      }}
    >
      {Array.from({ length: lines }).map((_, i) => {
        const offset = (i / lines) * thickness
        const shade = i % 3 === 0 ? '#c8b878' : i % 3 === 1 ? '#e4d4a8' : '#f0e6cc'
        return (
          <div
            key={i}
            className="absolute top-0 bottom-0"
            style={{
              [side === 'left' ? 'right' : 'left']: `${offset}px`,
              width: '1.5px',
              background: shade,
              opacity: 0.9 - i * 0.02,
            }}
          />
        )
      })}
      <div
        className="absolute top-0 bottom-0"
        style={{
          [side === 'left' ? 'left' : 'right']: 0,
          width: '2px',
          background: side === 'left'
            ? 'linear-gradient(to right, #a89060, #d4c490)'
            : 'linear-gradient(to left, #a89060, #d4c490)',
        }}
      />
    </div>
  )
}

// 레이스 상세 모달
function RaceModal({ raceId, onClose, onNavigate }: {
  raceId: string
  onClose: () => void
  onNavigate: (route: Route) => void
}) {
  // 모달 열릴 때 body 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(20, 14, 8, 0.85)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl"
        style={{ background: '#faf3e0' }}
      >
        <button
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-bark/10 hover:bg-bark/20 text-bark transition-colors"
          onClick={onClose}
          aria-label="닫기"
        >
          ✕
        </button>
        <RacePage
          raceId={raceId}
          onNavigate={(route) => {
            if (route.path === '/') {
              onClose()
            } else {
              onNavigate(route)
            }
          }}
        />
      </div>
    </div>
  )
}

interface Props {
  year: number
  onNavigate: (route: Route) => void
}

export default function Album({ year, onNavigate }: Props) {
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null)
  const [bookSize, setBookSize] = useState({ width: 420, height: 560 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null)

  // 뷰포트 기반 반응형 책 크기
  useEffect(() => {
    function calcSize() {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const headerH = 52
      const navH = 72
      const paddingH = 32
      const availH = vh - headerH - navH - paddingH
      const pageW = Math.min(Math.floor(vw * 0.44), 500)
      const pageH = Math.min(availH, 680)
      setBookSize({ width: pageW, height: pageH })
    }
    calcSize()
    window.addEventListener('resize', calcSize)
    return () => window.removeEventListener('resize', calcSize)
  }, [])

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

  useEffect(() => { void loadRaces() }, [loadRaces])

  const totalPages = races.length + 2
  const readPages = currentPage
  const remainingPages = Math.max(0, totalPages - currentPage - 2)

  const handleFlipNext = useCallback(() => bookRef.current?.pageFlip().flipNext(), [])
  const handleFlipPrev = useCallback(() => bookRef.current?.pageFlip().flipPrev(), [])
  const handleFlip = useCallback((e: { data: number }) => setCurrentPage(e.data), [])

  return (
    // h-screen + overflow-hidden → 페이지 전환 시 스크롤 없음
    <main className="h-screen flex flex-col overflow-hidden" style={{ background: '#1e1610' }}>
      {/* 헤더 (고정 높이 52px) */}
      <header className="flex-shrink-0 h-[52px] px-6 flex items-center gap-4 border-b border-white/10">
        <button
          className="text-cream/60 hover:text-cream text-sm transition-colors"
          onClick={() => onNavigate({ path: '/' })}
        >
          ← 목록
        </button>
        <h1 className="font-handwriting text-2xl text-cream/80">{year}년 앨범</h1>
        <button
          className="ml-auto text-sm px-4 py-1.5 rounded border border-gold/50 text-gold hover:bg-gold/10 transition-colors"
          onClick={() => onNavigate({ path: '/race/new' })}
        >
          + 레이스 추가
        </button>
      </header>

      {/* 본문 (나머지 높이 = flex-1, overflow-hidden) */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
        {loading && (
          <span className="text-cream/40">불러오는 중…</span>
        )}

        {error && (
          <div className="mx-8 rounded bg-red-900/30 border border-red-500/30 px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && races.length === 0 && (
          <div className="flex flex-col items-center gap-4 text-center p-8">
            <span className="text-5xl">📖</span>
            <p className="font-handwriting text-3xl text-cream/60">{year}년 레이스가 없습니다</p>
            <button
              className="px-6 py-2 rounded bg-gold text-ink font-medium hover:bg-gold-light transition-colors"
              onClick={() => onNavigate({ path: '/race/new' })}
            >
              첫 레이스 기록하기
            </button>
          </div>
        )}

        {!loading && !error && races.length > 0 && (
          <>
            {/* 책 영역 */}
            <div className="relative flex items-center justify-center">
              <div className="relative" style={{ width: bookSize.width * 2, height: bookSize.height }}>
                {/* 왼쪽 두께 */}
                <PageStack side="left" count={readPages} maxCount={totalPages} />

                {/* 책 그림자 */}
                <div
                  className="absolute inset-0"
                  style={{
                    boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 15px 40px rgba(0,0,0,0.6)',
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />

                {/* 책 중앙 바인딩 */}
                <div
                  className="absolute top-0 bottom-0 pointer-events-none"
                  style={{
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '6px',
                    background: 'linear-gradient(to right, #0e0a06 0%, #3a2a1a 35%, #4a3520 50%, #3a2a1a 65%, #0e0a06 100%)',
                    zIndex: 20,
                    boxShadow: '0 0 12px rgba(0,0,0,0.8)',
                  }}
                />

                <HTMLFlipBook
                  ref={bookRef}
                  width={bookSize.width}
                  height={bookSize.height}
                  size="fixed"
                  minWidth={200}
                  maxWidth={500}
                  minHeight={300}
                  maxHeight={680}
                  maxShadowOpacity={0.5}
                  drawShadow
                  flippingTime={800}
                  usePortrait={false}
                  startPage={0}
                  autoSize={false}
                  clickEventForward={false}
                  useMouseEvents
                  swipeDistance={50}
                  showPageCorners
                  disableFlipByClick={false}
                  onFlip={handleFlip}
                  style={{ position: 'relative', zIndex: 1 }}
                  startZIndex={1}
                  mobileScrollSupport={false}
                  renderOnlyPageLengthChange={false}
                  showCover
                  className=""
                >
                  <BookPage>
                    <CoverPage year={year} raceCount={races.length} />
                  </BookPage>

                  {races.map((race) => (
                    <BookPage key={race.id}>
                      <button
                        className="w-full h-full text-left cursor-pointer hover:brightness-95 transition-all"
                        onClick={() => setSelectedRaceId(race.id)}
                        aria-label={`${race.date} 레이스 #${race.bibNumber} 상세보기`}
                      >
                        <RacePagePreview race={race} />
                      </button>
                    </BookPage>
                  ))}

                  <BookPage>
                    <BackCoverPage />
                  </BookPage>
                </HTMLFlipBook>

                {/* 오른쪽 두께 */}
                <PageStack side="right" count={remainingPages} maxCount={totalPages} />
              </div>
            </div>

            {/* 네비게이션 (고정 높이 72px) */}
            <nav className="flex-shrink-0 h-[72px] flex items-center gap-8">
              <button
                className="w-12 h-12 flex items-center justify-center rounded-full border border-cream/20 text-cream/50 hover:text-cream hover:border-cream/50 transition-all disabled:opacity-20 text-2xl"
                onClick={handleFlipPrev}
                disabled={currentPage === 0}
                aria-label="이전 페이지"
              >
                ‹
              </button>
              <span className="text-cream/30 text-sm tabular-nums">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                className="w-12 h-12 flex items-center justify-center rounded-full border border-cream/20 text-cream/50 hover:text-cream hover:border-cream/50 transition-all disabled:opacity-20 text-2xl"
                onClick={handleFlipNext}
                disabled={currentPage >= totalPages - 1}
                aria-label="다음 페이지"
              >
                ›
              </button>
            </nav>
          </>
        )}
      </div>

      {/* 레이스 상세 모달 */}
      {selectedRaceId && (
        <RaceModal
          raceId={selectedRaceId}
          onClose={() => {
            setSelectedRaceId(null)
            void loadRaces()
          }}
          onNavigate={onNavigate}
        />
      )}
    </main>
  )
}

function RacePagePreview({ race }: { race: Race }) {
  return (
    <div className="w-full h-full p-4 flex flex-col gap-3" style={{ background: '#faf3e0' }}>
      <div className="text-center border-b border-bark/20 pb-2 flex-shrink-0">
        <p className="font-handwriting text-4xl text-ink leading-tight">#{race.bibNumber}</p>
        <p className="text-bark-light text-xs mt-0.5">{race.date}</p>
        {race.raceName && <p className="text-bark text-xs mt-0.5 truncate">{race.raceName}</p>}
      </div>

      <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
        <PhotoSlotPreview imageId={race.photoIds.bib} label="배번" emoji="📛" />
        <PhotoSlotPreview imageId={race.photoIds.medal} label="메달" emoji="🏅" />
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gold/40 rounded-lg p-2 bg-cream">
          <p className="font-handwriting text-xl text-gold leading-none">{race.finishTime || '--:--:--'}</p>
          <p className="text-bark-light text-xs mt-1">{race.distance}km</p>
        </div>
        <PhotoSlotPreview imageId={race.photoIds.selfie} label="셀카" emoji="🤳" />
      </div>
    </div>
  )
}

function PhotoSlotPreview({ imageId, label, emoji }: { imageId?: string; label: string; emoji: string }) {
  const url = useImageUrl(imageId)
  return (
    <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-bark/25 bg-cream">
      {url ? (
        <img
          src={url}
          alt={label}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-2xl">{emoji}</span>
          <p className="text-bark-light text-xs">{label}</p>
        </div>
      )}
    </div>
  )
}
