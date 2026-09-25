import { Series } from 'remotion'
import { CTACard } from './components/CTACard'
import { HookScene } from './components/HookScene'
import { Scene } from './components/Scene'
import { TitleCard } from './components/TitleCard'

/**
 * 고양이의 결정 — 인스타 쇼츠(1080x1920, 30fps).
 * storyboard/cat-game.md v3 대본을 그대로 구현한다.
 * 장면 전환은 전부 하드컷(Series) — 겹치는 프레임이 없어 글자·이미지가 겹치거나 잘릴 일이 없다.
 * 성격마다 다른 선택을 보여주는 내용은 훅(HookScene)의 스태킹 카드로 옮기고, 뒤쪽의 중복 비교
 * 장면은 삭제했다(v2에는 있었음).
 */
export function CatGamePromo() {
  return (
    <Series>
      <Series.Sequence durationInFrames={165}>
        <HookScene />
      </Series.Sequence>
      <Series.Sequence durationInFrames={60}>
        <Scene src="scene1-landing.png" caption="무슨 상황이든 입력하면" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={60}>
        <Scene src="scene2-select.png" caption="성격에 따라 다르게" decoCount={10} />
      </Series.Sequence>
      <Series.Sequence durationInFrames={60}>
        <Scene src="scene3-input.png" caption="고양이가 움직인다!" decoCount={10} />
      </Series.Sequence>
      <Series.Sequence durationInFrames={45}>
        <Scene src="scene4-decision.png" caption="고양이가 스스로 결정해요!" decoCount={9} />
      </Series.Sequence>
      <Series.Sequence durationInFrames={45}>
        <TitleCard />
      </Series.Sequence>
      <Series.Sequence durationInFrames={75}>
        <CTACard />
      </Series.Sequence>
    </Series>
  )
}
