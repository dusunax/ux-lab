import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { randomDecorations, type Zone } from '../decorate'
import { displayFont } from '../font'
import { theme } from '../theme'
import { SpriteDeco } from './SpriteDeco'

// 실제 콘텐츠(화살표+문구+고양이+안내+URL)는 세로로 ≈620px, 화면 중앙 기준으로 온다.
// 이 범위만 살짝 여유 두고 피하면 위아래 넓은 공간에 장식을 고르게 흩뿌릴 수 있다.
const centerZone: Zone = { x0: 140, y0: 580, x1: 940, y1: 1340 }

/**
 * 마무리 CTA. 헤드라인은 감성적인 유도 문구("같이 놀아요!")로 크게 보여주고, 그 아래에
 * 실제 행동 지침("프로필 링크 클릭")과 주소를 작게 둔다 — 인스타그램은 영상·캡션 안의 URL을
 * 클릭할 수 없으므로(바이오 링크만 가능) 위쪽을 가리키는 화살표로 프로필 링크를 유도한다.
 */
export function CTACard() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' })
  const catBounce = spring({ frame, fps, config: { damping: 6, mass: 0.7, stiffness: 150 }, durationInFrames: 20 })
  const arrowBob = Math.sin(frame / 6) * 14
  const decorations = randomDecorations('cta', 11, [centerZone])

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${theme.orange}, ${theme.orangeDark})`,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {decorations.map((d, i) => (
        <SpriteDeco key={i} {...d} />
      ))}
      <span style={{ fontSize: 76, opacity: enter, transform: `translateY(${arrowBob}px)` }}>👆</span>
      <span
        style={{
          fontFamily: displayFont,
          fontSize: 96,
          color: '#fff',
          textShadow: '0 4px 0 rgba(0,0,0,0.12)',
          opacity: enter,
          transform: `scale(${Math.min(1.1, catBounce)})`,
        }}
      >
        같이 놀아요!
      </span>
      <Img
        src={staticFile('profile-playful.png')}
        style={{ width: 260, height: 260, objectFit: 'contain', opacity: enter, transform: `scale(${Math.min(1.1, catBounce)})`, marginTop: 8 }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: enter * 0.95, marginTop: 8 }}>
        <span style={{ fontFamily: displayFont, fontSize: 40, color: '#fff' }}>프로필 링크 클릭</span>
        <span
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: '#fff',
            background: 'rgba(255,255,255,0.22)',
            padding: '8px 24px',
            borderRadius: 999,
          }}
        >
          cat-game-wheat-sigma.vercel.app
        </span>
      </div>
    </AbsoluteFill>
  )
}
