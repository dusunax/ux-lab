import { AbsoluteFill, Img, random } from 'remotion'
import { asset } from './asset'
import { SpriteDeco } from './components/SpriteDeco'

// 스크린샷(430:932)은 늘리지 않고 세로만 캔버스 높이(1920)에 맞춰 자연스러운 배율로 띄운다.
const SHOT_HEIGHT = 1920
const SHOT_WIDTH = Math.round((SHOT_HEIGHT * 430) / 932)
const SHOT_LEFT = (1080 - SHOT_WIDTH) / 2

// 스크린샷 안에서 뒷모습 고양이가 있는 대략적인 위치(가로 50%, 세로 48% 지점) → 캔버스 좌표로 환산
const CAT_X = 540
const CAT_Y = Math.round(SHOT_HEIGHT * 0.48)
// 튀어나오는 소품들은 고양이를 쓰다듬을 때 실제 게임처럼 위로 솟구치는 느낌을 내려고
// 고양이 위치보다 조금 위쪽을 중심으로 방사형 배치한다
const BURST_CENTER_Y = CAT_Y - 90

// 스크린샷 안 타이틀 보드+상황 안내 노트가 있는 영역(대략) — 소품이 이 위로 겹쳐서
// 글자를 가리지 않게 피한다. 스크린샷 안에서의 비율(세로 0~31%)을 캔버스 좌표로 환산.
const noteCardBottom = Math.round(SHOT_HEIGHT * 0.31)
const avoidZone = { x0: 70, y0: 0, x1: 910, y1: noteCardBottom + 20 }

// 너무 많으면 정신없어서 5개만 남긴다: 물고기·별·전구·하트·(짜증을 표현하는) 손글씨 낙서
const POP_ITEMS = ['item-fish.png', 'item-star.png', 'item-bulb.png', 'item-heart.png', 'item-scribble.png']

const overlapsBox = (x: number, y: number, size: number, box: { x0: number; y0: number; x1: number; y1: number }) =>
  x < box.x1 && x + size > box.x0 && y < box.y1 && y + size > box.y0

/** 이미 배치한 아이템의 사각 범위(여백 포함)를 새 아이템과 겹치지 않게 막을 영역으로 되돌린다 */
const toBox = (p: { x: number; y: number; size: number }, gap = 10) => ({ x0: p.x - gap, y0: p.y - gap, x1: p.x + p.size + gap, y1: p.y + p.size + gap })

/** 고양이 위쪽을 중심으로 방사형으로 아이템이 잔뜩 튀어나온 배치를 시드 기반으로 고정 생성한다.
 * 타이틀 보드·안내 노트(avoidZone) 위나 이미 놓인 다른 아이템 위로는 겹치지 않게, 여러
 * 각도/반지름을 다시 뽑아본다. */
function burstDecorations() {
  const placed: { x: number; y: number; size: number }[] = []
  for (let i = 0; i < POP_ITEMS.length; i++) {
    const seed = `burst-${i}`
    const size = 60 + random(`${seed}-s`) * 46
    let x = 0
    let y = 0
    for (let attempt = 0; attempt < 20; attempt++) {
      // 아래쪽(고양이 몸통 방향)보다 위쪽으로 더 넓게 퍼지도록, -90°(정면 위)를 중심으로 좌우
      // 약 ±70°(라디안 -2.8~-0.3) 범위의 위쪽 반원 호 안에서만 각도를 뽑는다
      const t = i / (POP_ITEMS.length - 1)
      const angle = -2.8 + t * 2.5 + (random(`${seed}-a-${attempt}`) - 0.5) * 0.35
      const radius = 170 + random(`${seed}-r-${attempt}`) * 260
      const rawX = CAT_X + Math.cos(angle) * radius - size / 2
      const rawY = BURST_CENTER_Y + Math.sin(angle) * radius * 0.8 - size / 2
      x = Math.max(16, Math.min(1080 - size - 16, rawX))
      y = Math.max(16, Math.min(1920 - size - 16, rawY))
      const collidesOther = placed.some((p) => overlapsBox(x, y, size, toBox(p)))
      if (!overlapsBox(x, y, size, avoidZone) && !collidesOther) break
      // 마지막 시도까지 실패하면 노트 아래로 강제로 눌러 붙인다(안전장치)
      if (attempt === 19) y = Math.max(y, avoidZone.y1 + 10)
    }
    placed.push({ x, y, size })
  }
  return POP_ITEMS.map((name, i) => ({
    name,
    x: placed[i].x,
    y: placed[i].y,
    size: placed[i].size,
    rotate: (random(`burst-${i}-rot`) - 0.5) * 60,
    delay: Math.floor(random(`burst-${i}-d`) * 20),
  }))
}

/**
 * 유튜브 쇼츠 썸네일 2안(1080x1920 정지 이미지, still로 렌더).
 * 실제 랜딩 스크린샷을 원래 배율 그대로(늘리지 않고) 보여주고, 남는 좌우 공간은 실제 게임
 * 배경 이미지를 cover로 채워 더 넓게 쓴다. 고양이 위에는 grab 커서(잡을 수 있다는 표시)를
 * 크게 얹고, 뒷모습 고양이를 마구 쓰다듬은 것처럼 게임의 실제 PullCat 소품들이 고양이
 * 위쪽으로 서로 겹치지 않게 잔뜩 튀어나온 모습을 연출한다(타이틀·안내 문구는 가리지 않는다).
 */
export function Thumbnail2() {
  const decorations = burstDecorations()

  return (
    <AbsoluteFill style={{ background: '#f1dcc0' }}>
      {/* 스크린샷 좌우로 남는 공간을 실제 게임 배경(main.webp)으로 cover 채운다 */}
      <Img src={asset('backgrounds/main.webp')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <Img
        src={asset('screens/scene1-landing.png')}
        style={{ position: 'absolute', left: SHOT_LEFT, top: 0, width: SHOT_WIDTH, height: SHOT_HEIGHT }}
      />
      {decorations.map((d, i) => (
        <SpriteDeco key={i} {...d} />
      ))}
      {/* 고양이를 콕 찌르는 손가락 */}
      <span
        style={{
          position: 'absolute',
          left: CAT_X + 30,
          top: CAT_Y - 70,
          fontSize: 130,
          transform: 'rotate(12deg)',
          filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.35))',
        }}
      >
        👈
      </span>
    </AbsoluteFill>
  )
}
