import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { InteractionPoint } from '../../../types'

// ─── 팔레트 상수 ────────────────────────────────────────────────────────────
const COLOR_DEEP    = '#000000'
const COLOR_LIGHT   = '#caf0f8'
const COLOR_SPREAD  = '#00b4d8'
const COLOR_SURFACE = '#90e0ef'
const COLOR_BIOLUM  = '#80ffdb'

// ─── 손 전체 연결 (MediaPipe Hands 21 landmarks) ────────────────────────────
const HAND_LINES: [number, number][] = [
  // 엄지
  [0, 1], [1, 2], [2, 3], [3, 4],
  // 검지
  [0, 5], [5, 6], [6, 7], [7, 8],
  // 중지
  [0, 9], [9, 10], [10, 11], [11, 12],
  // 약지
  [0, 13], [13, 14], [14, 15], [15, 16],
  // 소지
  [0, 17], [17, 18], [18, 19], [19, 20],
  // 손바닥
  [5, 9], [9, 13], [13, 17],
]

// ─── 손가락 끝 포인트 인덱스 ─────────────────────────────────────────────────
const FINGERTIP_INDICES = [4, 8, 12, 16, 20] as const
const INDEX_FINGER_TIP = 8

// ─── Trail / dotted frame 설정 ───────────────────────────────────────────────
const HAND_FRAME_DOTS_PER_SEGMENT = 7
const FINGERTIP_TRAIL_LENGTH = 52
const FINGERTIP_TRAIL_COUNT = FINGERTIP_INDICES.length * 2
const FINGERTIP_TRAIL_COLORS = [
  COLOR_LIGHT,
  COLOR_BIOLUM,
  COLOR_SURFACE,
  COLOR_BIOLUM,
  COLOR_LIGHT,
] as const

// ─── 파티클 ──────────────────────────────────────────────────────────────────
const PLANKTON_COUNT   = 400
const PLANKTON_RISE    = 0.0003
const PLANKTON_PUSH_R  = 100
const PLANKTON_PUSH_F  = 0.3
const BIOLUM_ENERGY_TH = 0.6
const BIOLUM_MAX_RATIO = 0.3
const BUBBLE_COUNT     = 6

