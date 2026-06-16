import { useState, useEffect, useCallback } from 'react'
import { Race } from '../../types/race'
import { getRace, saveRace, deleteRace } from '../db/races'
import { Route } from '../../App'
import PhotoSlot from './PhotoSlot'
import DecoLayer from '../deco/DecoLayer'

interface Props {
  raceId: string
  onNavigate: (route: Route) => void
}

export default function RacePage({ raceId, onNavigate }: Props) {
  const [race, setRace] = useState<Race | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const loadRace = useCallback(async () => {
    try {
      setLoading(true)
      const found = await getRace(raceId)
      if (!found) {
        setError('레이스를 찾을 수 없습니다.')
        return
      }
      setRace(found)
    } catch {
      setError('레이스 데이터를 불러오는 데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [raceId])

  useEffect(() => {
    void loadRace()
  }, [loadRace])

  const handlePhotoSave = useCallback(
    async (slot: 'bib' | 'medal' | 'selfie', imageId: string) => {
      if (!race) return
      const updated: Race = {
        ...race,
        photoIds: { ...race.photoIds, [slot]: imageId },
      }
      try {
        await saveRace(updated)
        setRace(updated)
      } catch {
        setError('사진 저장에 실패했습니다.')
      }
    },
    [race]
  )

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    try {
      await deleteRace(raceId)
      onNavigate({ path: '/' })
    } catch {
      setError('삭제에 실패했습니다.')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }, [raceId, onNavigate])

  if (loading) {
    return (
      <div className="h-full bg-cream flex items-center justify-center" role="status">
        <span className="text-bark-light">불러오는 중…</span>
      </div>
    )
  }

  if (error || !race) {
    return (
      <div className="h-full bg-cream p-8">
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm" role="alert">
          {error ?? '알 수 없는 오류가 발생했습니다.'}
        </div>
        <button className="btn-ghost mt-4" onClick={() => onNavigate({ path: '/' })}>
          목록으로
        </button>
      </div>
    )
  }

  return (
    <main className="h-full bg-cream flex flex-col">
      {/* 헤더 */}
      <header className="px-4 py-4 md:px-8 flex items-center gap-3 border-b border-bark/10 flex-wrap flex-shrink-0">
        <button
          className="btn-ghost text-sm"
          onClick={() => onNavigate({ path: '/' })}
          aria-label="앨범 목록으로 돌아가기"
        >
          ← 목록
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="font-handwriting text-2xl text-ink leading-tight truncate">
            #{race.bibNumber}
            {race.raceName && <span className="text-bark-light text-lg ml-2">{race.raceName}</span>}
          </h1>
          <p className="text-bark-light text-xs">{race.date} · {race.distance}km · {race.finishTime}</p>
        </div>

        <button
          className="text-bark-light text-sm hover:text-red-500 transition-colors focus-visible:ring-2 focus-visible:ring-red-400 rounded px-2 py-1"
          onClick={() => setShowDeleteConfirm(true)}
          aria-label="레이스 삭제"
          type="button"
        >
          삭제
        </button>
      </header>

      {/* 메인 영역 */}
      <div className="flex-1 relative overflow-hidden">
        {/* 사진 그리드 */}
        <div
          className="absolute inset-0 p-4 grid grid-cols-2 gap-3 content-start"
          aria-label="레이스 사진 슬롯"
        >
          <PhotoSlot
            slot="bib"
            imageId={race.photoIds.bib}
            onSave={(id) => handlePhotoSave('bib', id)}
          />
          <PhotoSlot
            slot="medal"
            imageId={race.photoIds.medal}
            onSave={(id) => handlePhotoSave('medal', id)}
          />
          <RecordCard race={race} />
          <PhotoSlot
            slot="selfie"
            imageId={race.photoIds.selfie}
            onSave={(id) => handlePhotoSave('selfie', id)}
          />
        </div>

        {/* 꾸미기 오버레이 */}
        <DecoLayer raceId={raceId} />
      </div>

      {/* 삭제 확인 다이얼로그 */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="bg-cream rounded-xl p-6 max-w-sm w-full shadow-page-hover">
            <h2 id="delete-dialog-title" className="text-ink font-medium text-lg mb-2">
              레이스를 삭제할까요?
            </h2>
            <p className="text-bark-light text-sm mb-6">
              삭제하면 사진과 스티커 데이터가 모두 사라집니다. 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                className="btn-ghost flex-1"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                type="button"
              >
                취소
              </button>
              <button
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-red-400"
                onClick={handleDelete}
                disabled={deleting}
                aria-busy={deleting}
                type="button"
              >
                {deleting ? '삭제 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

interface RecordCardProps {
  race: Race
}

function RecordCard({ race }: RecordCardProps) {
  return (
    <div
      className="flex flex-col items-center justify-center border border-bark/20 rounded-lg bg-cream aspect-square p-3 gap-2"
      aria-label="완주 기록"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-gold/80" aria-hidden="true">
        <circle cx="12" cy="13" r="7"/>
        <path d="M12 10v4l2.5 2.5M10 3h4M12 3v3" strokeLinecap="round"/>
      </svg>
      <p className="font-handwriting text-2xl text-gold leading-tight text-center">
        {race.finishTime}
      </p>
      <p className="text-bark text-sm font-medium">{race.distance}km</p>
      <p className="text-bark-light text-xs text-center">{race.date}</p>
    </div>
  )
}
