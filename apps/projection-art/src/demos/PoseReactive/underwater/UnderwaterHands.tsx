import { useRef, useMemo, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { InteractionPoint } from '../../../types'
import {
  COLOR_LIGHT,
  COLOR_BIOLUM,
  COLOR_SURFACE,
  HAND_LINES,
  FINGERTIP_INDICES,
  INDEX_FINGER_TIP,
  HAND_FRAME_DOTS_PER_SEGMENT,
  FINGERTIP_TRAIL_LENGTH,
  FINGERTIP_TRAIL_COUNT,
  FINGERTIP_TRAIL_COLORS,
  BUBBLE_COUNT,
} from './underwaterConstants'

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────
function toWorld(x: number, y: number, vw: number, vh: number): [number, number] {
  return [(x - 0.5) * vw, -(y - 0.5) * vh]
}

function toBubbleCenter(pt: InteractionPoint, vw: number, vh: number): [number, number] {
  return toWorld(pt.x, pt.y, vw, vh)
}

function seededRandom(seed: number): number {
  const s = Math.sin(seed * 9301.0 + 49297.0) * 233280.0
  return s - Math.floor(s)
}

// ─── 타입 ────────────────────────────────────────────────────────────────────
interface UnderwaterHandsProps {
  leftHand:     InteractionPoint[]
  rightHand:    InteractionPoint[]
  energy:       number
  circleSprite: THREE.Texture
  bubbleRingSprite: THREE.Texture
}

export function UnderwaterHands({
  leftHand,
  rightHand,
  energy,
  circleSprite,
  bubbleRingSprite,
}: UnderwaterHandsProps) {
  const { viewport } = useThree()

  // ── 손 프레임 refs ──────────────────────────────────────────────────────────
  const leftHandFrameGlowGeoRef  = useRef<THREE.BufferGeometry | null>(null)
  const rightHandFrameGlowGeoRef = useRef<THREE.BufferGeometry | null>(null)
  const leftHandFrameCoreGeoRef  = useRef<THREE.BufferGeometry | null>(null)
  const rightHandFrameCoreGeoRef = useRef<THREE.BufferGeometry | null>(null)

  // ── 손끝 거품 refs ──────────────────────────────────────────────────────────
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

  const bubbleData = useMemo(() => {
    const seeds = new Float32Array(BUBBLE_COUNT)
    for (let i = 0; i < BUBBLE_COUNT; i++) seeds[i] = seededRandom(i * 11 + 7)
    return { seeds }
  }, [])
  const bubbleGeoRef = useRef<THREE.BufferGeometry | null>(null)

  useFrame(({ clock }) => {
    const vw = viewport.width
    const vh = viewport.height
    const t  = clock.getElapsedTime()

    // ── 손 dotted frame geometry 업데이트 ────────────────────────────────────
    const updateHandFrameDots = (
      handPts: InteractionPoint[],
      frameGeoRef: MutableRefObject<THREE.BufferGeometry | null>
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

    // ── 손끝 trail 업데이트 ────────────────────────────────────────────────────
    ;[leftHand, rightHand].forEach((handPts, handIdx) => {
      const isHandActive = handPts.length >= 21
      FINGERTIP_INDICES.forEach((tipIdx, fingerIdx) => {
        const trailIdx = handIdx * FINGERTIP_INDICES.length + fingerIdx
        const ring = fingertipTrailRingRef.current[trailIdx]

        if (isHandActive && handPts[tipIdx]) {
          const [tx, ty] = toBubbleCenter(handPts[tipIdx], vw, vh)
          const head = fingertipTrailHeadRef.current[trailIdx]
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

    // ── 손끝 거품 업데이트 ────────────────────────────────────────────────────
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

    // ── 손끝 거품 instanced pulse ─────────────────────────────────────────────
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

      {/* 5a. 손끝 trail */}
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

      {/* 5b. 손끝 거품 */}
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

      {/* 6. 손끝 거품 본체 — instanced pulse */}
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

      {/* 7. 검지 거품 halo */}
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
