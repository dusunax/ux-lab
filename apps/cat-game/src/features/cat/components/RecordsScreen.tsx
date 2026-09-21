import { josa } from 'es-hangul'
import { useState } from 'react'
import { ACTIONS, ACTION_IDS, type ActionId } from '../actions'
import { TURNS_PER_MONTH, formatAge } from '../age'
import type { CatTypeId } from '../catTypes'
import { EXPRESSION_BY_ACTION } from '../expression'
import type { TurnLog } from '../types'
import { CatAvatar } from './CatAvatar'

type Tab = 'recent' | 'stats'

/** 그래프 아래에 쓰는 짧은 행동 이름 */
const SHORT_LABEL: Record<ActionId, string> = {
  hide: '숨기',
  investigate: '살핌',
  play: '장난',
  eat: '먹기',
  sleep: '잠',
  cuddle: '부빔',
  hiss: '하악',
  ignore: '무시',
}

/** 행동별 횟수를 세로 막대 그래프로 보여준다 */
function Stats({ logs, typeId }: { logs: TurnLog[]; typeId: CatTypeId }) {
  const counts = ACTION_IDS.map((id) => ({ id, n: logs.filter((l) => l.decision.action === id).length }))
  const max = Math.max(1, ...counts.map((c) => c.n))
  const top = counts.reduce((best, c) => (c.n > best.n ? c : best), counts[0])

  return (
    <section className="graph" aria-label="행동별 횟수 그래프">
      <p className="graph__title">
        가장 많이 한 행동 <strong>{ACTIONS[top.id].label}</strong> · {top.n}회
      </p>
      <ul className="graph__cols">
        {counts.map(({ id, n }) => (
          <li key={id} className={n > 0 && n === max ? 'is-top' : ''} aria-label={`${ACTIONS[id].label} ${n}회`}>
            <span className="graph__count">{n > 0 ? n : ''}</span>
            <span className="graph__bar">
              <span className="graph__fill" style={{ height: `${(n / max) * 100}%` }} />
            </span>
            <CatAvatar typeId={typeId} expression={EXPRESSION_BY_ACTION[id]} size={30} className="graph__icon" />
            <span className="graph__label">{SHORT_LABEL[id]}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

interface Props {
  catName: string
  typeId: CatTypeId
  ageMonths: number
  logs: TurnLog[]
}

export function RecordsScreen({ catName, typeId, ageMonths, logs }: Props) {
  const [tab, setTab] = useState<Tab>('recent')
  // 게임 안에서는 상황 TURNS_PER_MONTH번마다 한 달이 흐른다
  const together = Math.floor(logs.length / TURNS_PER_MONTH)

  return (
    <div className="screen records">
      <section className="together">
        <CatAvatar typeId={typeId} expression="happy" size={56} className="together__cat" />
        <div>
          <p className="together__label">{josa(catName, '와/과')} 함께한 시간</p>
          <p className="together__value">{together}개월</p>
          <p className="together__sub">
            결정 {logs.length}번 · 나이 {formatAge(ageMonths)}
          </p>
        </div>
      </section>

      <div className="segment" role="tablist">
        {(['recent', 'stats'] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>
            {t === 'recent' ? '최근 결정' : '통계'}
          </button>
        ))}
      </div>
      {logs.length === 0 ? (
        <p className="empty">아직 기록이 없어요. 일상 탭에서 상황을 하나 알려주세요.</p>
      ) : tab === 'stats' ? (
        <Stats logs={logs} typeId={typeId} />
      ) : (
        <ol className="history">
          {[...logs].reverse().map((log) => (
            <li key={log.id} className="history__item">
              <CatAvatar typeId={log.catType} expression={EXPRESSION_BY_ACTION[log.decision.action]} size={52} className="history__cat" />
              <div>
                <p className="history__title">{log.situation}</p>
                <p className="history__sub">
                  {ACTIONS[log.decision.action].label} · {formatAge(log.ageMonths)}
                  {log.decision.source === 'instinct' && ' · 본능'}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
