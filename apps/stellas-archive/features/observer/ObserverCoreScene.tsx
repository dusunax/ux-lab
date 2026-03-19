import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { LuminaVisualProfile } from "../game/engine";

type ObserverCoreSceneProps = {
  color: string;
  visualProfile: LuminaVisualProfile;
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
  visualProfile,
  yaw,
  pitch,
  isPixelBurst = false,
  burstScale = 1,
  dragOffsetX,
  dragOffsetY,
}: ObserverCoreSceneProps) {
  const objectScale = 0.95;
  const coreRadius = 0.8 * objectScale;
  const shellRadius = 0.94 * objectScale;

  const coreColor = useMemo(() => {
    const next = color && color.trim() ? color : "rgb(128,210,255)";
    return new THREE.Color(next);
  }, [color]);
  const safeColor = coreColor;

  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const coreInnerRef = useRef<THREE.Mesh>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const fogRef = useRef<THREE.Points>(null);
  const orbitRefs = useRef<Array<THREE.Group | null>>([]);
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
    () =>
      Array.from({ length: Math.max(1, Math.min(4, visualProfile.rings.count)) }, (_, index) => {
        const factor = index / Math.max(1, Math.max(1, visualProfile.rings.count - 1));
        const count = Math.max(1, Math.min(4, visualProfile.rings.count));
        const ringScale = Math.max(0.25, Math.min(1.4, visualProfile.rings.scale ?? 1));

        return {
          name: `orbit-${index}`,
          radius: (shellRadius + 0.085 + visualProfile.rings.spacing * count * 0.45 + index * 0.11) * ringScale,
          tube: 0.01 - index * 0.0012,
          segments: 150 + index * 20,
          rot: [0.45 * factor, index * 0.33, 0.45 * (1 - factor)],
          speed: 0.2 + 0.18 * (index + 1),
          direction: index % 2 === 0 ? 1 : -1,
        };
      }),
    [visualProfile.rings.count, visualProfile.rings.spacing],
  );

  const hasSatellite =
    visualProfile.rings.satellites.count > 0 && Math.max(0, visualProfile.rings.satellites.intensity) > 0;
  const orbitIntensity = Math.max(0, visualProfile.rings.intensity);
  const flickerIntensity = Math.max(0, Math.min(1, visualProfile.flicker.intensity));
  const satelliteIntensity = Math.max(0, Math.min(1, visualProfile.rings.satellites.intensity));

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

    if (flickerIntensity > 0.01 && time >= glitchRef.current.triggerAt) {
      const duration = 0.1 + Math.random() * 0.14;
      const intensityScale = 0.6 + flickerIntensity * 0.9;
      glitchRef.current = {
        triggerAt: time + 0.2 + Math.random() * (1.2 / intensityScale),
        releaseAt: time + duration,
        power: 0.003 + 0.02 * flickerIntensity,
        seed: Math.random() * Math.PI * 2,
        offsetX: (Math.random() - 0.5) * (0.018 + flickerIntensity * 0.022),
        offsetY: (Math.random() - 0.5) * (0.018 + flickerIntensity * 0.022),
        offsetZ: (Math.random() - 0.5) * (0.01 + flickerIntensity * 0.03),
      };
    } else if (flickerIntensity <= 0.01) {
      glitchRef.current.power = 0;
    }

    const isGlitch = time < glitchRef.current.releaseAt;
    const glitchLerp = isGlitch
      ? Math.min(1, (glitchRef.current.releaseAt - time) / (glitchRef.current.releaseAt - glitchRef.current.triggerAt + 0.001))
      : 0;
    const jitter = glitchRef.current.power * glitchLerp * burstFactor * (flickerIntensity || 0.45);

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

    orbitRefs.current.forEach((group, index) => {
      const track = orbitTracks[index];
      if (!group || !track) return;
      const speed = track.speed * (0.8 + orbitIntensity * 0.9);
      // 기존 회전 감각(회전축 변경)과, 링 자체 회전(자기축 spin)을 동시에 적용
      group.rotation.set(
        track.rot[0],
        track.rot[1] + time * speed * track.direction * 0.45,
        track.rot[2] + time * speed * track.direction,
      );
    });

    fogRef.current.rotation.y += delta * 0.12 * (1 + flickerIntensity);
    fogRef.current.rotation.x += delta * 0.12 * (1 + flickerIntensity * 0.5);
  });

  return (
    <group ref={groupRef} scale={[objectScale, objectScale, objectScale]}>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[coreRadius, 6]} />
        <meshBasicMaterial color={safeColor} toneMapped={false} />
      </mesh>

      <mesh>
        <icosahedronGeometry args={[shellRadius, 5]} />
        <meshBasicMaterial
          color={safeColor}
          transparent
          opacity={0.035}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={coreInnerRef}>
        <icosahedronGeometry args={[0.62, 5]} />
        <meshBasicMaterial
          color={safeColor}
          transparent
          opacity={0.9}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={shellRef}>
        <icosahedronGeometry args={[shellRadius, 6]} />
        <meshPhysicalMaterial
          color={safeColor}
          transparent
          opacity={0.18}
          transmission={0}
          thickness={0}
          clearcoat={0}
          metalness={0}
          roughness={1}
          depthWrite={false}
          toneMapped={false}
          emissive={safeColor}
          emissiveIntensity={0.35}
        />
      </mesh>

      {orbitTracks.map((track, index) => {
        const ringOpacity = Math.max(
          0.16,
          Math.min(0.82, 0.18 + orbitIntensity * (0.6 - index * 0.08)),
        );
        const ringColor = new THREE.Color(safeColor);
        ringColor.offsetHSL(0, -0.02 * track.direction, 0);
        const satelliteVisible = hasSatellite && index < Math.min(visualProfile.rings.satellites.count, orbitTracks.length);
        const satelliteRadius = 0.026 + satelliteIntensity * 0.028;

        return (
          <group
            key={track.name}
            ref={(el) => {
              orbitRefs.current[index] = el;
            }}
          >
            <mesh>
              <torusGeometry
                args={[
                  track.radius,
                  Math.max(0.007, track.tube * (0.8 + orbitIntensity * 0.6)),
                  16,
                  track.segments,
                ]}
              />
              <meshPhysicalMaterial
                color={ringColor}
                roughness={0.38}
                metalness={0.25}
                clearcoat={0.5}
                transparent
                opacity={ringOpacity}
                toneMapped={false}
                emissive={ringColor}
                emissiveIntensity={0.08 + orbitIntensity * 0.18}
              />
            </mesh>
            {satelliteVisible && (
              <mesh position={[track.radius, 0, 0]} scale={[satelliteRadius, satelliteRadius, satelliteRadius]}>
                <sphereGeometry args={[1, 24, 24]} />
                <meshStandardMaterial
                  color={safeColor}
                  toneMapped={false}
                  emissive={safeColor}
                  emissiveIntensity={0.28 + satelliteIntensity * 0.6}
                  roughness={0.25}
                  metalness={0.25}
                />
              </mesh>
            )}
          </group>
        );
      })}

      <points ref={fogRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[fogPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={safeColor}
          transparent
          opacity={Math.max(0.08, 0.18 * (0.5 + orbitIntensity))}
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
