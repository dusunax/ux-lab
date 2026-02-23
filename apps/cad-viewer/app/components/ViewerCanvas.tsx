"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Grid, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";

type ParsedModel = {
  object: THREE.Object3D;
  ext: string;
  vertices: number;
};

type ViewerCanvasProps = {
  file: File | null;
  onError: (message: string | null) => void;
  onInfo: (value: { ext: string; vertices: number } | null) => void;
};

function normalizeObject(object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxAxis = Math.max(size.x, size.y, size.z) || 1;

  object.position.sub(center);
  object.scale.multiplyScalar(2.8 / maxAxis);
}

function getVertexCountFromObject(obj: THREE.Object3D): number {
  let count = 0;
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const geom = mesh.geometry as THREE.BufferGeometry;
      const attr = geom.getAttribute("position");
      if (attr) count += attr.count;
    }
  });
  return count;
}

async function parseFile(file: File): Promise<ParsedModel> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "dwg") {
    throw new Error("DWG는 APS 변환 파이프라인으로 처리됩니다. 잠시 기다려 주세요.");
  }

  if (!["stl", "obj", "ply"].includes(ext)) {
    throw new Error("지원되지 않는 파일 형식입니다. DWG, STL, OBJ, PLY만 가능합니다.");
  }

  if (ext === "stl") {
    const buffer = await file.arrayBuffer();
    const geometry = new STLLoader().parse(buffer);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: "#0ea5e9",
        metalness: 0.12,
        roughness: 0.42,
      })
    );

    normalizeObject(mesh);

    return {
      object: mesh,
      ext,
      vertices: geometry.getAttribute("position")?.count ?? 0,
    };
  }

  if (ext === "obj") {
    const text = await file.text();
    const object = new OBJLoader().parse(text);
    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshStandardMaterial({
          color: "#22c55e",
          metalness: 0.09,
          roughness: 0.5,
        });
      }
    });

    normalizeObject(object);

    return {
      object,
      ext,
      vertices: getVertexCountFromObject(object),
    };
  }

  const buffer = await file.arrayBuffer();
  const geometry = new PLYLoader().parse(buffer);
  if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: "#f43f5e",
      metalness: 0.1,
      roughness: 0.5,
    })
  );

  normalizeObject(mesh);

  return {
    object: mesh,
    ext,
    vertices: geometry.getAttribute("position")?.count ?? 0,
  };
}

export default function ViewerCanvas({ file, onError, onInfo }: ViewerCanvasProps) {
  const [model, setModel] = useState<ParsedModel | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!file) {
      setModel(null);
      onInfo(null);
      onError(null);
      return;
    }

    parseFile(file)
      .then((parsed) => {
        if (cancelled) return;
        setModel(parsed);
        onInfo({ ext: parsed.ext, vertices: parsed.vertices });
        onError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setModel(null);
        onInfo(null);
        onError(err instanceof Error ? err.message : "파일 파싱에 실패했습니다.");
      });

    return () => {
      cancelled = true;
    };
  }, [file, onError, onInfo]);

  const renderObject = useMemo(() => {
    if (!model?.object) return null;
    return <primitive object={model.object} />;
  }, [model]);

  return (
    <div className="h-[62vh] w-full overflow-hidden rounded-2xl border border-slate-300/70 bg-slate-100 shadow-inner pulse-grid">
      <Canvas camera={{ position: [4.2, 4.2, 5.4], fov: 46 }}>
        <color attach="background" args={["#eef2ff"]} />
        <ambientLight intensity={0.82} />
        <directionalLight position={[4, 8, 3]} intensity={1.14} />
        <directionalLight position={[-4, -2, -4]} intensity={0.42} color="#cbd5e1" />

        <Grid
          args={[16, 16]}
          cellColor="#94a3b8"
          sectionColor="#334155"
          cellSize={0.5}
          sectionSize={2}
          fadeDistance={18}
          fadeStrength={1}
          infiniteGrid
        />

        <Bounds fit clip observe margin={1.15}>
          {renderObject}
        </Bounds>

        <OrbitControls makeDefault autoRotate={!model} autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
