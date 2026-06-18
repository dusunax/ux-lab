import { useState, useEffect, useCallback, memo } from 'react'
import { Race } from '../../types/race'
import { getRaces } from '../db/races'
import { Navigate } from '../../App'

interface SeasonSummary {
  year: number
  count: number
  latestBib: string
  latestDate: string
}

function groupBySeason(races: Race[]): SeasonSummary[] {
  const map = new Map<number, Race[]>()
  for (const race of races) {
    const group = map.get(race.season) ?? []
    group.push(race)
    map.set(race.season, group)
  }

  return Array.from(map.entries())
    .map(([year, seasonRaces]) => {
      const sorted = [...seasonRaces].sort((a, b) => b.date.localeCompare(a.date))
      return {
        year,
        count: seasonRaces.length,
        latestBib: sorted[0]?.bibNumber ?? '',
        latestDate: sorted[0]?.date ?? '',
      }
    })
    .sort((a, b) => b.year - a.year)
}

interface AlbumCardProps {
  season: SeasonSummary
  onClick: () => void
}

const AlbumCard = memo(function AlbumCard({ season, onClick }: AlbumCardProps) {
  return (
    <button
      className="group relative flex w-full text-left transition-all hover:-translate-y-2 focus-visible:ring-2 focus-visible:ring-gold"
      style={{
        minHeight: '300px',
        background: 'linear-gradient(160deg, #e8d8b0 0%, #d4c490 50%, #c8b878 100%)',
        borderRadius: '3px 8px 8px 3px',
        boxShadow: '4px 6px 16px rgba(0,0,0,0.35), inset -2px 0 6px rgba(0,0,0,0.08), 2px 0 0 #8a6a30',
      }}
      onClick={onClick}
      aria-label={`${season.year}년 앨범 열기, ${season.count}개 레이스`}
    >
      {/* 책 등(spine) */}
      <div
        className="flex-shrink-0 w-6 flex flex-col items-center justify-center rounded-l-sm"
        style={{
          background: 'linear-gradient(to right, #7a5a28 0%, #b89040 40%, #9a7030 100%)',
        }}
        aria-hidden="true"
      >
        <span
          className="font-handwriting text-cream/70 text-xs select-none"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', letterSpacing: '0.15em' }}
        >
          {season.year}
        </span>
      </div>

      {/* 등 경계 하이라이트 */}
      <div
        className="flex-shrink-0 w-1"
        style={{ background: 'linear-gradient(to right, #d4b870, #e8d8b0)' }}
        aria-hidden="true"
      />

      {/* 내용 */}
      <div className="flex-1 px-6 py-5 flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <span className="font-handwriting text-6xl text-ink/80 leading-none">{season.year}</span>
          <span className="text-bark-light text-sm">시즌</span>
        </div>

        <div className="flex flex-col gap-1">
          {season.count > 0 ? (
            <>
              <p className="text-bark text-sm">
                <span className="font-medium text-ink">{season.count}</span>번의 레이스
              </p>
              {season.latestBib && (
                <p className="text-bark-light text-xs">최근 배번 #{season.latestBib}</p>
              )}
              {season.latestDate && (
                <p className="text-bark-light text-xs">{season.latestDate}</p>
              )}
            </>
          ) : (
            <p className="text-bark-light text-sm">아직 기록이 없습니다</p>
          )}
        </div>

        {/* 레이스 도장 */}
        {season.count > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-auto">
            {Array.from({ length: Math.min(season.count, 10) }).map((_, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full border border-gold/50 bg-gold/15 flex items-center justify-center"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-2.5 h-2.5 text-gold/70">
                  <circle cx="14" cy="4" r="1.5" fill="currentColor" />
                  <path d="M5 19l4-5 2.5 3L14 12l2 3h3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ))}
          </div>
        )}

        <span className="text-xs text-bark font-medium group-hover:text-ink transition-colors">
          앨범 열기 →
        </span>
      </div>

      {/* 우측 하이라이트 */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 rounded-r-lg pointer-events-none"
        style={{ background: 'linear-gradient(to left, rgba(255,255,255,0.12), transparent)' }}
        aria-hidden="true"
      />
    </button>
  )
})

export default function AlbumList({ navigate }: { navigate: Navigate }) {
  const [seasons, setSeasons] = useState<SeasonSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSeasons = useCallback(async () => {
    try {
      setLoading(true)
      const races = await getRaces()
      const grouped = groupBySeason(races)
      // 올해 시즌이 없으면 빈 카드로 미리 추가
      const currentYear = new Date().getFullYear()
      if (!grouped.some((s) => s.year === currentYear)) {
        grouped.unshift({ year: currentYear, count: 0, latestBib: '', latestDate: '' })
      }
      setSeasons(grouped)
    } catch {
      setError('레이스 데이터를 불러오는 데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSeasons()
  }, [loadSeasons])

  const handleAlbumOpen = useCallback(
    (year: number) => { navigate(`/album/${year}`) },
    [navigate]
  )

  return (
    <main className="min-h-screen bg-cream px-4 py-8 md:px-8">
      <header className="max-w-2xl mx-auto mb-10 text-center">
        <h1 className="font-handwriting text-5xl text-ink">마라톤 앨범</h1>
      </header>

      <div className="max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <h2 className="text-bark font-medium text-lg">시즌 앨범</h2>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20" role="status" aria-live="polite">
            <span className="text-bark-light text-sm">불러오는 중…</span>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && seasons.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} className="w-16 h-16 text-bark/30" aria-hidden="true">
              <circle cx="14" cy="4" r="1.5" fill="currentColor" />
              <path d="M5 19l4-5 2.5 3L14 12l2 3h3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 14l-2 3" strokeLinecap="round" />
            </svg>
            <p className="font-handwriting text-3xl text-bark">첫 레이스를 기록해보세요</p>
            <p className="text-bark-light text-sm max-w-xs">
              배번호를 입력하면 앨범 페이지가 생성됩니다. 레이스 1회 = 앨범 페이지 1장.
            </p>
          </div>
        )}

        {!loading && !error && seasons.length > 0 && (
          <ul
            className="flex flex-col gap-5 max-w-lg mx-auto"
            aria-label="시즌 앨범 목록"
          >
            {seasons.map((season) => (
              <li key={season.year}>
                <AlbumCard
                  season={season}
                  onClick={() => handleAlbumOpen(season.year)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
