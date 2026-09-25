import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { asset } from '../asset'
import { randomDecorations, type Zone } from '../decorate'
import { displayFont } from '../../shared/font'
import { backdropBackground } from '../theme'
import { SpriteDeco } from './SpriteDeco'

const boardZone: Zone = { x0: 110, y0: 660, x1: 970, y1: 1260 }

/** 오프닝 로고 카드: 게임의 ui-board 스프라이트를 배경 삼아 타이틀이 통통 튀며 등장한다 */
export function TitleCard() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const bounce = spring({ frame, fps, config: { damping: 6, mass: 0.7, stiffness: 140 }, durationInFrames: 22 })
  const decorations = randomDecorations('title', 8, [boardZone])

  return (
    <AbsoluteFill style={{ background: backdropBackground, alignItems: 'center', justifyContent: 'center' }}>
      {decorations.map((d, i) => (
        <SpriteDeco key={i} {...d} />
      ))}
      <div style={{ position: 'relative', width: 860, transform: `scale(${Math.min(1.15, bounce)})` }}>
        <Img src={asset('ui-board.png')} style={{ display: 'block', width: '100%' }} />
        {/* 보드 이미지의 진한 헤더 줄이 위쪽 26%를 차지한다(실제 앱 .title-board와 같은 비율) —
            grid-template-rows로 그 줄과 아래 크림색 영역을 나눠서, 타이틀이 헤더 줄을 침범하지
            않고 크림색 영역 안에서만 중앙 정렬되게 한다 */}
        <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateRows: '26% 1fr', justifyItems: 'center', padding: '0 20px 3%' }}>
          <span style={{ alignSelf: 'center', fontFamily: displayFont, fontSize: 24, fontWeight: 400, letterSpacing: 8, color: '#f6dcc0' }}>DECISION CAT</span>
          <span style={{ alignSelf: 'center', fontFamily: displayFont, fontSize: 80, fontWeight: 400, color: '#3b2f2a' }}>고양이의 결정</span>
        </div>
      </div>
    </AbsoluteFill>
  )
}
