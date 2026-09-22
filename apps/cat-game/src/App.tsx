import { useRef, useState } from 'react'
import { spriteUrl } from './features/cat/components/CatAvatar'
import { BottomNav, type NavTab } from './features/cat/components/BottomNav'
import { ConfirmLeaveDialog } from './features/cat/components/ConfirmLeaveDialog'
import { CatStatus } from './features/cat/components/CatStatus'
import { Copyright } from './features/cat/components/Copyright'
import { ChatInput } from './features/cat/components/ChatInput'
import { GameOverBar } from './features/cat/components/GameOverBar'
import { ChatThread } from './features/cat/components/ChatThread'
import { RecordsScreen } from './features/cat/components/RecordsScreen'
import { SelectScreen } from './features/cat/components/SelectScreen'
import { StartScreen } from './features/cat/components/StartScreen'
import type { CatProfile } from './features/cat/profile'
import { useCatGame } from './features/cat/useCatGame'
import { useKeyboardOpen } from './useKeyboardOpen'
import { usePhoneFit } from './usePhoneFit'

type Screen = 'start' | 'select' | 'main'

export default function App() {
  const game = useCatGame()
  const phoneRef = useRef<HTMLDivElement>(null)
  usePhoneFit(phoneRef)
  const keyboardOpen = useKeyboardOpen()
  const [screen, setScreen] = useState<Screen>(() => (game.hasActiveSession ? 'main' : 'start'))
  const [tab, setTab] = useState<NavTab>('home')
  const [confirmingLeave, setConfirmingLeave] = useState(false)

  const confirmCat = (profile: CatProfile) => {
    game.start(profile)
    setTab('home')
    setScreen('main')
  }

  const leaveCat = () => {
    game.reset() // 지금 고양이의 나이·기록·이름을 초기화
    setConfirmingLeave(false)
    setScreen('select')
  }

  return (
    <div className="backdrop">
      <div className="backdrop__ground" aria-hidden="true">
        {[['deco-bush', 'deco-grass', 'deco-stump'], ['deco-fence', 'deco-sign', 'deco-flower', 'deco-bush']].map((group, g) => (
          <div key={g} className="backdrop__group">
            {group.map((name) => (
              <img key={name} src={spriteUrl(name)} alt="" />
            ))}
          </div>
        ))}
      </div>
      <Copyright className="copyright--page" />
      <aside className="backdrop__side backdrop__side--left" aria-hidden="true">
        <p className="backdrop__eyebrow">DECISION CAT</p>
        <h2>상황을 알려주면,
          <br />
          고양이가 결정한다</h2>
        <p>성격과 나이, 컨디션에 따라 <br />같은 상황도 다르게 반응해요.</p>
      </aside>
      <div ref={phoneRef} className={`phone${screen === 'start' ? ' phone--scene' : ''}${keyboardOpen ? ' phone--keyboard' : ''}`}>
      {screen === 'start' && <StartScreen onStart={() => setScreen('select')} />}
      {screen === 'select' && (
        <SelectScreen onBack={() => setScreen('start')} onConfirm={confirmCat} />
      )}
      {screen === 'main' && (
        <>
          {tab === 'home' ? (
            <div className="screen play">
              <CatStatus
                typeId={game.typeId}
                catName={game.catName}
                gender={game.gender}
                ageMonths={game.ageMonths}
                hearts={game.hearts}
                gain={game.gain}
                stats={game.stats}
                last={game.logs[game.logs.length - 1]}
                thinking={game.thinking}
              />
              <ChatThread typeId={game.typeId} ownerId={game.ownerId} ownerName={game.ownerName} catName={game.catName} logs={game.logs} pending={game.pending} />
              {game.gameOver ? (
                <GameOverBar catName={game.catName} onRestart={leaveCat} />
              ) : (
                <ChatInput disabled={game.thinking} onSubmit={game.submitSituation} />
              )}
            </div>
          ) : (
            <RecordsScreen catName={game.catName} typeId={game.typeId} ageMonths={game.ageMonths} logs={game.logs} />
          )}
          <BottomNav active={tab} onChange={setTab} onChangeCat={() => setConfirmingLeave(true)} />
        </>
      )}
        {confirmingLeave && <ConfirmLeaveDialog typeId={game.typeId} catName={game.catName} onCancel={() => setConfirmingLeave(false)} onConfirm={leaveCat} />}
      </div>
      <aside className="backdrop__side backdrop__side--right" aria-hidden="true">
        <p className="backdrop__eyebrow">POWERED BY</p>
        <h2>Jev</h2>
        <p>Decisions 모델이<br />매 턴 행동 확률을 계산합니다.</p>
      </aside>
    </div>
  )
}

