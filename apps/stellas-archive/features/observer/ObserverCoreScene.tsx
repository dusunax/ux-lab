import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type ObserverCoreSceneProps = {
  color: string;
  yaw: number;
  pitch: number;
  isPixelBurst: boolean;
  burstScale: number;
  dragOffsetX: number;
  dragOffsetY: number;
};

type OrbitTrack = {
  name: string;
  radius: number;
  tube: number;
  segments: number;
  rot: [number, number, number];
  speed: number;
  direction: number;
};

type GlitchState = {
  triggerAt: number;
  releaseAt: number;
  power: number;
  seed: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
};

export function ObserverCoreScene({
  color,
  yaw,
  pitch,
  isPixelBurst = false,
  burstScale = 1,
  dragOffsetX,
  dragOffsetY,
}: ObserverCoreSceneProps) {
  const coreRadius = 0.8;
  const shellRadius = 0.94;

  const coreColor = useMemo(() => {
    const next = color && color.trim() ? color : "rgb(128,210,255)";
    const parsed = new THREE.Color(next);
    return parsed;
  }, [color]);
  const safeColor = coreColor;

  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const coreInnerRef = useRef<THREE.Mesh>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const fogRef = useRef<THREE.Points>(null);
  const orbitARef = useRef<THREE.Group | null>(null);
  const orbitASpinRef = useRef<THREE.Group | null>(null);
  const orbitBRef = useRef<THREE.Group | null>(null);
  const orbitBSpinRef = useRef<THREE.Group | null>(null);
  const springRef = useRef({ vx: 0, vy: 0, x: 0, y: 0 });
  const glitchRef = useRef<GlitchState>({
    triggerAt: 0,
    releaseAt: 0,
    power: 0,
    seed: Math.random() * Math.PI * 2,
    offsetX: 0,
    offsetY: 0,
    offsetZ: 0,
  });

  const orbitTracks = useMemo<OrbitTrack[]>(
    () => [
      {
        name: "orbit-a",
        radius: shellRadius + 0.3,
        tube: 0.013,
        segments: 150,
        rot: [0, 0, 0],
        speed: 0.54,
        direction: 1,
      },
      {
        name: "orbit-b",
        radius: shellRadius + 0.2,
        tube: 0.011,
        segments: 150,
        rot: [0.7, 0, 0.5],
        speed: 0.42,
        direction: -1,
      },
    ],
    [],
  );

  const fogPositions = useMemo(() => {
    const count = 152;
    const data = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;
      const radius = 1.2 + Math.random() * 0.28;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      data[i3] = Math.sin(phi) * Math.cos(theta) * radius;
      data[i3 + 1] = Math.cos(phi) * radius;
      data[i3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
    }

    return data;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current || !coreRef.current || !coreInnerRef.current || !shellRef.current || !fogRef.current) {
      return;
    }

    const time = performance.now() * 0.001;
    const burstFactor = isPixelBurst ? 2.8 : 1;

    if (time >= glitchRef.current.triggerAt) {
      const duration = 0.12 + Math.random() * 0.12;
      glitchRef.current = {
        triggerAt: time + 0.5 + Math.random() * 1.8,
        releaseAt: time + duration,
        power: 0.008 + Math.random() * 0.014,
        seed: Math.random() * Math.PI * 2,
        offsetX: (Math.random() - 0.5) * 0.03,
        offsetY: (Math.random() - 0.5) * 0.03,
        offsetZ: (Math.random() - 0.5) * 0.03,
      };
    }

    const isGlitch = time < glitchRef.current.releaseAt;
    const glitchLerp = isGlitch
      ? Math.min(1, (glitchRef.current.releaseAt - time) / (glitchRef.current.releaseAt - glitchRef.current.triggerAt + 0.001))
      : 0;
    const jitter = glitchRef.current.power * glitchLerp * burstFactor;

    groupRef.current.rotation.set(
      THREE.MathUtils.degToRad(pitch) + glitchRef.current.offsetX * jitter,
      THREE.MathUtils.degToRad(yaw) + glitchRef.current.offsetY * jitter,
      Math.sin(time * 0.1) * 0.06 + glitchRef.current.offsetZ * jitter,
    );

    const dt = Math.min(delta, 0.05);
    const spring = 72;
    const damp = 9;
    const dx = dragOffsetX - springRef.current.x;
    const dy = dragOffsetY - springRef.current.y;
    springRef.current.vx += dx * spring * dt;
    springRef.current.vy += dy * spring * dt;
    springRef.current.vx *= 1 - damp * dt;
    springRef.current.vy *= 1 - damp * dt;
    springRef.current.x += springRef.current.vx * dt;
    springRef.current.y += springRef.current.vy * dt;

    groupRef.current.position.x = springRef.current.x;
    groupRef.current.position.y = springRef.current.y;
    groupRef.current.position.z = 0;

    const burstPulse = isPixelBurst
      ? 1 + Math.sin((time % 1) * Math.PI * 12) * 0.008 + (burstScale - 1) * 0.4
      : 1;
    const targetScale = isPixelBurst ? burstScale * burstPulse : 1;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.16);

    coreRef.current.rotation.y += delta * 0.95;
    coreRef.current.rotation.x += delta * 0.42;
    coreInnerRef.current.rotation.y -= delta * 0.56;
    coreInnerRef.current.rotation.x += delta * 0.22;
    shellRef.current.rotation.y -= delta * 0.22;
    if (orbitARef.current) {
      orbitARef.current.position.set(0, 0, 0);
      orbitARef.current.rotation.set(
        orbitTracks[0].rot[0],
        orbitTracks[0].rot[1] + time * orbitTracks[0].speed * orbitTracks[0].direction,
        orbitTracks[0].rot[2],
      );
    }
    if (orbitASpinRef.current) {
      orbitASpinRef.current.position.set(0, 0, 0);
      orbitASpinRef.current.rotation.set(0, 0, 0);
    }
    if (orbitBRef.current) {
      orbitBRef.current.position.set(0, 0, 0);
      orbitBRef.current.rotation.set(
        orbitTracks[1].rot[0],
        orbitTracks[1].rot[1] + time * orbitTracks[1].speed * orbitTracks[1].direction,
        orbitTracks[1].rot[2],
      );
    }
    if (orbitBSpinRef.current) {
      orbitBSpinRef.current.position.set(0, 0, 0);
      orbitBSpinRef.current.rotation.set(0, 0, 0);
    }

    fogRef.current.rotation.y += delta * 0.2;
    fogRef.current.rotation.x += delta * 0.15;

  });

  return (
    <group ref={groupRef}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[coreRadius, 64, 64]} />
        <meshBasicMaterial
          color={safeColor}
          toneMapped={false}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[shellRadius, 48, 48]} />
      <meshBasicMaterial
          color={safeColor}
          transparent
          opacity={0.05}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={coreInnerRef}>
        <sphereGeometry args={[0.62, 56, 56]} />
        <meshBasicMaterial
          color={safeColor}
          transparent
          opacity={0.96}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={shellRef}>
        <sphereGeometry args={[shellRadius, 64, 48]} />
      <meshStandardMaterial
          color={safeColor}
          transparent
          opacity={0.08}
          depthWrite={false}
          toneMapped={false}
          roughness={0.82}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      <group
        ref={(el) => {
          orbitARef.current = el;
        }}
      >
        <group
          ref={(el) => {
            orbitASpinRef.current = el;
          }}
        >
          <mesh>
            <torusGeometry args={[orbitTracks[0].radius, orbitTracks[0].tube, 8, orbitTracks[0].segments]} />
            <meshBasicMaterial
              color={safeColor}
              transparent
              opacity={0.45}
              blending={THREE.NormalBlending}
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>

      <group
        ref={(el) => {
          orbitBRef.current = el;
        }}
      >
        <group
          ref={(el) => {
            orbitBSpinRef.current = el;
          }}
        >
          <mesh>
            <torusGeometry
              args={[orbitTracks[1].radius, orbitTracks[1].tube, 8, orbitTracks[1].segments]}
            />
            <meshBasicMaterial
              color={safeColor}
              transparent
              opacity={0.28}
              blending={THREE.NormalBlending}
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>

        <points ref={fogRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[fogPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={safeColor}
          transparent
          opacity={0.16}
          size={0.013}
          sizeAttenuation
          depthWrite={false}
          depthTest
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
}