// ─── 배경 GLSL ───────────────────────────────────────────────────────────────
const BG_VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const BG_FRAG = /* glsl */`
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;

    // 색상 팔레트
    vec3 black = vec3(0.0, 0.0, 0.0);
    vec3 deep  = vec3(0.002, 0.006, 0.020); // projection black with slight blue depth
    vec3 mid   = vec3(0.000, 0.467, 0.714); // #0077b6
    vec3 light = vec3(0.000, 0.706, 0.847); // #00b4d8
    vec3 surf  = vec3(0.565, 0.878, 0.937); // #90e0ef
    vec3 glow  = vec3(0.792, 0.941, 0.973); // #caf0f8

    // 블롭 1 — 왼쪽 상단, 청록
    vec2 b1 = vec2(0.25 + sin(uTime * 0.07) * 0.12, 0.72 + cos(uTime * 0.05) * 0.10);
    float d1 = length(uv - b1);
    float w1 = smoothstep(0.55, 0.0, d1);

    // 블롭 2 — 오른쪽 중단, 딥 블루
    vec2 b2 = vec2(0.75 + cos(uTime * 0.06) * 0.10, 0.45 + sin(uTime * 0.08) * 0.12);
    float d2 = length(uv - b2);
    float w2 = smoothstep(0.50, 0.0, d2);

    // 블롭 3 — 하단 중앙, 딥 네이비
    vec2 b3 = vec2(0.50 + sin(uTime * 0.04) * 0.15, 0.20 + cos(uTime * 0.06) * 0.08);
    float d3 = length(uv - b3);
    float w3 = smoothstep(0.60, 0.0, d3);

    // 블롭 4 — 상단 오른쪽, 서피스 글로우
    vec2 b4 = vec2(0.80 + cos(uTime * 0.09) * 0.08, 0.85 + sin(uTime * 0.07) * 0.06);
    float d4 = length(uv - b4);
    float w4 = smoothstep(0.40, 0.0, d4);

    // 블롭 5 — 왼쪽 하단, mid
    vec2 b5 = vec2(0.15 + sin(uTime * 0.05) * 0.08, 0.30 + cos(uTime * 0.09) * 0.10);
    float d5 = length(uv - b5);
    float w5 = smoothstep(0.45, 0.0, d5);

    // 중앙 radial glow: 흰 벽 프로젝션 기준, 바깥은 검정으로 빠르게 감쇠
    vec2 center = vec2(0.50 + sin(uTime * 0.08) * 0.025, 0.52 + cos(uTime * 0.07) * 0.020);
    float radial = 1.0 - smoothstep(0.08, 0.64, length(uv - center));
    float softCore = 1.0 - smoothstep(0.00, 0.24, length(uv - center));
    vec3 col = mix(black, deep, radial * 0.65);
    col += mid * radial * 0.16;
    col += light * softCore * 0.32;
    col += glow * softCore * 0.18;

    // 블롭 합성 (소프트 블렌딩)
    col = mix(col, light, w1 * 0.08 * radial);
    col = mix(col, deep,  w2 * 0.28);
    col = mix(col, deep,  w3 * 0.35);
    col = mix(col, glow,  w4 * 0.06 * radial);
    col = mix(col, mid,   w5 * 0.06 * radial);

    // 수온약층: 수평 노이즈 밴드 (얇게)
    float n = sin(uv.x * 5.2 + uTime * 0.05) * 0.010
            + sin(uv.x * 2.7 - uTime * 0.03) * 0.006;
    float band = smoothstep(0.33 + n, 0.36 + n, uv.y)
               * (1.0 - smoothstep(0.36 + n, 0.40 + n, uv.y));
    col *= mix(1.0, 0.78, band * 0.45);

    // Caustic light rays — 검정 프로젝션 위에서 더 화사하게 떠오르는 빛
    float rays = 0.0;
    for (int i = 0; i < 7; i++) {
      float fi   = float(i);
      float rx   = 0.06 + fi * 0.145 + sin(uTime * 0.20 + fi * 1.4) * 0.055;
      float dist = abs(uv.x - rx);
      float fade = max(0.0, 1.0 - (1.0 - uv.y) / (0.72 + fi * 0.030));
      float ray = max(0.0, (0.026 - dist) / 0.026);
      rays += ray * ray * fade;
    }
    col += vec3(rays * 0.30, rays * 0.58, rays * 0.68) * radial;

    // 부드러운 caustic shimmer patches
    float caustic = 0.0;
    caustic += pow(max(0.0, sin((uv.x * 18.0 + sin(uv.y * 6.0 + uTime * 0.35)) + uTime * 0.55)), 7.0);
    caustic += pow(max(0.0, sin((uv.x * 11.0 - uv.y * 4.0) - uTime * 0.42)), 9.0);
    caustic *= smoothstep(0.18, 0.92, uv.y) * 0.12 * radial;
    col += vec3(caustic * 0.52, caustic * 1.05, caustic * 1.15);

    // 수면 쪽 밝은 빛 번짐 + 아래쪽 fog darkening
    float surfaceGlow = smoothstep(0.42, 1.0, uv.y) * radial;
    col += glow * surfaceGlow * 0.075;
    col *= mix(0.012, 1.0, radial);

    // 물 흐름 같은 아주 느린 유기적 vignette
    float current = sin((uv.x + uv.y) * 9.0 + uTime * 0.18) * 0.5 + 0.5;
    col += vec3(0.0, 0.080, 0.105) * current * 0.040 * radial;
    col *= 1.0 - smoothstep(0.42, 0.70, length(uv - center)) * 0.94;
    col = min(col, vec3(0.20, 0.46, 0.52));

    gl_FragColor = vec4(col, 1.0);
  }
`

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────
function toWorld(x: number, y: number, vw: number, vh: number): [number, number] {
  return [(x - 0.5) * vw, -(y - 0.5) * vh]
}

function toBubbleCenter(pt: InteractionPoint, vw: number, vh: number): [number, number] {
  const [wx, wy] = toWorld(pt.x, pt.y, vw, vh)
  return [wx, wy]
}

function seededRandom(seed: number): number {
  const s = Math.sin(seed * 9301.0 + 49297.0) * 233280.0
  return s - Math.floor(s)
}

