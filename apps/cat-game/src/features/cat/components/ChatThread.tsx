import { useEffect, useRef } from 'react'
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
        <DecisionChart decision={decision} />
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
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [logs.length, pending])

  return (
    <div className="thread" aria-live="polite">
      <div className="msg msg--cat">
        <CatFace typeId={typeId} className="msg__avatar" />
        <div className="bubble bubble--cat">
          <p className="bubble__sound">{catSound(typeId, 'investigate', 0)}</p>
          <p className="bubble__narration">
            {CAT_TYPES[typeId].name} {catName}에게 무슨 일이 생겼는지 알려주세요.
          </p>
        </div>
      </div>
      {logs.map((log) => (
        <div key={log.id} className="thread__turn">
          <div className="msg msg--me">
            <div className="msg__me-body">
              <span className="msg__owner-name">{ownerName}</span>
              <div className="bubble bubble--me">{log.situation}</div>
            </div>
            <OwnerHead ownerId={ownerId} className="msg__avatar msg__avatar--owner" />
          </div>
          <CatBubble typeId={typeId} log={log} />
        </div>
      ))}
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
      <div ref={endRef} />
    </div>
  )
}
