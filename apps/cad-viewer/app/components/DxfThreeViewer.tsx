"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Bounds, Grid, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

type DxfThreeViewerProps = {
  file: File | null;
  onError: (message: string | null) => void;
  onStatus: (status: string) => void;
  onInfo: (value: { ext: string; vertices: number } | null) => void;
  className?: string;
};

type DxfViewerModule = {
  DXFViewer?: new () => {
    getFromFile: (file: File, font: string) => Promise<THREE.Object3D>;
  };
  default?: unknown;
};

type DxfViewerCtor = new () => {
  getFromFile: (file: File, font: string) => Promise<THREE.Object3D>;
};

async function loadDxfModule(): Promise<DxfViewerModule> {
  const runtimeImport = new Function("m", "return import(m)") as (m: string) => Promise<any>;

  try {
    return (await runtimeImport("three-dxf-viewer")) as DxfViewerModule;
  } catch {
    return (await runtimeImport("https://esm.sh/three-dxf-viewer@1.0.33?bundle")) as DxfViewerModule;
  }
}

function resolveDxfViewerCtor(mod: DxfViewerModule): DxfViewerCtor {
  const fromNamed = mod.DXFViewer;
  const defaultAny = mod.default as any;
  const fromDefaultNamed = defaultAny?.DXFViewer;
  const fromDefault = typeof defaultAny === "function" ? defaultAny : null;

  const ctor = fromNamed || fromDefaultNamed || fromDefault;
  if (!ctor) {
    const keys = Object.keys((mod as Record<string, unknown>) || {});
    const nestedKeys =
      defaultAny && typeof defaultAny === "object" ? Object.keys(defaultAny as Record<string, unknown>) : [];
    throw new Error(
      `Failed to resolve three-dxf-viewer export (module keys: ${keys.join(",")}; default keys: ${nestedKeys.join(",")})`
    );
  }

  return ctor as DxfViewerCtor;
}

async function normalizeCadFileForDxfViewer(file: File): Promise<{ source: File; ext: "dxf" }> {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".dxf")) {
    return { source: file, ext: "dxf" };
  }

  throw new Error("DWG is not supported. Please upload a DXF file.");
}

function countVertices(obj: THREE.Object3D) {
  let count = 0;
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const attr = (mesh.geometry as THREE.BufferGeometry).getAttribute("position");
      if (attr) count += attr.count;
    }
  });
  return count;
}

function normalizeMaterialColorsForDarkCanvas(obj: THREE.Object3D) {
  obj.traverse((child) => {
    const maybeMaterial = (child as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    if (!maybeMaterial) return;

    const materials = Array.isArray(maybeMaterial) ? maybeMaterial : [maybeMaterial];
    materials.forEach((mat) => {
      const colorMat = mat as THREE.Material & { color?: THREE.Color };
      if (colorMat.color) {
        const hsl = { h: 0, s: 0, l: 0 };
        colorMat.color.getHSL(hsl);
        const nextL = Math.max(hsl.l, 0.62);
        const nextS = Math.max(hsl.s, 0.35);
        colorMat.color.setHSL(hsl.h, nextS, nextL);
      }
    });
  });
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      (mesh.geometry as THREE.BufferGeometry)?.dispose?.();

      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => mat.dispose?.());
      } else {
        mesh.material?.dispose?.();
      }
    }
  });
}

function ViewerControls() {
  const controlsRef = useRef<any>(null);
  const { camera, gl } = useThree();

  useEffect(() => {
    const el = gl.domElement;

    const onWheel = (event: WheelEvent) => {
      const controls = controlsRef.current;
      if (!controls) return;

      const looksLikeTrackpad =
        event.deltaMode === 0 && (Math.abs(event.deltaX) > 0 || Math.abs(event.deltaY) < 40);

      // Keep pinch zoom behavior. For trackpad two-finger drag, prefer pan.
      if (!looksLikeTrackpad || event.ctrlKey || event.metaKey) return;

      event.preventDefault();
      event.stopPropagation();

      const zoom = camera instanceof THREE.OrthographicCamera ? camera.zoom : 1;
      const speed = 0.0024 / Math.max(zoom, 0.001);
      const panX = event.deltaX * speed;
      const panY = event.deltaY * speed;

      camera.position.x += panX;
      camera.position.y -= panY;
      controls.target.x += panX;
      controls.target.y -= panY;
      controls.update();
    };

    el.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => {
      el.removeEventListener("wheel", onWheel, { capture: true });
    };
  }, [camera, gl]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableRotate={false}
      enablePan
      screenSpacePanning
      panSpeed={1.25}
      mouseButtons={{
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
    />
  );
}

export default function DxfThreeViewer({ file, onError, onStatus, onInfo, className }: DxfThreeViewerProps) {
  const [object, setObject] = useState<THREE.Object3D | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!file) {
        setObject((prev) => {
          if (prev) disposeObject(prev);
          return null;
        });
        onStatus("Idle");
        onInfo(null);
        onError(null);
        return;
      }

      if (!file.name.toLowerCase().endsWith(".dxf")) {
        setObject((prev) => {
          if (prev) disposeObject(prev);
          return null;
        });
        onInfo(null);
        onStatus("Error");
        onError("DWG is not supported. Please upload a DXF file.");
        return;
      }

      try {
        onError(null);
        onStatus("Loading three-dxf-viewer");

        const mod = await loadDxfModule();
        if (cancelled) return;

        const normalized = await normalizeCadFileForDxfViewer(file);
        if (cancelled) return;

        onStatus("Parsing DXF");
        const ViewerCtor = resolveDxfViewerCtor(mod);
        const viewer = new ViewerCtor();
        const fontUrl = "https://unpkg.com/three@0.181.2/examples/fonts/helvetiker_regular.typeface.json";
        const nextObject = await viewer.getFromFile(normalized.source, fontUrl);
        normalizeMaterialColorsForDarkCanvas(nextObject);

        if (cancelled) {
          disposeObject(nextObject);
          return;
        }

        setObject((prev) => {
          if (prev) disposeObject(prev);
          return nextObject;
        });

        onInfo({ ext: normalized.ext, vertices: countVertices(nextObject) });
        onStatus("DXF render complete");
      } catch (error) {
        if (cancelled) return;
        setObject((prev) => {
          if (prev) disposeObject(prev);
          return null;
        });
        onInfo(null);
        onStatus("Error");
        onError(error instanceof Error ? error.message : "Failed to load DXF");
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [file, onError, onInfo, onStatus]);

  const primitive = useMemo(() => {
    if (!object) return null;
    return <primitive object={object} />;
  }, [object]);

  return (
    <div
      className={`canvas-wood relative h-full min-h-[280px] w-full overflow-hidden rounded-2xl border border-[#9b7358]/70 shadow-inner ${className ?? ""}`}
    >
      <Canvas orthographic camera={{ position: [0, 0, 100], zoom: 80, near: 0.1, far: 10000 }}>
        <color attach="background" args={["#2a1b12"]} />
        <ambientLight intensity={1} />

        <Grid
          position={[0, 0, -0.06]}
          rotation={[Math.PI / 2, 0, 0]}
          args={[120, 120]}
          cellSize={2}
          sectionSize={10}
          cellColor="#7a6652"
          sectionColor="#a58a70"
          cellThickness={0.45}
          sectionThickness={0.85}
          fadeDistance={240}
          fadeStrength={1.25}
          infiniteGrid
        />

        <Bounds fit clip observe margin={1.2}>
          {primitive}
        </Bounds>

        <ViewerControls />
      </Canvas>
    </div>
  );
}
