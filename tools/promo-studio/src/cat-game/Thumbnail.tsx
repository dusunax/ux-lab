import { AbsoluteFill, Img } from 'remotion'
import { asset } from './asset'
import { randomDecorations, type Zone } from './decorate'
import { displayFont } from '../shared/font'
import { SpriteDeco } from './components/SpriteDeco'
import { theme } from './theme'

interface CardProps {
  face: string
  tag: string
  action: string
  rotate: number
}

function Card({ face, tag, action, rotate }: CardProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, transform: `rotate(${rotate}deg)` }}>
      <div
        style={{
          width: 300,
          height: 300,
          borderRadius: 40,
          background: theme.card,
          border: '8px solid #fff',
          boxShadow: '0 16px 0 rgba(0,0,0,0.18)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Img src={asset(`sprites/${face}`)} style={{ width: 220, height: 220, objectFit: 'contain' }} />
      </div>
      <span style={{ fontFamily: displayFont, fontSize: 34, color: theme.orangeDark, background: '#fff', padding: '4px 22px', borderRadius: 999 }}>{tag}</span>
      <span style={{ fontFamily: displayFont, fontSize: 64, color: '#fff', textShadow: '0 4px 0 rgba(0,0,0,0.22)', WebkitTextStroke: '3px rgba(0,0,0,0.15)' }}>
        {action}
      </span>
    </div>
  )
}

// 쇼츠 안전 영역(위 200px·아래 320px, safezone.ts와 같은 기준) 안에서 콘텐츠를 세로로
// 중앙 정렬한다 — 총 높이 ≈950px를 1400px 안전 영역 안에 두면 위아래에 225px 안팎씩 남는다.
// 아이콘은 그 남는 위아래 여백(주변부)에 몰아 배치되도록, 콘텐츠 영역만 딱 맞게 막는다.
const headlineZone: Zone = { x0: 40, y0: 400, x1: 1040, y1: 660 }
const cardsZone: Zone = { x0: 40, y0: 680, x1: 1040, y1: 1180 }
const buttonZone: Zone = { x0: 280, y0: 1230, x1: 800, y1: 1380 }

/**
 * 유튜브 쇼츠 썸네일(1080x1920 정지 이미지, still로 렌더).
 * 위: 구체적인 상황("바퀴벌레 등장!") — 가운데: 성격별 반응 카드 두 개를 VS로 대비 —
 * 아래: 플레이 유도 버튼. 여백에는 스프라이트 아이콘을 흩뿌려 심심하지 않게 한다.
 */
export function Thumbnail() {
  // 위/아래 여백에 각각 따로 뽑아서 한쪽으로 몰리지 않고 고르게 감싸도록 한다
  // (전체 범위에서 한 번에 뽑으면 좁은 틈보다 넓은 쪽에 우연히 몰릴 수 있다).
  const topDecorations = randomDecorations('thumbnail-top', 6, [headlineZone], [200, 400])
  const bottomDecorations = randomDecorations('thumbnail-bottom', 6, [buttonZone], [1380, 1600])
  const decorations = [...topDecorations, ...bottomDecorations]

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${theme.orange}, ${theme.orangeDark})` }}>
      {decorations.map((d, i) => (
        <SpriteDeco key={i} {...d} />
      ))}

      <div
        style={{
          position: 'absolute',
          top: 420,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: displayFont,
          fontSize: 84,
          lineHeight: 1.25,
          color: '#fff',
          textAlign: 'center',
          textShadow: '0 5px 0 rgba(0,0,0,0.2)',
          WebkitTextStroke: '3px rgba(0,0,0,0.12)',
          width: 980,
          wordBreak: 'keep-all',
        }}
      >
        바퀴벌레 등장!
        <br />
        고양이의 결정은?
      </div>

      <div style={{ position: 'absolute', top: 700, left: '50%', transform: 'translateX(-50%)', width: 'max-content', display: 'flex', alignItems: 'center', gap: 56 }}>
        <Card face="face-timid.png" tag="겁쟁이" action="숨는다" rotate={-4} />
        <span style={{ fontFamily: displayFont, fontSize: 64, color: '#fff', textShadow: '0 4px 0 rgba(0,0,0,0.2)' }}>VS</span>
        <Card face="face-aloof.png" tag="도도한" action="하악!" rotate={4} />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 1250,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'max-content',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: theme.ink,
          color: '#fff',
          padding: '24px 64px',
          borderRadius: 999,
          boxShadow: '0 10px 0 rgba(0,0,0,0.25)',
        }}
      >
        <span style={{ fontSize: 44 }}>▶</span>
        <span style={{ fontFamily: displayFont, fontSize: 52 }}>플레이하기</span>
      </div>
    </AbsoluteFill>
  )
}
