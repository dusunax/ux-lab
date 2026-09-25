import { interpolate, useCurrentFrame } from 'remotion'
import { displayFont } from '../font'
import { SAFE_BOTTOM } from '../safezone'
import { theme } from '../theme'

interface Props {
  text: string
  /** 화면 아래로부터의 거리(px). 기본값은 안전 영역 경계(SAFE_BOTTOM) — 박스는 거기서
   * 위로 자라기 때문에(bottom 고정) 1줄이든 2줄이든 아래쪽 잘림·플랫폼 UI 가림 걱정이 없다 */
  bottom?: number
  fontSize?: number
}

/**
 * 와썹맨/워크맨 스타일: 검정 둥근 배경 + 흰 굵은 글씨. 화면 하단에 고정하되 안전 영역
 * (SAFE_BOTTOM) 안쪽에 bottom 기준으로 앉혀서, 세로 비율이 다른 기기에서 잘리거나
 * 인스타 자체 UI(캡션·아이디·음악 정보)에 가려지지 않게 한다.
 * 다른 요소들은 통통 튀지만, 자막은 읽는 데 방해되지 않도록 애니메이션을 최소화한다
 * (회전·바운스 없이 짧게 페이드 + 살짝 스케일만).
 */
export function MemeCaption({ text, bottom = SAFE_BOTTOM, fontSize = 68 }: Props) {
  const frame = useCurrentFrame()
  const enter = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <div
      style={{
        position: 'absolute',
        bottom,
        left: '50%',
        transform: `translateX(-50%) scale(${0.96 + enter * 0.04})`,
        opacity: enter,
        width: 'fit-content',
        maxWidth: 940,
        padding: '18px 40px',
        borderRadius: 20,
        background: theme.memeBg,
        boxShadow: '0 14px 0 rgba(0,0,0,0.18)',
      }}
    >
      <span
        style={{
          display: 'block',
          fontFamily: displayFont,
          fontSize,
          color: theme.memeText,
          textAlign: 'center',
          letterSpacing: 0.5,
          lineHeight: 1.25,
          wordBreak: 'keep-all',
          overflowWrap: 'break-word',
        }}
      >
        {text}
      </span>
    </div>
  )
}