// ─── 타입 ────────────────────────────────────────────────────────────────────
export interface UnderwaterSceneProps {
  leftHand:  InteractionPoint[]
  rightHand: InteractionPoint[]
  energy:    number
  isCameraActive: boolean
}

// ─── 컴포넌트 ────────────────────────────────────────────────────────────────
export function UnderwaterScene({ leftHand, rightHand, energy, isCameraActive }: UnderwaterSceneProps) {
  const { viewport, size } = useThree()
  const isActive = leftHand.length > 0 || rightHand.length > 0

  // ── 배경 uniform ────────────────────────────────────────────────────────────
  const bgUniforms = useMemo(
    () => ({ uTime: { value: 0 } }),
    []
  )

  // ── 원형 스프라이트 텍스처 ──────────────────────────────────────────────────
  const circleSprite = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width  = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    grad.addColorStop(0,   'rgba(255,255,255,1.0)')
    grad.addColorStop(0.4, 'rgba(255,255,255,0.6)')
    grad.addColorStop(1,   'rgba(255,255,255,0.0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 64, 64)
    return new THREE.CanvasTexture(canvas)
  }, [])

  // ── 실제 거품 느낌: 밝은 테두리 + 어두운 내부 ─────────────────────────────
  const bubbleRingSprite = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width  = 96
    canvas.height = 96
    const ctx = canvas.getContext('2d')!
    const grad = ctx.createRadialGradient(48, 48, 0, 48, 48, 48)
    grad.addColorStop(0.00, 'rgba(255,255,255,0.00)')
    grad.addColorStop(0.45, 'rgba(255,255,255,0.03)')
    grad.addColorStop(0.66, 'rgba(180,245,255,0.18)')
    grad.addColorStop(0.78, 'rgba(230,255,255,0.95)')
    grad.addColorStop(0.88, 'rgba(128,255,219,0.45)')
    grad.addColorStop(1.00, 'rgba(255,255,255,0.00)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 96, 96)
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.beginPath()
    ctx.arc(35, 32, 4.5, 0, Math.PI * 2)
    ctx.fill()
    return new THREE.CanvasTexture(canvas)
  }, [])

  // ── 플랑크톤 초기화 (랜덤 시드 고정) ───────────────────────────────────────
  const planktonData = useMemo(() => {
    const xs    = new Float32Array(PLANKTON_COUNT)
    const ys    = new Float32Array(PLANKTON_COUNT)
    const seeds = new Float32Array(PLANKTON_COUNT)
    for (let i = 0; i < PLANKTON_COUNT; i++) {
      xs[i]    = seededRandom(i * 3)
      ys[i]    = seededRandom(i * 3 + 1)
      seeds[i] = seededRandom(i * 3 + 2)
    }
    return { xs, ys, seeds }
  }, [])

  const planktonGeoRef   = useRef<THREE.BufferGeometry | null>(null)
  const planktonColorRef = useRef<THREE.BufferAttribute | null>(null)

  // ── 손끝 거품 데이터 ──────────────────────────────────────────────────────
  const bubbleData = useMemo(() => {
    const seeds = new Float32Array(BUBBLE_COUNT)
    for (let i = 0; i < BUBBLE_COUNT; i++) seeds[i] = seededRandom(i * 11 + 7)
    return { seeds }
  }, [])
  const bubbleGeoRef = useRef<THREE.BufferGeometry | null>(null)

  // ── 손 프레임 refs (선 대신 dotted skeleton) ───────────────────────────────
  const leftHandFrameGlowGeoRef  = useRef<THREE.BufferGeometry | null>(null)
  const rightHandFrameGlowGeoRef = useRef<THREE.BufferGeometry | null>(null)
  const leftHandFrameCoreGeoRef  = useRef<THREE.BufferGeometry | null>(null)
  const rightHandFrameCoreGeoRef = useRef<THREE.BufferGeometry | null>(null)

  // ── 손가락 끝 거품 refs ────────────────────────────────────────────────────
  const fingertipBubbleMeshRef = useRef<THREE.InstancedMesh | null>(null)
  const indexHaloMeshRef = useRef<THREE.InstancedMesh | null>(null)
  const bubbleDummy = useMemo(() => new THREE.Object3D(), [])

  const fingertipTrailRingRef = useRef<Float32Array[]>(
    Array.from({ length: FINGERTIP_TRAIL_COUNT }, () => new Float32Array(FINGERTIP_TRAIL_LENGTH * 3))
  )
  const fingertipTrailHeadRef = useRef<number[]>(Array.from({ length: FINGERTIP_TRAIL_COUNT }, () => 0))
  const fingertipTrailCountRef = useRef<number[]>(Array.from({ length: FINGERTIP_TRAIL_COUNT }, () => 0))
  const fingertipTrailGeoRefs = useRef<(THREE.BufferGeometry | null)[]>(
    Array.from({ length: FINGERTIP_TRAIL_COUNT }, () => null)
  )

  // ─── useFrame ────────────────────────────────────────────────────────────────
  useFrame(({ clock, scene }) => {
    const vw = viewport.width
    const vh = viewport.height
    const t  = clock.getElapsedTime()

    bgUniforms.uTime.value = t
    if (!scene.fog) scene.fog = new THREE.FogExp2(COLOR_DEEP, 0.045)

    // ── 플랑크톤 업데이트 ───────────────────────────────────────────────────
    const geo = planktonGeoRef.current
    if (geo) {
      const { xs, ys, seeds } = planktonData
      const biolumRatio = Math.min(
        1,
        Math.max(0, (energy - BIOLUM_ENERGY_TH) / (1 - BIOLUM_ENERGY_TH))
      )
      const pxPerUnit = size.width / vw
      const fingertipWorlds = [leftHand, rightHand].flatMap(hand =>
        FINGERTIP_INDICES
          .map(idx => hand[idx])
          .filter((pt): pt is InteractionPoint => Boolean(pt))
          .map(pt => toWorld(pt.x, pt.y, vw, vh))
      )
      const pushR = PLANKTON_PUSH_R / pxPerUnit

      const positions  = new Float32Array(PLANKTON_COUNT * 3)
      const colorsData = new Float32Array(PLANKTON_COUNT * 3)
      const colorBase  = new THREE.Color(COLOR_SURFACE)
      const colorBio   = new THREE.Color(COLOR_BIOLUM)

      for (let i = 0; i < PLANKTON_COUNT; i++) {
        // 수중 유영: y 상승 + sin 곡선 좌우 drift
        ys[i] += PLANKTON_RISE
        xs[i] += Math.sin(ys[i] * 8.0 + seeds[i] * 6.28 + t * 0.3) * 0.0003

        if (ys[i] > 1.0) {
          ys[i] = 0
          xs[i] = seededRandom(i * 3 + t)
        }

        let wx = (xs[i] - 0.5) * vw
        let wy = (ys[i] - 0.5) * vh
        let wz = -0.25 - seeds[i] * 1.8

        fingertipWorlds.forEach(([fx, fy]) => {
          const dx = wx - fx
          const dy = wy - fy
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d < pushR && d > 0.001) {
            const force = PLANKTON_PUSH_F * (1 - d / pushR)
            wx += (dx / d) * force * (0.008 + energy * 0.012) * vw
            wy += (dy / d) * force * (0.006 + energy * 0.010) * vh
            wz += force * 0.25
          }
        })

        positions[i * 3]     = wx
        positions[i * 3 + 1] = wy
        positions[i * 3 + 2] = wz

        const isBio = seeds[i] < biolumRatio * BIOLUM_MAX_RATIO
        const c = isBio ? colorBio : colorBase
        colorsData[i * 3]     = c.r
        colorsData[i * 3 + 1] = c.g
        colorsData[i * 3 + 2] = c.b
      }

      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geo.setDrawRange(0, PLANKTON_COUNT)

      if (!planktonColorRef.current) {
        const colorAttr = new THREE.BufferAttribute(colorsData, 3)
        geo.setAttribute('color', colorAttr)
        planktonColorRef.current = colorAttr
      } else {
        planktonColorRef.current.copyArray(colorsData)
        planktonColorRef.current.needsUpdate = true
      }
    }

    // ── 손 dotted frame geometry 업데이트 ───────────────────────────────────
    const updateHandFrameDots = (
      handPts: InteractionPoint[],
      frameGeoRef: React.MutableRefObject<THREE.BufferGeometry | null>
    ) => {
      const frameGeo = frameGeoRef.current
      if (!frameGeo) return
      if (handPts.length > 0) {
        const positions = new Float32Array(HAND_LINES.length * HAND_FRAME_DOTS_PER_SEGMENT * 3)
        let writeIndex = 0
        HAND_LINES.forEach(([a, b], ci) => {
          const pa = handPts[a], pb = handPts[b]
          if (!pa || !pb) return
          const [ax, ay] = toWorld(pa.x, pa.y, vw, vh)
          const [bx, by] = toWorld(pb.x, pb.y, vw, vh)
          for (let dot = 0; dot < HAND_FRAME_DOTS_PER_SEGMENT; dot++) {
            const ratio = (dot + 0.5) / HAND_FRAME_DOTS_PER_SEGMENT
            const wave = Math.sin(t * 1.3 + ci * 0.4 + dot) * 0.006
            positions[writeIndex * 3] = ax + (bx - ax) * ratio + wave
            positions[writeIndex * 3 + 1] = ay + (by - ay) * ratio - wave * 0.6
            positions[writeIndex * 3 + 2] = 0.08
            writeIndex++
          }
        })
        frameGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        frameGeo.setDrawRange(0, writeIndex)
      } else {
        frameGeo.setDrawRange(0, 0)
      }
    }

    updateHandFrameDots(leftHand,  leftHandFrameGlowGeoRef)
    updateHandFrameDots(rightHand, rightHandFrameGlowGeoRef)
    updateHandFrameDots(leftHand,  leftHandFrameCoreGeoRef)
    updateHandFrameDots(rightHand, rightHandFrameCoreGeoRef)

    // ── Demo D 방식 손끝 trail 업데이트 (손끝 10개 각각) ────────────────────
    ;[leftHand, rightHand].forEach((handPts, handIdx) => {
      const isHandActive = handPts.length >= 21
      FINGERTIP_INDICES.forEach((tipIdx, fingerIdx) => {
        const trailIdx = handIdx * FINGERTIP_INDICES.length + fingerIdx
        const ring = fingertipTrailRingRef.current[trailIdx]

        if (isHandActive && handPts[tipIdx]) {
          const [tx, ty] = toBubbleCenter(handPts[tipIdx], vw, vh)
          const head = fingertipTrailHeadRef.current[trailIdx]
          const drift = Math.sin(t * 0.7 + trailIdx) * 0.018
          ring[head * 3] = tx
          ring[head * 3 + 1] = ty
          ring[head * 3 + 2] = 0.18 + fingerIdx * 0.018
          fingertipTrailHeadRef.current[trailIdx] = (head + 1) % FINGERTIP_TRAIL_LENGTH
          if (fingertipTrailCountRef.current[trailIdx] < FINGERTIP_TRAIL_LENGTH) {
            fingertipTrailCountRef.current[trailIdx]++
          }
        } else {
          fingertipTrailHeadRef.current[trailIdx] = 0
          fingertipTrailCountRef.current[trailIdx] = 0
        }

        const trailGeo = fingertipTrailGeoRefs.current[trailIdx]
        if (trailGeo) {
          trailGeo.setAttribute('position', new THREE.BufferAttribute(ring.slice(), 3))
          trailGeo.setDrawRange(0, fingertipTrailCountRef.current[trailIdx])
        }
      })
    })

    // ── 손끝 거품 업데이트 ─────────────────────────────────────────────────
    const bubbleGeo = bubbleGeoRef.current
    if (bubbleGeo) {
      const fingertips = [leftHand, rightHand].flatMap(hand =>
        [hand[INDEX_FINGER_TIP]]
          .filter((pt): pt is InteractionPoint => Boolean(pt))
        .map(pt => toBubbleCenter(pt, vw, vh))
      )
      if (fingertips.length > 0) {
        const positions = new Float32Array(BUBBLE_COUNT * 3)
        for (let i = 0; i < BUBBLE_COUNT; i++) {
          const seed = bubbleData.seeds[i]
          const tip = fingertips[Math.floor(seed * fingertips.length) % fingertips.length]
          const age = (t * (0.12 + energy * 0.42) + seed) % 1
          const angle = seed * Math.PI * 2 + t * (2.4 + energy * 2.2)
          const orbit = (0.105 + seed * 0.040) * (0.92 + energy * 0.18)
          const wobble = Math.sin(t * 6.0 + seed * 19.0) * 0.010
          positions[i * 3] = tip[0] + Math.cos(angle) * (orbit + wobble)
          positions[i * 3 + 1] = tip[1] + Math.sin(angle) * (orbit * 0.72 + wobble)
          positions[i * 3 + 2] = 0.12 + seed * 0.5
        }
        bubbleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        bubbleGeo.setDrawRange(0, BUBBLE_COUNT)
      } else {
        bubbleGeo.setDrawRange(0, 0)
      }
    }

    // ── 손끝 거품 instanced pulse: 뽀글뽀글 스케일 애니메이션 ────────────────
    const bubbleMesh = fingertipBubbleMeshRef.current
    if (bubbleMesh) {
      let count = 0
      ;[leftHand, rightHand].forEach((handPts, handIdx) => {
        FINGERTIP_INDICES.forEach((tipIdx, fingerIdx) => {
          const pt = handPts[tipIdx]
          if (!pt) return
          const [wx, wy] = toBubbleCenter(pt, vw, vh)
          const pulse = 1 + Math.sin(t * 5.8 + handIdx * 1.7 + fingerIdx * 0.9) * 0.18
          const wobble = 1 + Math.sin(t * 9.3 + fingerIdx * 1.3) * 0.06
          const isIndexFinger = FINGERTIP_INDICES[fingerIdx] === INDEX_FINGER_TIP
          const baseScale = isIndexFinger ? 0.18 + energy * 0.08 : 0.095 + energy * 0.035
          const scale = (baseScale + fingerIdx * 0.004) * pulse
          bubbleDummy.position.set(wx, wy, 0.38 + fingerIdx * 0.012)
          bubbleDummy.scale.set(scale * wobble, scale / wobble, scale)
          bubbleDummy.updateMatrix()
          bubbleMesh.setMatrixAt(count, bubbleDummy.matrix)
          count++
        })
      })
      bubbleMesh.count = count
      bubbleMesh.instanceMatrix.needsUpdate = true
    }

    const indexHaloMesh = indexHaloMeshRef.current
    if (indexHaloMesh) {
      let count = 0
      ;[leftHand, rightHand].forEach((handPts, handIdx) => {
        const pt = handPts[INDEX_FINGER_TIP]
        if (!pt) return
        const [wx, wy] = toBubbleCenter(pt, vw, vh)
        const pulse = 1 + Math.sin(t * 4.2 + handIdx * 1.5) * 0.16
        const scale = (0.34 + energy * 0.10) * pulse
        bubbleDummy.position.set(wx, wy, 0.34)
        bubbleDummy.scale.set(scale, scale, scale)
        bubbleDummy.updateMatrix()
        indexHaloMesh.setMatrixAt(count, bubbleDummy.matrix)
        count++
      })
      indexHaloMesh.count = count
      indexHaloMesh.instanceMatrix.needsUpdate = true
    }

  })

  return (
    <>
      <ambientLight intensity={0.28} color={COLOR_SURFACE} />
      <pointLight position={[0, 3.2, 3]} intensity={2.4} color={COLOR_LIGHT} distance={8} />
      <pointLight position={[-3, 1.5, 2]} intensity={0.7} color={COLOR_BIOLUM} distance={7} />

      {/* 1. 배경 쿼드 — GLSL organic blob ocean */}
      <mesh position={[0, 0, -4]} renderOrder={0}>
        <planeGeometry args={[30, 20]} />
        <shaderMaterial
          vertexShader={BG_VERT}
          fragmentShader={BG_FRAG}
          uniforms={bgUniforms}
          depthWrite={false}
        />
      </mesh>

      {/* 3. 플랑크톤 파티클 — 카메라 active 전 모달 배경에서만 표시 */}
      {!isCameraActive && (
        <points renderOrder={2} frustumCulled={false}>
          <bufferGeometry ref={geo => { planktonGeoRef.current = geo }}>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(PLANKTON_COUNT * 3), 3]}
            />
            <bufferAttribute
              attach="attributes-color"
              args={[new Float32Array(PLANKTON_COUNT * 3), 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            map={circleSprite}
            alphaTest={0.01}
            vertexColors
            size={0.06}
            transparent
            opacity={0.78}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </points>
      )}

      {/* 4a. 왼손 dotted frame glow outer */}
      <points renderOrder={3}>
        <bufferGeometry ref={geo => { leftHandFrameGlowGeoRef.current = geo }}>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(HAND_LINES.length * HAND_FRAME_DOTS_PER_SEGMENT * 3), 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          map={circleSprite}
          alphaTest={0.01}
          color={COLOR_BIOLUM}
          size={0.112}
          transparent
          opacity={0.32}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </points>

      {/* 4a-2. 왼손 dotted frame bright core */}
      <points renderOrder={4}>
        <bufferGeometry ref={geo => { leftHandFrameCoreGeoRef.current = geo }}>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(HAND_LINES.length * HAND_FRAME_DOTS_PER_SEGMENT * 3), 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          map={bubbleRingSprite}
          alphaTest={0.01}
          color={COLOR_LIGHT}
          size={0.062}
          transparent
          opacity={0.62}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </points>

      {/* 4b. 오른손 dotted frame glow outer */}
      <points renderOrder={3}>
        <bufferGeometry ref={geo => { rightHandFrameGlowGeoRef.current = geo }}>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(HAND_LINES.length * HAND_FRAME_DOTS_PER_SEGMENT * 3), 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          map={circleSprite}
          alphaTest={0.01}
          color={COLOR_BIOLUM}
          size={0.112}
          transparent
          opacity={0.32}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </points>

      {/* 4b-2. 오른손 dotted frame bright core */}
      <points renderOrder={4}>
        <bufferGeometry ref={geo => { rightHandFrameCoreGeoRef.current = geo }}>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(HAND_LINES.length * HAND_FRAME_DOTS_PER_SEGMENT * 3), 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          map={bubbleRingSprite}
          alphaTest={0.01}
          color={COLOR_LIGHT}
          size={0.062}
          transparent
          opacity={0.62}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </points>

      {/* 5a. Demo D 방식 손끝 trail — 손가락마다 따라오는 발광 입자 */}
      {Array.from({ length: FINGERTIP_TRAIL_COUNT }).map((_, trailIdx) => {
        const fingerIdx = trailIdx % FINGERTIP_INDICES.length
        const isIndexFinger = FINGERTIP_INDICES[fingerIdx] === INDEX_FINGER_TIP
        const color = FINGERTIP_TRAIL_COLORS[fingerIdx]
        return (
          <points key={`fingertip-trail-${trailIdx}`} renderOrder={5}>
            <bufferGeometry ref={geo => { if (geo) fingertipTrailGeoRefs.current[trailIdx] = geo }}>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array(FINGERTIP_TRAIL_LENGTH * 3), 3]}
              />
            </bufferGeometry>
            <pointsMaterial
              map={circleSprite}
              alphaTest={0.01}
              color={color}
              size={isIndexFinger ? 0.176 : 0.052 + fingerIdx * 0.006}
              transparent
              opacity={0.80}
              sizeAttenuation
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </points>
        )
      })}

      {/* 5b. 손끝 거품 — 손가락 끝에서 천천히 올라가는 작은 bubbles */}
      <points renderOrder={5}>
        <bufferGeometry ref={geo => { bubbleGeoRef.current = geo }}>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(BUBBLE_COUNT * 3), 3]}
          />
        </bufferGeometry>
            <pointsMaterial
              map={circleSprite}
              alphaTest={0.01}
          color={COLOR_LIGHT}
          size={0.082}
          transparent
          opacity={0.84}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </points>

      {/* 6. 손끝 거품 본체 — 프레임 거품보다 큰 뽀글뽀글 pulse */}
      <instancedMesh
        ref={el => { fingertipBubbleMeshRef.current = el }}
        args={[undefined, undefined, FINGERTIP_TRAIL_COUNT]}
        renderOrder={7}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={bubbleRingSprite}
          color={COLOR_LIGHT}
          transparent
          opacity={0.92}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* 7. 검지 거품 halo — 위성 빛 무리 뒤쪽의 부드러운 발광 링 */}
      <instancedMesh
        ref={el => { indexHaloMeshRef.current = el }}
        args={[undefined, undefined, 2]}
        renderOrder={8}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={bubbleRingSprite}
          color={COLOR_BIOLUM}
          transparent
          opacity={0.46}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
        />
      </instancedMesh>
    </>
  )
}
