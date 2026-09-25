import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { displayFont } from '../font'
import { SAFE_TOP } from '../safezone'
import { backdropBackground, theme } from '../theme'
import { MemeCaption } from './MemeCaption'

interface Beat {
  bubble: string
  face: string
  tag: string
  action: string
}

const BEATS: Beat[] = [
  { bubble: '초인종이 울렸다', face: 'face-timid.png', tag: '겁쟁이', action: '숨는다' },
  { bubble: '주인이 안아든다', face: 'face-aloof.png', tag: '도도한', action: '하악!' },
  { bubble: '낯선 택배 상자가 도착했다', face: 'face-glutton.png', tag: '먹보', action: '상자를 먹는다?!' },
]

// 입양 타이틀 비트: 고양이가 포즈 2개로 전환되며 등장한다(포즈 1개당 POSE_LEN 프레임).
// 3개는 너무 정신없어서 2개로, 대신 포즈당 노출 시간을 늘려 차분하게 보여준다.
const POSES = ['cat-idle.png', 'cat-happy.png']
const POSE_LEN = 13
const TITLE_END = POSES.length * POSE_LEN // 26f
const BEAT_LEN = 45
const BUBBLE_DELAY = 0
const CARD_DELAY = 18 // 말풍선이 뜨고 "뒤늦게" 카드가 스태킹된다

function BubbleRow({ text, localFrame, fps }: { text: string; localFrame: number; fps: number }) {
  const pop = spring({ frame: localFrame - BUBBLE_DELAY, fps, config: { damping: 9, mass: 0.5, stiffness: 180 }, durationInFrames: 14 })
  if (localFrame < BUBBLE_DELAY) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', opacity: Math.min(1, pop), transform: `scale(${Math.min(1, pop)})`, transformOrigin: 'right center' }}>
      <div
        style={{
          maxWidth: 760,
          padding: '20px 34px',
          borderRadius: 26,
          borderBottomRightRadius: 6,
          background: theme.orange,
          boxShadow: '0 8px 0 rgba(0,0,0,0.1)',
        }}
      >
        <span style={{ fontFamily: displayFont, fontSize: 48, color: '#fff', wordBreak: 'keep-all' }}>{text}</span>
      </div>
    </div>
  )
}

function ReactionCard({ beat, localFrame, fps }: { beat: Beat; localFrame: number; fps: number }) {
  const t = localFrame - CARD_DELAY
  const pop = spring({ frame: t, fps, config: { damping: 8, mass: 0.6, stiffness: 200 }, durationInFrames: 16 })
  if (t < 0) return null
  const clamped = Math.min(1, pop)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        opacity: clamped,
        // 위에서 툭 떨어져 쌓이는 느낌: 살짝 위에서 시작해 스프링으로 튕기며 제자리에 안착
        transform: `translateY(${(1 - Math.min(1.3, pop)) * -30}px) scale(${Math.min(1.08, pop)})`,
      }}
    >
      <Img src={staticFile(`sprites/${beat.face}`)} style={{ width: 116, height: 116, objectFit: 'contain', flexShrink: 0 }} />
      <div
        style={{
          maxWidth: 760,
          padding: '18px 30px',
          borderRadius: 26,
          borderBottomLeftRadius: 6,
          background: theme.card,
          border: `3px solid ${theme.peach}`,
          boxShadow: '0 8px 0 rgba(90,50,10,0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <span
          style={{
            alignSelf: 'flex-start',
            fontFamily: displayFont,
            fontSize: 26,
            color: theme.orangeDark,
            background: theme.peach,
            padding: '3px 16px',
            borderRadius: 999,
          }}
        >
          {beat.tag}
        </span>
        <span style={{ fontFamily: displayFont, fontSize: 56, color: theme.ink, wordBreak: 'keep-all' }}>{beat.action}</span>
      </div>
    </div>
  )
}

/**
 * 0~? 훅: "고양이와 살게 되었다" 타이틀(고양이가 여러 포즈로 빠르게 전환)로 시작해서,
 * 상황(말풍선)을 던지면 뒤늦게 성격별 반응 카드가 쌓이듯 나타나는 3개 비트로 구성한다.
 * 실제 앱 채팅 UI의 말풍선(주인은 orange, 고양이는 cream) 스타일을 그대로 가져와 나중에
 * 나오는 실제 스크린샷과 톤이 이어지게 했다. 모든 콘텐츠는 안전 영역(safezone.ts) 안에 둔다.
 */
export function HookScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const titleOpacity = interpolate(frame, [TITLE_END - 8, TITLE_END + 4], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const stackOpacity = interpolate(frame, [TITLE_END - 6, TITLE_END + 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const poseIndex = Math.min(POSES.length - 1, Math.floor(frame / POSE_LEN))
  const posePop = spring({ frame: frame - poseIndex * POSE_LEN, fps, config: { damping: 7, mass: 0.4, stiffness: 220 }, durationInFrames: POSE_LEN })

  return (
    <AbsoluteFill style={{ background: backdropBackground }}>
      {frame < TITLE_END + 4 && (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: titleOpacity }}>
          <Img
            key={poseIndex}
            src={staticFile(`sprites/${POSES[poseIndex]}`)}
            style={{ width: 380, height: 380, objectFit: 'contain', transform: `scale(${Math.min(1.2, posePop)})` }}
          />
        </AbsoluteFill>
      )}
      {frame < TITLE_END + 4 && <MemeCaption text="고양이와 살게 되었다" />}

      {frame >= TITLE_END - 6 && (
        <AbsoluteFill style={{ opacity: stackOpacity, padding: `${SAFE_TOP + 20}px 60px 0`, display: 'flex', flexDirection: 'column', gap: 32 }}>
          {BEATS.map((beat, i) => {
            const beatStart = TITLE_END + i * BEAT_LEN
            const localFrame = frame - beatStart
            if (localFrame < 0) return null
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <BubbleRow text={beat.bubble} localFrame={localFrame} fps={fps} />
                <ReactionCard beat={beat} localFrame={localFrame} fps={fps} />
              </div>
            )
          })}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  )
}
