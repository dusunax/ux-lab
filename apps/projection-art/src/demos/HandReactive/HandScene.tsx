import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { InteractionPoint } from '../../types'

const FINGER_TIP_INDICES = [4, 8, 12, 16, 20] as const
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
]

const TRAIL_LENGTH = 24
const PARTICLES_PER_TIP = TRAIL_LENGTH
const MAX_HANDS = 2

const HAND_JOINT_COLORS = ['#e0f0ff', '#ffe0c0'] as const
const HAND_SKELETON_COLORS = ['#2a3d55', '#55382a'] as const
const HAND_TRAIL_COLORS = [
  [0xff6b6b, 0x00ffff, 0x69ff47, 0xffd93d, 0xff6fff] as const,
  [0xff9944, 0xffdd44, 0xff6644, 0xffaa22, 0xffcc66] as const,
] as const

interface TrailState {
  positions: Float32Array
  head: number
  count: number
}

function makeTrail(): TrailState {
  return { positions: new Float32Array(TRAIL_LENGTH * 3), head: 0, count: 0 }
}

function clearTrail(trail: TrailState) {
  trail.head = 0
  trail.count = 0
}

function toWorld(x: number, y: number, vw: number, vh: number): [number, number] {
  return [(x - 0.5) * vw, -(y - 0.5) * vh]
}

interface HandSceneProps {
  hands: InteractionPoint[][]
}

export function HandScene({ hands }: HandSceneProps) {
  const { viewport } = useThree()

  const trailsRef = useRef<TrailState[]>(
    Array.from({ length: MAX_HANDS * FINGER_TIP_INDICES.length }, () => makeTrail())
  )
  const trailGeosRef = useRef<THREE.BufferGeometry[]>([])
  const skeletonGeosRef = useRef<(THREE.BufferGeometry | null)[]>([null, null])
  const meshesRef = useRef<(THREE.InstancedMesh | null)[]>([null, null])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(() => {
    const vw = viewport.width
    const vh = viewport.height

    for (let handIdx = 0; handIdx < MAX_HANDS; handIdx++) {
      const hand = hands[handIdx] ?? []
      const isActive = hand.length === 21

      FINGER_TIP_INDICES.forEach((tipIdx, fi) => {
        const trailIdx = handIdx * FINGER_TIP_INDICES.length + fi
        const trail = trailsRef.current[trailIdx]

        if (isActive) {
          const pt = hand[tipIdx]
          const [wx, wy] = toWorld(pt.x, pt.y, vw, vh)
          const base = trail.head * 3
          trail.positions[base] = wx
          trail.positions[base + 1] = wy
          trail.positions[base + 2] = 0
          trail.head = (trail.head + 1) % TRAIL_LENGTH
          if (trail.count < TRAIL_LENGTH) trail.count++
        } else {
          clearTrail(trail)
        }

        const geo = trailGeosRef.current[trailIdx]
        if (geo) {
          geo.setAttribute('position', new THREE.BufferAttribute(trail.positions.slice(), 3))
          geo.setDrawRange(0, trail.count)
        }
      })

      const mesh = meshesRef.current[handIdx]
      if (mesh) {
        if (isActive) {
          hand.forEach((pt, i) => {
            const [wx, wy] = toWorld(pt.x, pt.y, vw, vh)
            const isTip = (FINGER_TIP_INDICES as readonly number[]).includes(i)
            dummy.position.set(wx, wy, 0)
            dummy.scale.setScalar(isTip ? 0.14 : 0.07)
            dummy.updateMatrix()
            mesh.setMatrixAt(i, dummy.matrix)
          })
          mesh.count = 21
        } else {
          mesh.count = 0
        }
        mesh.instanceMatrix.needsUpdate = true
      }

      const skelGeo = skeletonGeosRef.current[handIdx]
      if (skelGeo && isActive) {
        const positions = new Float32Array(HAND_CONNECTIONS.length * 2 * 3)
        HAND_CONNECTIONS.forEach(([a, b], ci) => {
          const pa = hand[a], pb = hand[b]
          if (!pa || !pb) return
          const [ax, ay] = toWorld(pa.x, pa.y, vw, vh)
          const [bx, by] = toWorld(pb.x, pb.y, vw, vh)
          const base = ci * 6
          positions[base] = ax; positions[base + 1] = ay; positions[base + 2] = 0
          positions[base + 3] = bx; positions[base + 4] = by; positions[base + 5] = 0
        })
        skelGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      }
    }
  })

  return (
    <>
      <color attach="background" args={['#000005']} />
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 3]} intensity={2} color="#0af" />

      {([0, 1] as const).map(handIdx => (
        <group key={handIdx}>
          <instancedMesh
            ref={el => { meshesRef.current[handIdx] = el }}
            args={[undefined, undefined, 21]}
            renderOrder={2}
          >
            <sphereGeometry args={[1, 12, 12]} />
            <meshBasicMaterial color={HAND_JOINT_COLORS[handIdx]} toneMapped={false} />
          </instancedMesh>

          <lineSegments renderOrder={0}>
            <bufferGeometry ref={geo => { skeletonGeosRef.current[handIdx] = geo }}>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array(HAND_CONNECTIONS.length * 6), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={HAND_SKELETON_COLORS[handIdx]}
              transparent
              opacity={0.6}
              toneMapped={false}
            />
          </lineSegments>
        </group>
      ))}

      {([0, 1] as const).map(handIdx =>
        FINGER_TIP_INDICES.map((_, fi) => {
          const trailIdx = handIdx * FINGER_TIP_INDICES.length + fi
          return (
            <points key={`${handIdx}-${fi}`} renderOrder={3}>
              <bufferGeometry
                ref={geo => { if (geo) trailGeosRef.current[trailIdx] = geo }}
              >
                <bufferAttribute
                  attach="attributes-position"
                  args={[new Float32Array(PARTICLES_PER_TIP * 3), 3]}
                />
              </bufferGeometry>
              <pointsMaterial
                color={new THREE.Color(HAND_TRAIL_COLORS[handIdx][fi])}
                size={0.06}
                transparent
                opacity={0.8}
                sizeAttenuation
                toneMapped={false}
              />
            </points>
          )
        })
      )}
    </>
  )
}
