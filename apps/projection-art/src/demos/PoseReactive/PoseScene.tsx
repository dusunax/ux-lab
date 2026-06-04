import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { InteractionPoint, VisualParams } from '../../types'

// MediaPipe Pose skeleton connections
const POSE_CONNECTIONS: [number, number][] = [
  // Face
  [0, 1], [0, 4], [1, 2], [2, 3], [3, 7], [4, 5], [5, 6], [6, 8],
  // Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Left arm
  [11, 13], [13, 15], [15, 17], [15, 19], [17, 19],
  // Right arm
  [12, 14], [14, 16], [16, 18], [16, 20], [18, 20],
  // Left leg
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  // Right leg
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
]

// Extremity indices for particle trails (hands, feet, head)
const TRAIL_JOINTS = [0, 15, 16, 27, 28] as const
const TRAIL_LENGTH = 30
const MAX_JOINTS = TRAIL_JOINTS.length

interface TrailState {
  positions: Float32Array
  head: number
  count: number
}

function makeTrail(): TrailState {
  return { positions: new Float32Array(TRAIL_LENGTH * 3), head: 0, count: 0 }
}

function toWorld(x: number, y: number, vw: number, vh: number): [number, number] {
  return [(x - 0.5) * vw, -(y - 0.5) * vh]
}

interface PoseSceneProps {
  pose: InteractionPoint[]
  visualParams: VisualParams
}

export function PoseScene({ pose, visualParams }: PoseSceneProps) {
  const { viewport } = useThree()
  const isActive = pose.length === 33

  const trailsRef = useRef<TrailState[]>(
    Array.from({ length: MAX_JOINTS }, () => makeTrail())
  )
  const trailGeosRef = useRef<THREE.BufferGeometry[]>([])
  const skeletonGeoRef = useRef<THREE.BufferGeometry | null>(null)
  const jointsGeoRef = useRef<THREE.BufferGeometry | null>(null)

  const primaryColor = useMemo(
    () => new THREE.Color(visualParams.primaryColor),
    [visualParams.primaryColor]
  )
  const accentColor = useMemo(
    () => new THREE.Color(visualParams.accentColor),
    [visualParams.accentColor]
  )

  useFrame(() => {
    const vw = viewport.width
    const vh = viewport.height

    // Update skeleton geometry
    if (skeletonGeoRef.current) {
      if (isActive) {
        const positions = new Float32Array(POSE_CONNECTIONS.length * 2 * 3)
        POSE_CONNECTIONS.forEach(([a, b], ci) => {
          const pa = pose[a], pb = pose[b]
          if (!pa || !pb) return
          const [ax, ay] = toWorld(pa.x, pa.y, vw, vh)
          const [bx, by] = toWorld(pb.x, pb.y, vw, vh)
          const base = ci * 6
          positions[base] = ax; positions[base + 1] = ay; positions[base + 2] = 0
          positions[base + 3] = bx; positions[base + 4] = by; positions[base + 5] = 0
        })
        skeletonGeoRef.current.setAttribute(
          'position', new THREE.BufferAttribute(positions, 3)
        )
      }
    }

    // Update joint point cloud
    if (jointsGeoRef.current) {
      if (isActive) {
        const positions = new Float32Array(33 * 3)
        pose.forEach((pt, i) => {
          const [wx, wy] = toWorld(pt.x, pt.y, vw, vh)
          positions[i * 3] = wx
          positions[i * 3 + 1] = wy
          positions[i * 3 + 2] = 0
        })
        jointsGeoRef.current.setAttribute(
          'position', new THREE.BufferAttribute(positions, 3)
        )
        jointsGeoRef.current.setDrawRange(0, 33)
      } else {
        jointsGeoRef.current.setDrawRange(0, 0)
      }
    }

    // Update extremity trails
    TRAIL_JOINTS.forEach((jointIdx, ti) => {
      const trail = trailsRef.current[ti]
      if (isActive) {
        const pt = pose[jointIdx]
        if (pt) {
          const [wx, wy] = toWorld(pt.x, pt.y, vw, vh)
          const base = trail.head * 3
          trail.positions[base] = wx
          trail.positions[base + 1] = wy
          trail.positions[base + 2] = 0
          trail.head = (trail.head + 1) % TRAIL_LENGTH
          if (trail.count < TRAIL_LENGTH) trail.count++
        }
      } else {
        trail.head = 0
        trail.count = 0
      }
      const geo = trailGeosRef.current[ti]
      if (geo) {
        geo.setAttribute('position', new THREE.BufferAttribute(trail.positions.slice(), 3))
        geo.setDrawRange(0, trail.count)
      }
    })
  })

  const trailSize = 0.05 + visualParams.effectIntensity * 0.08

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 4]} intensity={2} color={visualParams.primaryColor} />
      <pointLight position={[0, 2, 3]} intensity={1} color={visualParams.accentColor} />

      {/* Skeleton lines */}
      <lineSegments renderOrder={0}>
        <bufferGeometry ref={geo => { skeletonGeoRef.current = geo }}>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(POSE_CONNECTIONS.length * 6), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={primaryColor}
          transparent
          opacity={0.5 + visualParams.effectIntensity * 0.3}
          toneMapped={false}
        />
      </lineSegments>

      {/* Joint points */}
      <points renderOrder={2}>
        <bufferGeometry ref={geo => { jointsGeoRef.current = geo }}>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(33 * 3), 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={accentColor}
          size={0.1 + visualParams.particleDensity * 0.08}
          transparent
          opacity={0.9}
          sizeAttenuation
          toneMapped={false}
        />
      </points>

      {/* Extremity trails */}
      {TRAIL_JOINTS.map((_, ti) => (
        <points key={ti} renderOrder={3}>
          <bufferGeometry ref={geo => { if (geo) trailGeosRef.current[ti] = geo }}>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(TRAIL_LENGTH * 3), 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            color={ti === 0 ? accentColor : primaryColor}
            size={trailSize}
            transparent
            opacity={0.7}
            sizeAttenuation
            toneMapped={false}
          />
        </points>
      ))}
    </>
  )
}
