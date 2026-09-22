import { useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ACTIONS } from '../actions'
import { CAT_TYPES, type CatTypeId } from '../catTypes'
import type { OwnerId } from '../owners'
import type { TurnLog } from '../types'
import { catSound } from '../meow'
import { CatFace } from './CatAvatar'
import { DecisionChart } from './DecisionChart'
import { OwnerHead } from './OwnerAvatar'

/** 유대 단계에 따라 울음소리 끝이 달라진다 */
const BOND_SOUND_SUFFIX = { close: ' 골골~', normal: '', wary: ' …' } as const

function CatBubble({ typeId, log }: { typeId: CatTypeId; log: TurnLog }) {
  const { decision } = log
  const info = ACTIONS[decision.action]
  return (
    <div className="msg msg--cat">
      <CatFace typeId={typeId} className="msg__avatar" />
      <div className="bubble bubble--cat">
        <p className="bubble__sound">
          {catSound(typeId, decision.action, log.id)}
          {BOND_SOUND_SUFFIX[log.bond]}
        </p>
        <p className="bubble__narration">
          <strong>{info.label}</strong> · {log.narration}
        </p>
        {log.notes.length > 0 && (
          <ul className="bubble__notes" aria-label="이번 반응에 영향을 준 기억">
            {log.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}
        <DecisionChart decision={decision} catName={log.catName} />
      </div>
    </div>
  )
}

interface Props {
  typeId: CatTypeId
  ownerId: OwnerId
  ownerName: string
  catName: string
  logs: TurnLog[]
  pending: string | null
}

export function ChatThread({ typeId, ownerId, ownerName, catName, logs, pending }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)

  // 채팅 턴이 많아져도 화면 밖 항목은 DOM에서 빼서(가상 스크롤) 렌더 비용을 일정하게 유지한다.
  // 턴마다 높이가 달라(상황·행동 노트·결정 차트 길이) measureElement로 실제 렌더 높이를 재서 보정한다.
  const virtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 260,
    overscan: 6,
    gap: 10,
  })

  useEffect(() => {
    const el = parentRef.current
    if (!el) return
    // 가상 스크롤은 처음 보이는 항목들의 실제 높이를 마운트 후 비동기로 측정해 총 높이를 보정한다.
    // 그 보정이 끝나기 전에 한 번만 스크롤하면(특히 로그가 많이 쌓인 채로 막 열었을 때) 끝까지 못 간다.
    // scrollHeight가 몇 프레임 연속으로 더는 안 늘어날 때까지 맨 아래로 계속 당겨 안정화한다.
    let frame: number
    let lastHeight = -1
    let stableFrames = 0
    const stick = () => {
      el.scrollTop = el.scrollHeight
      if (el.scrollHeight === lastHeight) {
        stableFrames += 1
        if (stableFrames >= 3) return
      } else {
        stableFrames = 0
      }
      lastHeight = el.scrollHeight
      frame = requestAnimationFrame(stick)
    }
    frame = requestAnimationFrame(stick)
    return () => cancelAnimationFrame(frame)
  }, [logs.length, pending])

  return (
    <div className="thread" aria-live="polite" ref={parentRef}>
      <div className="msg msg--cat">
        <CatFace typeId={typeId} className="msg__avatar" />
        <div className="bubble bubble--cat">
          <p className="bubble__sound">{catSound(typeId, 'investigate', 0)}</p>
          <p className="bubble__narration">
            {CAT_TYPES[typeId].name} {catName}에게 무슨 일이 생겼는지 알려주세요.
          </p>
        </div>
      </div>
      <div className="thread__virtual" style={{ position: 'relative', width: '100%', height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((vi) => {
          const log = logs[vi.index]
          return (
            <div
              key={log.id}
              data-index={vi.index}
              ref={virtualizer.measureElement}
              className="thread__turn"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vi.start}px)` }}
            >
              <div className="msg msg--me">
                <div className="msg__me-body">
                  <span className="msg__owner-name">{ownerName}</span>
                  <div className="bubble bubble--me">{log.situation}</div>
                </div>
                <OwnerHead ownerId={ownerId} className="msg__avatar msg__avatar--owner" />
              </div>
              <CatBubble typeId={typeId} log={log} />
            </div>
          )
        })}
      </div>
      {pending && (
        <>
          <div className="msg msg--me">
            <div className="msg__me-body">
              <span className="msg__owner-name">{ownerName}</span>
              <div className="bubble bubble--me">{pending}</div>
            </div>
            <OwnerHead ownerId={ownerId} className="msg__avatar msg__avatar--owner" />
          </div>
          <div className="msg msg--cat">
            <CatFace typeId={typeId} className="msg__avatar" />
            <div className="bubble bubble--cat typing" aria-label="고양이가 생각하는 중">
              <i /> <i /> <i />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
