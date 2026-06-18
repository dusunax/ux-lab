import { useState, useEffect, useRef, useCallback, forwardRef, memo } from 'react'
import HTMLFlipBook from 'react-pageflip'
import { Race } from '../../types/race'
import { getRaces, saveRace } from '../db/races'
import { saveImage } from '../db/images'
import RaceForm from '../race/RaceForm'
import DecoLayer from '../deco/DecoLayer'
import { useImageUrl } from '../db/useImageUrl'
import { Navigate } from '../../App'

type AlbumPhotoSlot = 'bib' | 'selfie'

function stopPageFlipEvent(e: React.SyntheticEvent) {
  e.stopPropagation()
}

// AudioContext를 재사용해야 브라우저 자동재생 정책을 통과함
let sharedAudioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext | null {
  try {
    if (!sharedAudioCtx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      sharedAudioCtx = new Ctor()
    }
    return sharedAudioCtx
  } catch {
    return null
  }
}

async function playPageFlipSound() {
  const ctx = getAudioCtx()
  if (!ctx) return
  try {
    if (ctx.state === 'suspended') await ctx.resume()
    const duration = 0.09
    const bufferSize = Math.floor(ctx.sampleRate * duration)
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize
      const envelope = Math.exp(-t * 18) * (1 - Math.exp(-t * 120))
      data[i] = (Math.random() * 2 - 1) * envelope
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 2200
    filter.Q.value = 0.4
    const gain = ctx.createGain()
    gain.gain.value = 0.06
    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    source.start()
  } catch {
    // 무시
  }
}

const BookPage = forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  function BookPage({ children }, ref) {
    return (
      <div ref={ref} className="album-page w-full h-full overflow-hidden relative">
        {children}
      </div>
    )
  }
)

const CoverPage = memo(function CoverPage({ year, raceCount, pageWidth }: { year: number; raceCount: number; pageWidth: number }) {
  const yearSize = Math.max(32, Math.round(pageWidth * 0.22))
  const titleSize = Math.max(14, Math.round(pageWidth * 0.08))
  const smallSize = Math.max(10, Math.round(pageWidth * 0.042))
  const iconSize = Math.max(32, Math.round(pageWidth * 0.12))

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-5 p-10 relative"
      style={{ background: 'linear-gradient(160deg, #e8d8b0 0%, #d4c490 50%, #c8b878 100%)' }}
    >
      <div className="absolute inset-4 border-2 border-gold/40 rounded pointer-events-none" />
      <div className="absolute inset-6 border border-gold/20 rounded pointer-events-none" />
      <div className="w-14 h-0.5 bg-gold/70 rounded-full" />
      <span className="font-handwriting text-ink/80 leading-none" style={{ fontSize: yearSize }}>{year}</span>
      <p className="font-handwriting text-bark tracking-widest" style={{ fontSize: titleSize }}>마라톤 앨범</p>
      <div className="w-14 h-0.5 bg-gold/70 rounded-full" />
      <p className="text-bark-light tracking-wide" style={{ fontSize: smallSize }}>{raceCount}번의 레이스</p>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} className="text-gold/80 mt-1" style={{ width: iconSize, height: iconSize }} aria-hidden="true">
        <circle cx="12" cy="15" r="5" fillOpacity={0.18} fill="currentColor" />
        <circle cx="12" cy="15" r="5" />
        <path d="M8.5 3.5 12 9l3.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
})

const BlankPage = memo(function BlankPage() {
  return (
    <div
      className="w-full h-full"
      style={{ background: '#faf3e0' }}
      aria-hidden="true"
    />
  )
})

