import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { InteractionPoint } from '../../../types'
import { COLOR_BIOLUM, COLOR_DEEP, COLOR_LIGHT, COLOR_SURFACE } from './underwaterConstants'
import { BG_FRAG, BG_VERT } from './underwaterShaders'
import { UnderwaterHands } from './UnderwaterHands'
import { UnderwaterPlankton } from './UnderwaterPlankton'

export interface UnderwaterSceneProps {
  leftHand: InteractionPoint[]
  rightHand: InteractionPoint[]
  energy: number
  isCameraActive: boolean
}

function createCircleSprite(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,1.0)')
  grad.addColorStop(0.4, 'rgba(255,255,255,0.6)')
  grad.addColorStop(1, 'rgba(255,255,255,0.0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(canvas)
}

function createBubbleRingSprite(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 96
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
}

export function UnderwaterScene({ leftHand, rightHand, energy, isCameraActive }: UnderwaterSceneProps) {
  const bgUniforms = useMemo(() => ({ uTime: { value: 0 } }), [])
  const circleSprite = useMemo(createCircleSprite, [])
  const bubbleRingSprite = useMemo(createBubbleRingSprite, [])

  useFrame(({ clock, scene }) => {
    bgUniforms.uTime.value = clock.getElapsedTime()
    if (!scene.fog) scene.fog = new THREE.FogExp2(COLOR_DEEP, 0.045)
  })

  return (
    <>
      <ambientLight intensity={0.28} color={COLOR_SURFACE} />
      <pointLight position={[0, 3.2, 3]} intensity={2.4} color={COLOR_LIGHT} distance={8} />
      <pointLight position={[-3, 1.5, 2]} intensity={0.7} color={COLOR_BIOLUM} distance={7} />

      <mesh position={[0, 0, -4]} renderOrder={0}>
        <planeGeometry args={[30, 20]} />
        <shaderMaterial
          vertexShader={BG_VERT}
          fragmentShader={BG_FRAG}
          uniforms={bgUniforms}
          depthWrite={false}
        />
      </mesh>

      {!isCameraActive && (
        <UnderwaterPlankton
          leftHand={leftHand}
          rightHand={rightHand}
          energy={energy}
          circleSprite={circleSprite}
        />
      )}

      <UnderwaterHands
        leftHand={leftHand}
        rightHand={rightHand}
        energy={energy}
        circleSprite={circleSprite}
        bubbleRingSprite={bubbleRingSprite}
      />
    </>
  )
}
