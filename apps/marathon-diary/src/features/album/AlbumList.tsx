import { useState, useEffect, useCallback, memo } from 'react'
import { Race } from '../../types/race'
import { getRaces } from '../db/races'
import { Route } from '../../App'

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
      className="group relative flex flex-col gap-3 rounded-xl bg-cream-dark border border-bark/20 p-6 text-left transition-all hover:shadow-page hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-gold"
      onClick={onClick}
      aria-label={`${season.year}년 앨범 열기, ${season.count}개 레이스`}
    >
      {/* 책 등처럼 왼쪽 가장자리 강조 */}
      <div
        className="absolute left-0 top-3 bottom-3 w-1.5 rounded-full bg-gold/60 group-hover:bg-gold transition-colors"
        aria-hidden="true"
      />

      <div className="pl-3">
        <span className="font-handwriting text-5xl text-ink leading-none">{season.year}</span>
        <span className="ml-2 text-sm text-bark-light font-sans">시즌</span>
      </div>

      <div className="pl-3 flex flex-col gap-1">
        <p className="text-bark text-sm">
          <span className="font-medium text-ink">{season.count}</span>번의 레이스
        </p>
        {season.latestBib && (
          <p className="text-bark-light text-xs">최근 배번 #{season.latestBib}</p>
        )}
        {season.latestDate && (
          <p className="text-bark-light text-xs">{season.latestDate}</p>
        )}
      </div>

      <div className="pl-3 mt-auto">
        <span className="text-xs text-gold font-medium">앨범 열기 →</span>
      </div>
    </button>
  )
})

interface Props {
  onNavigate: (route: Route) => void
}

export default function AlbumList({ onNavigate }: Props) {
  const [seasons, setSeasons] = useState<SeasonSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSeasons = useCallback(async () => {
    try {
      setLoading(true)
      const races = await getRaces()
      setSeasons(groupBySeason(races))
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
    (year: number) => {
      onNavigate({ path: '/album/:year', year })
    },
    [onNavigate]
  )

  const handleAddRace = useCallback(() => {
    onNavigate({ path: '/race/new' })
  }, [onNavigate])

  return (
    <main className="min-h-screen bg-cream px-4 py-8 md:px-8">
      <header className="max-w-3xl mx-auto mb-10">
        <h1 className="font-handwriting text-5xl text-ink mb-1">Marathon Diary</h1>
        <p className="text-bark-light text-sm">달린 날만큼, 페이지가 쌓인다.</p>
      </header>

      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-bark font-medium text-lg">시즌 앨범</h2>
          <button
            className="btn-primary flex items-center gap-2 text-sm"
            onClick={handleAddRace}
            aria-label="새 레이스 기록 추가"
          >
            <span aria-hidden="true">+</span>새 레이스
          </button>
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
              <circle cx="14" cy="4" r="1.5" fill="currentColor"/>
              <path d="M5 19l4-5 2.5 3L14 12l2 3h3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 14l-2 3" strokeLinecap="round"/>
            </svg>
            <p className="font-handwriting text-3xl text-bark">첫 레이스를 기록해보세요</p>
            <p className="text-bark-light text-sm max-w-xs">
              배번호를 입력하면 스티커 페이지가 생성됩니다. 레이스 1회 = 스티커 페이지 1장.
            </p>
            <button className="btn-primary mt-2" onClick={handleAddRace}>
              레이스 기록 시작하기
            </button>
          </div>
        )}

        {!loading && !error && seasons.length > 0 && (
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
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