function ClosedBook({ year, races, width, height, onClick }: {
  year: number; races: Race[]; width: number; height: number; onClick: () => void
}) {
  const sorted = [...races].sort((a, b) => b.date.localeCompare(a.date))
  const latestBib = sorted[0]?.bibNumber ?? ''
  const latestDate = sorted[0]?.date ?? ''

  return (
    <button
      className="group relative flex text-left transition-all hover:-translate-y-2 focus-visible:ring-2 focus-visible:ring-gold"
      style={{
        width,
        height,
        background: 'linear-gradient(160deg, #e8d8b0 0%, #d4c490 50%, #c8b878 100%)',
        borderRadius: '3px 8px 8px 3px',
        boxShadow: '4px 6px 16px rgba(0,0,0,0.35), inset -2px 0 6px rgba(0,0,0,0.08), 2px 0 0 #8a6a30',
      }}
      onClick={onClick}
      aria-label={`${year}년 앨범 열기`}
    >
      <div
        className="flex-shrink-0 w-6 flex flex-col items-center justify-center rounded-l-sm"
        style={{ background: 'linear-gradient(to right, #7a5a28 0%, #b89040 40%, #9a7030 100%)' }}
        aria-hidden="true"
      >
        <span className="font-handwriting text-cream/70 text-xs select-none"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', letterSpacing: '0.15em' }}>
          {year}
        </span>
      </div>
      <div className="flex-shrink-0 w-1" style={{ background: 'linear-gradient(to right, #d4b870, #e8d8b0)' }} aria-hidden="true" />
      <div className="flex-1 px-6 py-5 flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <span className="font-handwriting text-6xl text-ink/80 leading-none">{year}</span>
          <span className="text-bark-light text-sm">시즌</span>
        </div>
        <div className="flex flex-col gap-1">
          {races.length > 0 ? (
            <>
              <p className="text-bark text-sm"><span className="font-medium text-ink">{races.length}</span>번의 레이스</p>
              {latestBib && <p className="text-bark-light text-xs">최근 배번 #{latestBib}</p>}
              {latestDate && <p className="text-bark-light text-xs">{latestDate}</p>}
            </>
          ) : (
            <p className="text-bark-light text-sm">아직 기록이 없습니다</p>
          )}
        </div>
        {races.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-auto">
            {Array.from({ length: Math.min(races.length, 10) }).map((_, i) => (
              <div key={i} className="w-5 h-5 rounded-full border border-gold/50 bg-gold/15 flex items-center justify-center" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-2.5 h-2.5 text-gold/70">
                  <circle cx="14" cy="4" r="1.5" fill="currentColor" />
                  <path d="M5 19l4-5 2.5 3L14 12l2 3h3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ))}
          </div>
        )}
        <span className="text-xs text-bark font-medium group-hover:text-ink transition-colors">앨범 펼치기 →</span>
      </div>
      <div
        className="absolute right-0 top-0 bottom-0 w-2 rounded-r-lg pointer-events-none"
        style={{ background: 'linear-gradient(to left, rgba(255,255,255,0.12), transparent)' }}
        aria-hidden="true"
      />
    </button>
  )
}

function BackCoverPage({ showForm, onAddRace, onFormClose }: {
  showForm: boolean
  onAddRace: () => void
  onFormClose: () => void
}) {
  if (showForm) {
    return (
      <div
        className="w-full h-full overflow-hidden"
        style={{ background: '#faf3e0' }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <RaceForm onNavigate={() => onFormClose()} landscape />
      </div>
    )
  }

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-6 relative"
      style={{ background: 'linear-gradient(160deg, #c8b878 0%, #d4c490 50%, #e8d8b0 100%)' }}
    >
      <div className="absolute inset-4 border-2 border-gold/40 rounded pointer-events-none" />
      <span className="font-handwriting text-2xl text-bark/70">계속 달리세요</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-14 h-14 text-bark/50" aria-hidden="true">
        <circle cx="14" cy="4" r="1.5" fill="currentColor" />
        <path d="M5 19l4-5 2.5 3L14 12l2 3h3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 14l-2 3" strokeLinecap="round" />
      </svg>
      <button
        className="px-5 py-2 rounded border border-bark/40 text-bark/70 text-sm hover:bg-bark/10 transition-colors"
        onClick={onAddRace}
        type="button"
      >
        + 레이스 추가
      </button>
    </div>
  )
}

function PageStack({ side, count, maxCount }: { side: 'left' | 'right'; count: number; maxCount: number }) {
  const thickness = Math.max(4, (count / Math.max(maxCount, 1)) * 40)
  const lines = Math.min(Math.floor(thickness), 60)
  const clipPath = side === 'left'
    ? 'polygon(0% 4%, 100% 0%, 100% 100%, 0% 96%)'
    : 'polygon(0% 0%, 100% 4%, 100% 96%, 0% 100%)'

  return (
    <div
      className="absolute top-0 bottom-0 pointer-events-none"
      style={{
        [side]: 0,
        width: `${thickness}px`,
        transform: side === 'left' ? 'translateX(-100%)' : 'translateX(100%)',
        zIndex: 0,
        clipPath,
        transition: 'width 0.35s ease-out',
      }}
    >
      {Array.from({ length: lines }).map((_, i) => {
        const offset = (i / lines) * thickness
        const shade = i % 4 === 0 ? '#a89060' : i % 4 === 1 ? '#c8a870' : i % 4 === 2 ? '#e4d4a8' : '#d4bc88'
        return (
          <div
            key={i}
            className="absolute top-0 bottom-0"
            style={{
              [side === 'left' ? 'right' : 'left']: `${offset}px`,
              width: '1px',
              background: shade,
              opacity: 0.75 - i * 0.008,
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



export default function Album({ year, initialPage, initialOpen, navigate }: { year: number; initialPage: number; initialOpen: boolean; navigate: Navigate }) {
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [isOpen, setIsOpen] = useState(initialOpen)
  const [showAddForm, setShowAddForm] = useState(false)
  const [bookSize, setBookSize] = useState({ width: 440, height: 580 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null)
  const lastManualFlipSoundAt = useRef(0)

  useEffect(() => {
    function calcSize() {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const headerH = 52
      const navH = 80
      const paddingH = 16
      const availH = vh - headerH - navH - paddingH
      const pageW = Math.floor(vw * 0.4)
      const pageH = Math.min(Math.round(pageW * 300 / 448), availH)
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

  const needsBlankBeforeAddPage = races.length % 2 === 0
  const bookPages = 1 + races.length + (needsBlankBeforeAddPage ? 1 : 0) + 1
  const lastNavigablePage = Math.max(0, bookPages - 2)
  const totalPages = 1 + Math.ceil((races.length + 1) / 2)
  const currentDisplayPage = currentPage === 0 ? 1 : Math.floor((currentPage - 1) / 2) + 2
  const routePage = Math.min(Math.max(initialPage, 0), lastNavigablePage)
  const readPages = currentDisplayPage - 1
  const remainingPages = Math.max(0, totalPages - currentDisplayPage)

  useEffect(() => {
    if (loading || error) return
    setCurrentPage(routePage)
    setIsOpen(initialOpen)
    if (!initialOpen) return

    let timeoutId: number | undefined
    const frameId = window.requestAnimationFrame(() => {
      bookRef.current?.pageFlip()?.turnToPage(routePage)
      timeoutId = window.setTimeout(() => {
        bookRef.current?.pageFlip()?.turnToPage(routePage)
      })
    })

    return () => {
      window.cancelAnimationFrame(frameId)
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
  }, [error, initialOpen, loading, routePage])

  const handleFlipNext = useCallback(() => {
    lastManualFlipSoundAt.current = performance.now()
    void playPageFlipSound()
    bookRef.current?.pageFlip()?.flipNext()
  }, [])
  const handleFlipPrev = useCallback(() => {
    lastManualFlipSoundAt.current = performance.now()
    void playPageFlipSound()
    bookRef.current?.pageFlip()?.flipPrev()
  }, [])
  const handleFlip = useCallback((e: { data: number }) => {
    if (performance.now() - lastManualFlipSoundAt.current > 500) {
      void playPageFlipSound()
    }
    setCurrentPage(e.data)
    navigate(`/album/${year}/page/${e.data}`, true)
  }, [year, navigate])
  const handleCloseBook = useCallback(() => {
    setShowAddForm(false)
    setCurrentPage(0)
    setIsOpen(false)
    navigate(`/album/${year}`, true)
  }, [year, navigate])
  const handleAlbumPhotoSave = useCallback(async (race: Race, slot: AlbumPhotoSlot, file: File) => {
    const imageId = `${slot}-${Date.now()}`
    await saveImage(imageId, file)
    const updated: Race = {
      ...race,
      photoIds: { ...race.photoIds, [slot]: imageId },
    }
    await saveRace(updated)
    setRaces((prev) => prev.map((item) => (item.id === race.id ? updated : item)))
  }, [])

  const bookPageNodes = [
    <BookPage key="cover"><CoverPage year={year} raceCount={races.length} pageWidth={bookSize.width} /></BookPage>,
    ...races.map((race, i) => (
      <BookPage key={race.id}>
        <RacePagePreview
          race={race}
          showPicker={currentPage === i + 1}
          onPhotoSave={(slot, file) => { void handleAlbumPhotoSave(race, slot, file) }}
        />
      </BookPage>
    )),
    ...(needsBlankBeforeAddPage ? [<BookPage key="blank-before-add"><BlankPage /></BookPage>] : []),
    <BookPage key="add-race"><BackCoverPage showForm={showAddForm} onAddRace={() => setShowAddForm(true)} onFormClose={() => { setShowAddForm(false); void loadRaces() }} /></BookPage>,
  ]

  return (
    <main className="h-screen flex flex-col overflow-hidden" style={{ background: '#1e1610' }}>
      {/* 헤더 (고정 52px) */}
      <header className="flex-shrink-0 h-[52px] px-6 flex items-center gap-4 border-b border-white/10">
        <button
          className="text-cream/60 hover:text-cream text-sm transition-colors"
          onClick={() => { navigate('/') }}
        >
          ← 목록
        </button>
        <h1 className="font-handwriting text-2xl text-cream/80">{year}년 앨범</h1>
      </header>

      {/* 본문 */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
        {loading && (
          <span className="text-cream/40">불러오는 중…</span>
        )}

        {error && (
          <div className="mx-8 rounded bg-red-900/30 border border-red-500/30 px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && !isOpen && (
          <ClosedBook
            year={year}
            races={races}
            width={bookSize.width}
            height={bookSize.height}
            onClick={() => {
              setCurrentPage(0)
              setIsOpen(true)
              navigate(`/album/${year}/page/0`, true)
            }}
          />
        )}

        {!loading && !error && isOpen && (
          <>
            {/* 책 영역 */}
            <div className="relative flex items-center justify-center">
              <div className="relative" style={{ width: bookSize.width * 2, height: bookSize.height }}>
                <PageStack side="left" count={readPages} maxCount={totalPages} />

                <div
                  className="absolute inset-0"
                  style={{
                    boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 15px 40px rgba(0,0,0,0.6)',
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />

                {/* 중앙 바인딩 */}
                <div
                  className="absolute top-0 bottom-0 pointer-events-none"
                  style={{
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '3px',
                    background: 'linear-gradient(to right, #0a0604 0%, #2a1a0e 50%, #0a0604 100%)',
                    zIndex: 3,
                    boxShadow: '0 0 8px rgba(0,0,0,0.9)',
                  }}
                />

                <HTMLFlipBook
                  key={`${bookSize.width}x${bookSize.height}:${year}`}
                  ref={bookRef}
                  width={bookSize.width}
                  height={bookSize.height}
                  size="fixed"
                  minWidth={200}
                  maxWidth={520}
                  minHeight={300}
                  maxHeight={720}
                  maxShadowOpacity={0.5}
                  drawShadow
                  flippingTime={350}
                  usePortrait={false}
                  startPage={routePage}
                  autoSize={false}
                  clickEventForward={false}
                  useMouseEvents
                  swipeDistance={50}
                  showPageCorners
                  disableFlipByClick={showAddForm}
                  onFlip={handleFlip}
                  style={{ position: 'relative', zIndex: 1 }}
                  startZIndex={1}
                  mobileScrollSupport={false}
                  renderOnlyPageLengthChange={false}
                  showCover
                  className=""
                >
                  {bookPageNodes}
                </HTMLFlipBook>

                {currentPage === 0 && (
                  <button
                    type="button"
                    className="absolute top-0 left-0 h-full appearance-none border-0 bg-transparent p-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-gold"
                    style={{ width: bookSize.width, zIndex: 2 }}
                    onClick={handleCloseBook}
                    aria-label="앨범 닫기"
                  />
                )}

                <PageStack side="right" count={remainingPages} maxCount={totalPages} />
              </div>
            </div>

            {/* 네비게이션 (고정 80px, 약간 더 하단) */}
            <nav className="flex-shrink-0 h-[80px] flex items-center gap-8 mt-2">
              <button
                className="w-12 h-12 flex items-center justify-center rounded-full border border-cream/20 text-cream/50 hover:text-cream hover:border-cream/50 transition-all disabled:opacity-20 text-2xl"
                onClick={handleFlipPrev}
                disabled={currentPage === 0}
                aria-label="이전 페이지"
              >
                ‹
              </button>
              <span className="text-cream/30 text-sm tabular-nums">
                {currentDisplayPage} / {totalPages}
              </span>
              <button
                className="w-12 h-12 flex items-center justify-center rounded-full border border-cream/20 text-cream/50 hover:text-cream hover:border-cream/50 transition-all disabled:opacity-20 text-2xl"
                onClick={handleFlipNext}
                disabled={currentDisplayPage >= totalPages}
                aria-label="다음 페이지"
              >
                ›
              </button>
            </nav>
          </>
        )}
      </div>

    </main>
  )
}

const SlotIcon = {
  bib: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-bark/35"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h6M8 16h4" strokeLinecap="round" /></svg>,
}

function RacePagePreview({ race, showPicker, onPhotoSave }: {
  race: Race
  showPicker: boolean
  onPhotoSave: (slot: AlbumPhotoSlot, file: File) => void
}) {
  return (
    <div className="w-full h-full p-4 flex flex-col gap-3 relative" style={{ background: '#faf3e0' }}>
      <div className="relative flex-1 min-h-0">
        <PhotoSlotPreview
          imageId={race.photoIds.bib}
          label="배번"
          icon={SlotIcon.bib}
          onFileSelect={(file) => onPhotoSave('bib', file)}
        />
        <PolaroidSticker
          imageId={race.photoIds.selfie}
          label="셀카"
          onFileSelect={(file) => onPhotoSave('selfie', file)}
        />
      </div>

      <div className="border-t border-bark/15 pt-2 flex-shrink-0 px-1">
        <p className="text-[10px] leading-tight text-bark truncate">
          {race.raceName || '이름 없는 레이스'}
        </p>
        <p className="text-[10px] leading-none tracking-wide text-bark-light truncate">
          {race.date} · {race.distance}km · {race.finishTime || '--:--:--'}
        </p>
      </div>

      <div className="absolute inset-0 overflow-hidden rounded" style={{ pointerEvents: 'none' }}>
        <DecoLayer raceId={race.id} readOnly={!showPicker} showPicker={showPicker} />
      </div>
    </div>
  )
}

function PhotoSlotPreview({ imageId, label, icon, onFileSelect }: {
  imageId?: string
  label: string
  icon: React.ReactNode
  onFileSelect: (file: File) => void
}) {
  const url = useImageUrl(imageId)
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onFileSelect(file)
      e.target.value = ''
    },
    [onFileSelect]
  )

  return (
    <div className="relative h-full overflow-hidden rounded-lg border border-bark/15 bg-cream">
      {url ? (
        /* 사진 느낌: 흰 테두리 + 그림자 */
        <div className="absolute inset-1.5 shadow-md overflow-hidden rounded-sm bg-white">
          <img src={url} alt={label} className="w-full h-full object-cover" />
        </div>
      ) : (
        <label
          className="absolute inset-1.5 rounded-sm bg-bark/5 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-bark/10 transition-colors focus-within:ring-2 focus-within:ring-gold"
          onPointerDown={stopPageFlipEvent}
          onPointerUp={stopPageFlipEvent}
          onMouseDown={stopPageFlipEvent}
          onMouseUp={stopPageFlipEvent}
          onTouchStart={stopPageFlipEvent}
          onTouchEnd={stopPageFlipEvent}
          onClick={stopPageFlipEvent}
          aria-label={`${label} 사진 추가`}
        >
          {icon}
          <p className="text-bark-light text-xs">{label}</p>
          <p className="text-[10px] text-gold">사진 추가</p>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>
      )}
    </div>
  )
}

function PolaroidSticker({ imageId, label, onFileSelect }: {
  imageId?: string
  label: string
  onFileSelect: (file: File) => void
}) {
  const url = useImageUrl(imageId)
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onFileSelect(file)
      e.target.value = ''
    },
    [onFileSelect]
  )

  return (
    <div
      className="absolute right-2 top-3 w-[38%] min-w-[82px] max-w-[132px] rotate-[4deg] rounded-sm bg-white p-1.5 pb-5 shadow-[0_10px_24px_rgba(40,24,12,0.28)]"
      style={{ pointerEvents: url ? 'none' : 'auto' }}
    >
      <div className="aspect-square overflow-hidden rounded-[2px] bg-bark/5">
        {url ? (
          <img src={url} alt={label} className="w-full h-full object-cover" />
        ) : (
          <label
            className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-bark/10 transition-colors focus-within:ring-2 focus-within:ring-gold"
            onPointerDown={stopPageFlipEvent}
            onPointerUp={stopPageFlipEvent}
            onMouseDown={stopPageFlipEvent}
            onMouseUp={stopPageFlipEvent}
            onTouchStart={stopPageFlipEvent}
            onTouchEnd={stopPageFlipEvent}
            onClick={stopPageFlipEvent}
            aria-label={`${label} 사진 추가`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-7 h-7 text-bark/25" aria-hidden="true">
              <path d="M14.5 4H9.5L7 7H4a1 1 0 00-1 1v10a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1h-3L14.5 4z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
            <span className="text-[9px] text-gold">추가</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>
      <span className="absolute bottom-1.5 left-0 right-0 text-center font-handwriting text-[13px] leading-none text-bark/45">
        selfie
      </span>
    </div>
  )
}
