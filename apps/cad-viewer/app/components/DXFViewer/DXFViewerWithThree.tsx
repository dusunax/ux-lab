"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { DXFViewerProps } from "./types";

type DxfViewerModule = {
  DXFViewer?: new () => {
    getFromFile: (file: File, font: string) => Promise<THREE.Object3D>;
  };
  default?: unknown;
};

type DxfViewerCtor = new () => {
  getFromFile: (file: File, font: string) => Promise<THREE.Object3D>;
};

const DEFAULT_CAMERA_Z = 100;
const DEFAULT_ORTHO_ZOOM = 6;
const MAX_CAMERA_FIT_COORD = 1_000_000;

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

async function normalizeCadFile(file: File): Promise<{ source: File; ext: "dxf" }> {
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

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const low = Math.floor(idx);
  const high = Math.ceil(idx);
  if (low === high) return sorted[low];
  const t = idx - low;
  return sorted[low] * (1 - t) + sorted[high] * t;
}

function getRobustWorldBounds(root: THREE.Object3D): THREE.Box3 | null {
  const tmp = new THREE.Vector3();
  const xs: number[] = [];
  const ys: number[] = [];
  const zs: number[] = [];

  root.updateWorldMatrix(true, true);
  root.traverse((child) => {
    const entity = child as THREE.Object3D & { geometry?: THREE.BufferGeometry };
    const geom = entity.geometry;
    if (!geom) return;

    const pos = geom.getAttribute("position");
    if (!pos || pos.itemSize < 3) return;

    for (let i = 0; i < pos.count; i += 1) {
      tmp.set(pos.getX(i), pos.getY(i), pos.getZ(i));
      tmp.applyMatrix4(child.matrixWorld);

      if (
        !Number.isFinite(tmp.x) ||
        !Number.isFinite(tmp.y) ||
        !Number.isFinite(tmp.z) ||
        Math.abs(tmp.x) > MAX_CAMERA_FIT_COORD ||
        Math.abs(tmp.y) > MAX_CAMERA_FIT_COORD ||
        Math.abs(tmp.z) > MAX_CAMERA_FIT_COORD
      ) {
        continue;
      }
      xs.push(tmp.x);
      ys.push(tmp.y);
      zs.push(tmp.z);
    }
  });

  if (xs.length < 2) return null;

  xs.sort((a, b) => a - b);
  ys.sort((a, b) => a - b);
  zs.sort((a, b) => a - b);

  const qLow = 0.02;
  const qHigh = 0.98;
  const min = new THREE.Vector3(
    percentile(xs, qLow),
    percentile(ys, qLow),
    percentile(zs, qLow)
  );
  const max = new THREE.Vector3(
    percentile(xs, qHigh),
    percentile(ys, qHigh),
    percentile(zs, qHigh)
  );

  if (!Number.isFinite(min.x + min.y + min.z + max.x + max.y + max.z)) return null;
  if (min.x === max.x && min.y === max.y && min.z === max.z) return null;

  return new THREE.Box3(min, max);
}

function computeEntityWorldBox(entity: THREE.Object3D & { geometry?: THREE.BufferGeometry }): THREE.Box3 | null {
  const geom = entity.geometry;
  if (!geom) return null;
  const pos = geom.getAttribute("position");
  if (!pos || pos.itemSize < 3) return null;

  const tmp = new THREE.Vector3();
  const box = new THREE.Box3();
  let has = false;

  entity.updateWorldMatrix(true, false);
  for (let i = 0; i < pos.count; i += 1) {
    tmp.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    tmp.applyMatrix4(entity.matrixWorld);
    if (
      !Number.isFinite(tmp.x) ||
      !Number.isFinite(tmp.y) ||
      !Number.isFinite(tmp.z) ||
      Math.abs(tmp.x) > MAX_CAMERA_FIT_COORD ||
      Math.abs(tmp.y) > MAX_CAMERA_FIT_COORD ||
      Math.abs(tmp.z) > MAX_CAMERA_FIT_COORD
    ) {
      continue;
    }
    if (!has) {
      box.min.copy(tmp);
      box.max.copy(tmp);
      has = true;
    } else {
      box.expandByPoint(tmp);
    }
  }

  return has ? box : null;
}

