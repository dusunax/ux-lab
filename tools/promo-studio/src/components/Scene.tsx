import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { randomDecorations, type Zone } from '../decorate'
import { SAFE_BOTTOM_Y, SAFE_TOP } from '../safezone'
import { backdropBackground } from '../theme'
import { MemeCaption } from './MemeCaption'
import { SpriteDeco } from './SpriteDeco'

interface Props {
  /** public/screens/의 파일명 */
  src: string
  /** 검정 배경 밈 자막 한 줄 (항상 화면 하단 안전 영역에 고정) */
  caption: string
  /** 흩뿌릴 장식 스프라이트 개수 (위치·크기·회전은 src를 시드로 자동 랜덤 배치) */
  decoCount?: number
}

// 스크린샷과 자막을 안전 영역(SAFE_TOP~SAFE_BOTTOM_Y, safezone.ts) 안에 위아래로 나눠 담는다.
// 자막이 2줄이 될 수 있어(≈206px) 그만큼 아래쪽에 미리 비워두고, 스크린샷은 남는 위쪽 공간에
// 원본 비율(430:932)을 유지한 채로 최대한 크게 채운다.
const CAPTION_ZONE_HEIGHT = 230
const SCREENSHOT_TOP = SAFE_TOP + 20
const SCREENSHOT_BOTTOM_LIMIT = SAFE_BOTTOM_Y - CAPTION_ZONE_HEIGHT
const SCREENSHOT_HEIGHT = SCREENSHOT_BOTTOM_LIMIT - SCREENSHOT_TOP
const SCREENSHOT_WIDTH = Math.round((SCREENSHOT_HEIGHT * 430) / 932)
const GROUND_HEIGHT = 130

const screenshotZone: Zone = { x0: (1080 - SCREENSHOT_WIDTH) / 2 - 12, y0: SCREENSHOT_TOP - 12, x1: (1080 + SCREENSHOT_WIDTH) / 2 + 12, y1: SCREENSHOT_TOP + SCREENSHOT_HEIGHT + 12 }
const captionZone: Zone = { x0: 40, y0: SCREENSHOT_BOTTOM_LIMIT, x1: 1040, y1: 1920 }

/**
 * 실제 게임 스크린샷 한 장을 하드컷으로 보여준다. 장면 시작 직후 통통 튀는 스냅줌(overshoot)만
 * 주고, 다른 장면과 겹쳐 페이드되지 않는다(하드컷이라 고스팅이 없다). 배경은 cat-game 데스크톱
 * 배경(발바닥 패턴)과 잔디 그라운드를 그대로 가져와 쓴다. 자막은 항상 화면 하단 안전 영역에 고정한다.
 */
export function Scene({ src, caption, decoCount = 9 }: Props) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const snap = spring({ frame, fps, config: { damping: 8, mass: 0.5, stiffness: 150 }, durationInFrames: 14 })
  const scale = interpolate(snap, [0, 1], [1.12, 1])

  const decorations = randomDecorations(src, decoCount, [screenshotZone, captionZone])

  return (
    <AbsoluteFill style={{ background: backdropBackground }}>
      <AbsoluteFill style={{ bottom: 0, top: 'auto', height: GROUND_HEIGHT, overflow: 'hidden' }}>
        <Img src={staticFile('backgrounds/grass.webp')} style={{ position: 'absolute', bottom: -30, width: '100%', height: 'auto' }} />
      </AbsoluteFill>
      {decorations.map((d, i) => (
        <SpriteDeco key={i} {...d} />
      ))}
      <div
        style={{
          position: 'absolute',
          top: SCREENSHOT_TOP,
          left: '50%',
          transform: `translateX(-50%) scale(${scale})`,
          borderRadius: 44,
          overflow: 'hidden',
          boxShadow: '0 30px 60px rgba(90, 50, 10, 0.35), 0 0 0 6px rgba(255,255,255,0.6)',
        }}
      >
        <Img src={staticFile(`screens/${src}`)} style={{ display: 'block', width: SCREENSHOT_WIDTH, height: 'auto' }} />
      </div>
      <MemeCaption text={caption} />
    </AbsoluteFill>
  )
}
