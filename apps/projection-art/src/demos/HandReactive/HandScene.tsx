import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { InteractionPoint } from '../../types'

// Finger tip landmark indices for MediaPipe Hands (21-point model)
const FINGER_TIP_INDICES = [4, 8, 12, 16, 20] as const
const FINGER_COLORS = [0xff6b6b, 0x00ffff, 0x69ff47, 0xffd93d, 0xff6fff] as const

// Hand skeleton connections: [from, to]
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],      // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // index
  [0, 9], [9, 10], [10, 11], [11, 12],  // middle
  [0, 13], [13, 14], [14, 15], [15, 16], // ring
  [0, 17], [17, 18], [18, 19], [19, 20], // pinky
  [5, 9], [9, 13], [13, 17],            // palm cross
]

const TRAIL_LENGTH = 24
const PARTICLES_PER_TIP = TRAIL_LENGTH

interface TrailState {
  positions: Float32Array
  head: number
  count: number
}

function makeTrail(): TrailState {
  return { positions: new Float32Array(TRAIL_LENGTH * 3), head: 0, count: 0 }
}

// Converts normalized [0,1] point to world space
function toWorld(x: number, y: number, vw: number, vh: number): [number, number] {
  return [(x - 0.5) * vw, -(y - 0.5) * vh]
}

interface HandSceneProps {
  points: InteractionPoint[]
}

export function HandScene({ points }: HandSceneProps) {
  const { viewport } = useThree()
  const trailsRef = useRef<TrailState[]>(FINGER_TIP_INDICES.map(() => makeTrail()))
  const trailGeosRef = useRef<THREE.BufferGeometry[]>([])
  const skeletonGeoRef = useRef<THREE.BufferGeometry | null>(null)
  const landmarkMeshesRef = useRef<THREE.InstancedMesh | null>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const isHandMode = points.length === 21

  useFrame(() => {
    const vw = viewport.width
    const vh = viewport.height

    // Update finger tip trails
    FINGER_TIP_INDICES.forEach((tipIdx, fi) => {
      const pt = isHandMode ? points[tipIdx] : points[0]
      if (!pt) return
      const trail = trailsRef.current[fi]
      const [wx, wy] = toWorld(pt.x, pt.y, vw, vh)
      const base = trail.head * 3
      trail.positions[base] = wx
      trail.positions[base + 1] = wy
      trail.positions[base + 2] = 0
      trail.head = (trail.head + 1) % TRAIL_LENGTH
      if (trail.count < TRAIL_LENGTH) trail.count++

      const geo = trailGeosRef.current[fi]
      if (geo) {
        geo.setAttribute('position', new THREE.BufferAttribute(trail.positions.slice(), 3))
        geo.setDrawRange(0, trail.count)
      }
    })

    // Update landmark instanced mesh positions
    const mesh = landmarkMeshesRef.current
    if (mesh) {
      if (isHandMode) {
        points.forEach((pt, i) => {
          const [wx, wy] = toWorld(pt.x, pt.y, vw, vh)
          const isTip = FINGER_TIP_INDICES.includes(i as typeof FINGER_TIP_INDICES[number])
          dummy.position.set(wx, wy, 0)
          dummy.scale.setScalar(isTip ? 0.14 : 0.07)
          dummy.updateMatrix()
          mesh.setMatrixAt(i, dummy.matrix)
        })
        mesh.count = 21
      } else if (points[0]) {
        const [wx, wy] = toWorld(points[0].x, points[0].y, vw, vh)
        dummy.position.set(wx, wy, 0)
        dummy.scale.setScalar(0.18)
        dummy.updateMatrix()
        mesh.setMatrixAt(0, dummy.matrix)
        mesh.count = 1
      }
      mesh.instanceMatrix.needsUpdate = true
    }

    // Update skeleton lines
    const skelGeo = skeletonGeoRef.current
    if (skelGeo && isHandMode) {
      const positions = new Float32Array(HAND_CONNECTIONS.length * 2 * 3)
      HAND_CONNECTIONS.forEach(([a, b], ci) => {
        const pa = points[a], pb = points[b]
        if (!pa || !pb) return
        const [ax, ay] = toWorld(pa.x, pa.y, vw, vh)
        const [bx, by] = toWorld(pb.x, pb.y, vw, vh)
        const base = ci * 6
        positions[base] = ax; positions[base + 1] = ay; positions[base + 2] = 0
        positions[base + 3] = bx; positions[base + 4] = by; positions[base + 5] = 0
      })
      skelGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    }
  })

  return (
    <>
      <color attach="background" args={['#000005']} />

      {/* Ambient glow */}
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 3]} intensity={2} color="#0af" />

      {/* Landmark instanced mesh */}
      <instancedMesh
        ref={landmarkMeshesRef}
        args={[undefined, undefined, 21]}
        renderOrder={2}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>

      {/* Glow halos at each finger tip */}
      {isHandMode && FINGER_TIP_INDICES.map((tipIdx, fi) => {
        const pt = points[tipIdx]
        if (!pt) return null
        const color = new THREE.Color(FINGER_COLORS[fi])
        return (
          <mesh key={fi} renderOrder={1}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshBasicMaterial color={color} transparent opacity={0.25} toneMapped={false} />
          </mesh>
        )
      })}

      {/* Skeleton lines */}
      {isHandMode && (
        <lineSegments renderOrder={0}>
          <bufferGeometry ref={skelGeoRef => { skeletonGeoRef.current = skelGeoRef }}>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(HAND_CONNECTIONS.length * 6), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#334455" transparent opacity={0.6} toneMapped={false} />
        </lineSegments>
      )}

      {/* Particle trails */}
      {FINGER_TIP_INDICES.map((_, fi) => (
        <points key={fi} renderOrder={3}>
          <bufferGeometry
            ref={geo => {
              if (geo) trailGeosRef.current[fi] = geo
            }}
          >
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(PARTICLES_PER_TIP * 3), 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            color={new THREE.Color(FINGER_COLORS[fi])}
            size={isHandMode ? 0.06 : 0.1}
            transparent
            opacity={0.8}
            sizeAttenuation
            toneMapped={false}
          />
        </points>
      ))}
    </>
  )
}
