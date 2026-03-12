"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { DXFViewer as ThreeDxfViewer } from "three-dxf-viewer";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import type { DXFViewerProps } from "./types";
import { preprocessDxfText } from "./dxfTextPreprocess";

const DEFAULT_CAMERA_Z = 100;
const DEFAULT_ORTHO_ZOOM = 6;
const MAX_CAMERA_FIT_COORD = 1_000_000;
const BOUNDING_WARNING_SNIPPET =
  "THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values.";

async function suppressBoundingBoxWarnings<T>(operation: () => Promise<T>): Promise<T> {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const first = String(args[0] ?? "");
    if (first.includes(BOUNDING_WARNING_SNIPPET)) return;
    originalError(...args);
  };

  try {
    return await operation();
  } finally {
    console.error = originalError;
  }
}

async function normalizeCadFile(file: File): Promise<{ source: File; ext: "dxf" }> {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".dxf")) {
    return { source: file, ext: "dxf" };
  }
  throw new Error("DWG is not supported. Please upload a DXF file.");
}

async function reencodeToUtf8(file: File): Promise<File> {
  const buffer = await file.arrayBuffer();
  const asciiText = new TextDecoder("ascii", { fatal: false }).decode(buffer);
  const match = asciiText.match(/\$DWGCODEPAGE[\r\n]+\s*3\s*[\r\n]+\s*([^\r\n]+)/);
  const codepage = match?.[1]?.trim().toUpperCase() ?? "";

  let encoding = "utf-8";
  if (codepage === "ANSI_949" || codepage.includes("KSC")) encoding = "euc-kr";
  else if (codepage === "ANSI_932") encoding = "shift-jis";
  else if (codepage === "ANSI_936") encoding = "gbk";
  else if (codepage === "ANSI_950") encoding = "big5";

  if (encoding === "utf-8") return file;

  const decoded = new TextDecoder(encoding, { fatal: false }).decode(buffer);
  const updated = decoded.replace(
    /(\$DWGCODEPAGE[\r\n]+\s*3\s*[\r\n]+\s*)[^\r\n]+/,
    "$1UTF-8"
  );

  return new File([updated], file.name, { type: file.type });
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
        colorMat.color.setHSL(hsl.h, Math.max(hsl.s, 0.35), Math.max(hsl.l, 0.62));
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

function filterOutlierTextAboveCluster(root: THREE.Object3D) {
  type EntityEntry = { entity: THREE.Object3D & { geometry?: THREE.BufferGeometry }; cy: number };
  const entries: EntityEntry[] = [];

  root.updateWorldMatrix(true, true);
  root.traverse((child) => {
    const entity = child as THREE.Object3D & { geometry?: THREE.BufferGeometry };
    if (!entity.geometry) return;

    const pos = entity.geometry.getAttribute("position");
    if (!pos || pos.itemSize < 3) return;

    const tmp = new THREE.Vector3();
    let minY = Infinity;
    let maxY = -Infinity;

    entity.updateWorldMatrix(true, false);
    for (let i = 0; i < pos.count; i++) {
      tmp.set(pos.getX(i), pos.getY(i), pos.getZ(i));
      tmp.applyMatrix4(entity.matrixWorld);
      if (!Number.isFinite(tmp.y) || Math.abs(tmp.y) > MAX_CAMERA_FIT_COORD) continue;
      if (tmp.y < minY) minY = tmp.y;
      if (tmp.y > maxY) maxY = tmp.y;
    }

    if (!Number.isFinite(minY)) {
      entity.visible = false;
      return;
    }

    entries.push({ entity, cy: (minY + maxY) / 2 });
  });

  if (entries.length < 4) return;

  entries.sort((a, b) => a.cy - b.cy);
  const ys = entries.map((e) => e.cy);
  const totalRange = ys[ys.length - 1] - ys[0];

  if (totalRange < 1e-6) return;

  let maxGap = 0;
  let splitIdx = -1;
  for (let i = 1; i < ys.length; i++) {
    const gap = ys[i] - ys[i - 1];
    if (gap > maxGap) {
      maxGap = gap;
      splitIdx = i;
    }
  }

  // Only hide if the gap is large (>20% of range) and upper cluster is a clear minority (<40% of lower)
  if (splitIdx < 0 || maxGap < totalRange * 0.2) return;
  if (entries.length - splitIdx >= splitIdx * 0.4) return;

  for (let i = splitIdx; i < entries.length; i++) {
    entries[i].entity.visible = false;
  }
}

function getRobustWorldBounds(root: THREE.Object3D): THREE.Box3 | null {
  const tmp = new THREE.Vector3();
  const xs: number[] = [];
  const ys: number[] = [];
  const zs: number[] = [];

  root.updateWorldMatrix(true, true);
  root.traverse((child) => {
    if (!child.visible) return;
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

  const min = new THREE.Vector3(percentile(xs, 0.02), percentile(ys, 0.02), percentile(zs, 0.02));
  const max = new THREE.Vector3(percentile(xs, 0.98), percentile(ys, 0.98), percentile(zs, 0.98));

  if (!Number.isFinite(min.x + min.y + min.z + max.x + max.y + max.z)) return null;
  if (min.x === max.x && min.y === max.y && min.z === max.z) return null;

  return new THREE.Box3(min, max);
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

export function DXFViewerWithThreeDXFViewer({
  file,
  onError,
  onStatus,
  onInfo,
  rotationDeg = 0,
  className,
  exportScale = 1,
}: DXFViewerProps) {
  const [object, setObject] = useState<THREE.Object3D | null>(null);
  const rotationRad = (rotationDeg * Math.PI) / 180;
  const rotationCenter = useMemo(() => {
    if (!object) return new THREE.Vector3(0, 0, 0);

    const box = getRobustWorldBounds(object);
    if (!box || box.isEmpty()) return new THREE.Vector3(0, 0, 0);

    return box.getCenter(new THREE.Vector3());
  }, [object]);

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

        const normalized = await normalizeCadFile(file);
        if (cancelled) return;

        onStatus("Parsing DXF");
        const reencoded = await reencodeToUtf8(normalized.source);
        const reencodedContent = await reencoded.text();

        const parseCandidates: string[] = [
          reencodedContent,
          preprocessDxfText(reencodedContent),
        ];

        const typefaceRes = await fetch("/api/fonts/NanumGothic-Regular.ttf");
        if (!typefaceRes.ok) throw new Error("Failed to load font");
        const typefaceData = await typefaceRes.json();

        let nextObject: THREE.Object3D | null = null;
        let parseError: unknown;
        for (const content of parseCandidates) {
          const candidateFile = new File([content], file.name, { type: file.type });
          const viewer = new ThreeDxfViewer();
          try {
            (viewer as unknown as { _font: Font })._font = new Font(typefaceData);
            const objectCandidate = (await suppressBoundingBoxWarnings(() =>
              viewer.getFromFile(candidateFile, ""),
            )) as THREE.Object3D;
            if (!objectCandidate || !objectCandidate.isObject3D) {
              throw new Error("Failed to parse DXF as a 3D object");
            }
            nextObject = objectCandidate;
            break;
          } catch (error) {
            parseError = error;
          }
        }

        if (!nextObject) {
          throw parseError ?? new Error("Failed to parse DXF");
        }

        normalizeMaterialColorsForDarkCanvas(nextObject);
        filterOutlierTextAboveCluster(nextObject);

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
    const center = rotationCenter.toArray() as [number, number, number];
    return (
      <group position={center}>
        <group rotation={[0, 0, rotationRad]}>
          <group position={[-center[0], -center[1], -center[2]]}>
            <primitive object={object} />
          </group>
        </group>
      </group>
    );
  }, [object, rotationCenter, rotationRad]);

  const exportPrimitive = useMemo(() => {
    if (!object) return null;
    const exportObject = object.clone(true);
    const center = rotationCenter.toArray() as [number, number, number];
    return (
      <group position={center}>
        <group rotation={[0, 0, rotationRad]}>
          <group position={[-center[0], -center[1], -center[2]]}>
            <primitive object={exportObject} />
          </group>
        </group>
      </group>
    );
  }, [object, rotationCenter, rotationRad]);

  const normalizedExportScale = Number.isFinite(exportScale)
    ? Math.max(1, Math.min(Math.floor(exportScale), 32))
    : 1;

  return (
    <div
      className={`canvas-wood relative h-full min-h-[280px] w-full overflow-hidden rounded-2xl border border-[#9b7358]/70 ${
        className ?? ""
      }`}
    >
      <Canvas
        onCreated={(state) => {
          state.gl.domElement.dataset.exportRole = "preview";
        }}
        gl={{
          preserveDrawingBuffer: true,
        }}
        orthographic
        camera={{
          position: [0, 0, DEFAULT_CAMERA_Z],
          zoom: DEFAULT_ORTHO_ZOOM,
          near: 0.1,
          far: 10000,
        }}
      >
        <color attach='background' args={["#2b1b10"]} />
        <ambientLight intensity={1.75} />
        <hemisphereLight args={["#fff1d8", "#cfa884", 0.95]} />
        <directionalLight position={[12, 10, 8]} intensity={0.35} />
        <directionalLight position={[-12, -8, 6]} intensity={0.28} />

        <Grid
          position={[0, 0, -0.06]}
          rotation={[Math.PI / 2, 0, 0]}
          args={[120, 120]}
          cellSize={2}
          sectionSize={10}
          cellColor='#544232'
          sectionColor='#6c503e'
          cellThickness={0.45}
          sectionThickness={0.85}
          fadeDistance={2000}
          fadeStrength={0}
          infiniteGrid
        />

        {primitive}
        <ViewerControls hasObject={Boolean(primitive)} sceneObject={object} />
      </Canvas>
        {normalizedExportScale > 1 ? (
        <Canvas
          key={`export-canvas-${normalizedExportScale}`}
          onCreated={(state) => {
            state.gl.domElement.dataset.exportRole = "export";
          }}
          dpr={normalizedExportScale}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            pointerEvents: "none",
          }}
          gl={{
            preserveDrawingBuffer: true,
          }}
          orthographic
          camera={{
            position: [0, 0, DEFAULT_CAMERA_Z],
            zoom: DEFAULT_ORTHO_ZOOM,
            near: 0.1,
            far: 10000,
          }}
        >
          <color attach='background' args={["#2b1b10"]} />
          <ambientLight intensity={1.75} />
          <hemisphereLight args={["#fff1d8", "#cfa884", 0.95]} />
          <directionalLight position={[12, 10, 8]} intensity={0.35} />
          <directionalLight position={[-12, -8, 6]} intensity={0.28} />

          <Grid
            position={[0, 0, -0.06]}
            rotation={[Math.PI / 2, 0, 0]}
            args={[120, 120]}
            cellSize={2}
            sectionSize={10}
            cellColor='#544232'
            sectionColor='#6c503e'
            cellThickness={0.45}
            sectionThickness={0.85}
            fadeDistance={2000}
            fadeStrength={0}
            infiniteGrid
          />

          {primitive}
          {exportPrimitive}
          <ViewerControls hasObject={Boolean(exportPrimitive)} sceneObject={object} />
        </Canvas>
      ) : null}
    </div>
  );
}
