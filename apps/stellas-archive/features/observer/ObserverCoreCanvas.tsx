import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ObserverCoreScene } from "./ObserverCoreScene";
import { DEFAULT_LUMINA_VISUAL_PROFILE, type LuminaVisualProfile } from "../game/engine";

type ObserverCoreCanvasProps = {
  color: string;
  visualProfile?: LuminaVisualProfile;
  yaw: number;
  pitch: number;
  isPixelBurst: boolean;
  burstScale: number;
  dragOffsetX: number;
  dragOffsetY: number;
};

export function ObserverCoreCanvas({
  color,
  visualProfile,
  yaw,
  pitch,
  isPixelBurst,
  burstScale,
  dragOffsetX,
  dragOffsetY,
}: ObserverCoreCanvasProps) {
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const rgbColor = useMemo(() => {
    const next = color && color.trim() ? color : "rgb(128,210,255)";
    return new THREE.Color(next);
  }, [color]);

  useEffect(() => {
    if (!glRef.current) return;
    const ratio = typeof window === "undefined" ? 1 : window.devicePixelRatio;
    glRef.current.setPixelRatio(isPixelBurst ? 0.6 : Math.min(ratio, 1.8));
  }, [isPixelBurst]);

  return (
    <Canvas
      gl={{
        antialias: true,
        alpha: true,
        premultipliedAlpha: true,
        powerPreference: "high-performance",
        precision: "highp",
        preserveDrawingBuffer: false,
      }}
      dpr={[0.95, 1.2]}
      camera={{ position: [0, 0, 5.2], fov: 38, near: 0.1, far: 20 }}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        imageRendering: isPixelBurst ? "pixelated" : "auto",
        background: "transparent",
      }}
      onCreated={({ gl, scene }) => {
        const ratio = typeof window === "undefined" ? 1 : window.devicePixelRatio;
        glRef.current = gl;
        gl.setPixelRatio(Math.min(ratio, 1.8));
        scene.background = null;
        gl.setClearColor(0x000000, 0);
      }}
    >
      <ambientLight color={rgbColor} intensity={0.56} />
      <pointLight position={[2.2, 1.6, 2.4]} color={rgbColor} intensity={2.25} decay={1.2} />
      <pointLight position={[-1.8, -1.4, 1.3]} color={rgbColor} intensity={1.25} decay={1.2} />
      <pointLight position={[0, 0, 3.1]} color={rgbColor} intensity={0.72} decay={1.4} />
      <pointLight
        position={[0, 0, 0]}
        color={rgbColor}
        intensity={0.95}
        distance={3}
        decay={2}
      />
      <ObserverCoreScene
        color={rgbColor.getStyle()}
        visualProfile={visualProfile ?? DEFAULT_LUMINA_VISUAL_PROFILE}
        yaw={yaw}
        pitch={pitch}
        isPixelBurst={isPixelBurst}
        burstScale={isPixelBurst ? burstScale : 1}
        dragOffsetX={dragOffsetX}
        dragOffsetY={dragOffsetY}
      />
    </Canvas>
  );
}