function filterToMainCluster(root: THREE.Object3D) {
  const core = getRobustWorldBounds(root);
  if (!core) return;

  const size = core.getSize(new THREE.Vector3());
  const pad = new THREE.Vector3(
    Math.max(size.x * 0.12, 1),
    Math.max(size.y * 0.12, 1),
    Math.max(size.z * 0.12, 1)
  );
  const allowed = core.clone().expandByVector(pad);

  root.updateWorldMatrix(true, true);
  const candidates: Array<{
    entity: THREE.Object3D & { geometry?: THREE.BufferGeometry };
    box: THREE.Box3;
    cy: number;
  }> = [];

  root.traverse((child) => {
    const entity = child as THREE.Object3D & { geometry?: THREE.BufferGeometry };
    if (!entity.geometry) return;

    const entityBox = computeEntityWorldBox(entity);
    if (!entityBox) {
      entity.visible = false;
      return;
    }

    if (allowed.intersectsBox(entityBox)) {
      candidates.push({
        entity,
        box: entityBox,
        cy: (entityBox.min.y + entityBox.max.y) * 0.5,
      });
      entity.visible = true;
    } else {
      entity.visible = false;
    }
  });

  if (candidates.length < 4) return;

  const ys = candidates.map((c) => c.cy).sort((a, b) => a - b);
  const upperKeepY = percentile(ys, 0.72);

  for (const c of candidates) {
    c.entity.visible = c.cy <= upperKeepY;
  }
}

function ViewerControls({ hasObject, sceneObject }: { hasObject: boolean; sceneObject: THREE.Object3D | null }) {
  const controlsRef = useRef<any>(null);
  const { camera, gl } = useThree();

  useEffect(() => {
    const el = gl.domElement;

    const onWheel = (event: WheelEvent) => {
      const controls = controlsRef.current;
      if (!controls) return;

      const looksLikeTrackpad =
        event.deltaMode === 0 && (Math.abs(event.deltaX) > 0 || Math.abs(event.deltaY) < 40);

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

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || hasObject) return;

    if (camera instanceof THREE.OrthographicCamera) {
      camera.position.set(0, 0, DEFAULT_CAMERA_Z);
      camera.zoom = DEFAULT_ORTHO_ZOOM;
      camera.updateProjectionMatrix();
    }
    controls.target.set(0, 0, 0);
    controls.update();
  }, [camera, hasObject]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || !sceneObject || !(camera instanceof THREE.OrthographicCamera)) return;

    const box = getRobustWorldBounds(sceneObject);
    if (!box || box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const safeX = Math.max(size.x, 1e-6);
    const safeY = Math.max(size.y, 1e-6);
    const safeZ = Math.max(size.z, 1e-6);

    const lookAxis: "x" | "y" | "z" =
      safeX <= safeY && safeX <= safeZ
        ? "x"
        : safeY <= safeX && safeY <= safeZ
          ? "y"
          : "z";

    const spanX = lookAxis === "x" ? safeY : safeX;
    const spanY = lookAxis === "z" ? safeY : safeZ;

    const w = Math.max(gl.domElement.clientWidth, 1);
    const h = Math.max(gl.domElement.clientHeight, 1);
    const fitZoom = 0.9 * Math.min(w / Math.max(spanX, 1), h / Math.max(spanY, 1));
    camera.zoom = Number.isFinite(fitZoom) ? Math.max(Math.min(fitZoom, 300), 0.1) : camera.zoom;

    const dist = Math.max(size.x, size.y, size.z, 1) * 2;
    if (lookAxis === "z") {
      camera.position.set(center.x, center.y, center.z + dist);
      camera.up.set(0, 1, 0);
    } else if (lookAxis === "y") {
      camera.position.set(center.x, center.y + dist, center.z);
      camera.up.set(0, 0, 1);
    } else {
      camera.position.set(center.x + dist, center.y, center.z);
      camera.up.set(0, 0, 1);
    }

    camera.lookAt(center);
    camera.near = 0.01;
    camera.far = Math.max(10000, dist * 20);
    camera.updateProjectionMatrix();
    controls.target.copy(center);
    controls.update();
  }, [camera, gl, sceneObject]);

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

export function DXFViewerWithThree({ file, onError, onStatus, onInfo, className }: DXFViewerProps) {
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

        const normalized = await normalizeCadFile(file);
        if (cancelled) return;

        onStatus("Parsing DXF");
        const ViewerCtor = resolveDxfViewerCtor(mod);
        const viewer = new ViewerCtor();
        const fontUrl = "https://unpkg.com/three@0.181.2/examples/fonts/helvetiker_regular.typeface.json";
        const nextObject = await viewer.getFromFile(normalized.source, fontUrl);
        normalizeMaterialColorsForDarkCanvas(nextObject);
        filterToMainCluster(nextObject);
        console.log("[CAD Viewer] Render object loaded:", nextObject);

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
      <Canvas
        orthographic
        camera={{ position: [0, 0, DEFAULT_CAMERA_Z], zoom: DEFAULT_ORTHO_ZOOM, near: 0.1, far: 10000 }}
      >
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

        {primitive}

        <ViewerControls hasObject={Boolean(primitive)} sceneObject={object} />
      </Canvas>
    </div>
  );
}
