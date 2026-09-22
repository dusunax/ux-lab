import { Copyright } from './Copyright'
import { ImageButton } from './ImageButton'
import { PullCat } from './PullCat'
import { Sprite } from './Sprite'

/** 화면 가장자리에 떠다니는 소품: [스프라이트, left%, top%(화면 전체 기준), 애니메이션 지연(s), 크기(px, 원본 이하)] */
const FLOATERS: [string, number, number, number, number][] = [
  ['item-star', 8, 44, 0, 30],
  ['item-note', 86, 40, 0.8, 30],
  ['item-drumstick', 80, 62, 0.4, 34],
]

export function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="screen start">
      <div className="start__sky" aria-hidden="true">
        {FLOATERS.map(([name, left, top, delay, size]) => (
          <Sprite key={name} className="floater" name={name} width={size} style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${delay}s` }} />
        ))}
      </div>

      <div className="title-board">
        <span className="title-board__eyebrow">DECISION CAT</span>
        <h1>고양이의 결정</h1>
      </div>
      <div className="start__note">
        <p>
          상황을 알려주세요.
          <br />
          행동은 고양이가 결정합니다.
        </p>
      </div>

      <div className="hero-cat">
        <PullCat>
          <Sprite name="cat-back" alt="창밖을 바라보는 고양이" width={107} height={130} draggable={false} priority />
        </PullCat>
      </div>

      <ImageButton sprite="btn-start" label="시작하기" onClick={onStart} />
      <Copyright className="copyright--screen" />
    </div>
  )
}
