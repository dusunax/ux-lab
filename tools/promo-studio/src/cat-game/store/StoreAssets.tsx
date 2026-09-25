import { AbsoluteFill, Img } from 'remotion'
import { asset } from '../asset'
import { displayFont } from '../../shared/font'
import { backdropBackground, theme } from '../theme'

/** Play Console 앱 아이콘: 512x512 정사각형, 모서리 처리는 스토어가 알아서 한다 */
export function StoreIcon() {
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 38%, #ffc48a, ${theme.orange} 70%, ${theme.orangeDark})` }}>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
        <Img
          src={asset('sprites/cat-happy.png')}
          style={{ width: 372, height: 'auto', filter: 'drop-shadow(0 10px 0 rgba(120,50,10,0.28))' }}
        />
      </div>
    </AbsoluteFill>
  )
}

const floaters = [
  { src: 'item-star.png', x: 590, y: 70, size: 62, rotate: -12 },
  { src: 'item-heart.png', x: 905, y: 105, size: 66, rotate: 10 },
  { src: 'item-fish.png', x: 545, y: 335, size: 78, rotate: -8 },
  { src: 'item-bulb.png', x: 880, y: 340, size: 66, rotate: 8 },
  { src: 'item-note.png', x: 960, y: 225, size: 54, rotate: 14 },
]

/** Play Console 피처 그래픽: 1024x500. 가장자리가 잘려 노출될 수 있어 핵심 요소는 안쪽에 둔다 */
export function FeatureGraphic() {
  return (
    <AbsoluteFill style={{ background: theme.cream, overflow: 'hidden' }}>
      <Img
        src={asset('backgrounds/main.webp')}
        style={{ position: 'absolute', left: 0, top: -560, width: 1024, height: 'auto' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,247,237,0.94) 0%, rgba(255,247,237,0.82) 44%, rgba(255,247,237,0) 72%)' }} />

      <div style={{ position: 'absolute', left: 64, top: 108, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span style={{ fontFamily: displayFont, fontSize: 24, letterSpacing: 6, color: theme.orangeDark }}>DECISION CAT</span>
        <span style={{ fontFamily: displayFont, fontSize: 88, lineHeight: 1.05, color: theme.ink, wordBreak: 'keep-all' }}>고양이의 결정</span>
        <span style={{ fontFamily: displayFont, fontSize: 30, lineHeight: 1.35, color: theme.muted, wordBreak: 'keep-all' }}>
          상황만 알려주세요.
          <br />
          행동은 고양이가 결정합니다.
        </span>
      </div>

      {floaters.map((f) => (
        <Img
          key={f.src}
          src={asset(`sprites/${f.src}`)}
          style={{ position: 'absolute', left: f.x, top: f.y, width: f.size, height: 'auto', transform: `rotate(${f.rotate}deg)` }}
        />
      ))}
      <Img src={asset('sprites/cat-back.png')} style={{ position: 'absolute', left: 690, top: 178, width: 226, height: 'auto' }} />
    </AbsoluteFill>
  )
}

type StoreShotProps = {
  shot: string
  line1: string
  line2: string
  accent?: string
}

/** Play Console 휴대전화 스크린샷: 1080x1920(9:16). 캡션 + 실제 앱 화면(3x로 다시 찍은 원본) */
export function StoreShot({ shot, line1, line2, accent }: StoreShotProps) {
  const PHONE_H = 1350
  const PHONE_W = Math.round((PHONE_H * 430) / 932)
  return (
    <AbsoluteFill style={{ background: backdropBackground }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center', fontFamily: displayFont, color: theme.ink, wordBreak: 'keep-all' }}>
        <div style={{ fontSize: 76, lineHeight: 1.2 }}>{line1}</div>
        <div style={{ fontSize: 76, lineHeight: 1.2, color: accent ?? theme.orangeDark }}>{line2}</div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: (1080 - PHONE_W) / 2,
          top: 450,
          width: PHONE_W,
          height: PHONE_H,
          borderRadius: 64,
          overflow: 'hidden',
          border: '10px solid #fff',
          boxShadow: '0 28px 60px rgba(120,60,10,0.28)',
          boxSizing: 'content-box',
        }}
      >
        <Img src={asset(`store-src/${shot}`)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    </AbsoluteFill>
  )
}
