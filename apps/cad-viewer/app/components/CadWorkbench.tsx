"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createDXFViewer } from "./DXFViewer";
import { VisitorCounter } from "./VisitorCounter";

const DXFViewer = createDXFViewer("three-dxf-viewer");

type ModelInfo = {
  ext: string;
  vertices: number;
};

const accepted = ".dxf";
const cheerLines = [
  "You got this, Maker!",
  "Power up your build!",
  "Tiny steps, huge craft.",
  "Keep carving, keep shining!",
  "Strong hands, sharp mind!",
  "Blueprints to victory!",
];

export default function CadWorkbench() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [cad2dStatus, setCad2dStatus] = useState<string>("Idle");
  const [cheerText, setCheerText] = useState(cheerLines[0]);
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [todayVisitors, setTodayVisitors] = useState<number | null>(null);
  const [blueprintChecks, setBlueprintChecks] = useState<number | null>(null);
  const latestBlueprintCheckToken = useRef<string | null>(null);
  const reportedBlueprintCheckToken = useRef<string | null>(null);
  const [redisConnected, setRedisConnected] = useState<"connected" | "disconnected" | "unknown">("unknown");
  const pickRandomCheer = useCallback(() => {
    const next = cheerLines[Math.floor(Math.random() * cheerLines.length)];
    setCheerText(next);
  }, []);

  useEffect(() => {
    pickRandomCheer();
  }, [pickRandomCheer]);

  useEffect(() => {
    let isActive = true;

    const loadTodayVisitors = async () => {
      try {
        const response = await fetch("/api/visitors", { cache: "no-store" });
        if (!response.ok) {
          if (!isActive) return;
          setRedisConnected("disconnected");
          return;
        }
        const result = (await response.json()) as {
          visitors?: unknown;
          redisConnected?: unknown;
          blueprintsChecked?: unknown;
        };
        const nextVisitors = typeof result.visitors === "number" ? result.visitors : Number(result.visitors);
        const nextBlueprintChecks = typeof result.blueprintsChecked === "number" ? result.blueprintsChecked : Number(result.blueprintsChecked);
        if (!isActive) return;
        if (Number.isFinite(nextVisitors)) {
          setTodayVisitors(nextVisitors);
        }
        if (Number.isFinite(nextBlueprintChecks)) {
          setBlueprintChecks(nextBlueprintChecks);
        }
        if (result.redisConnected === false) {
          if (!isActive) return;
          setRedisConnected("disconnected");
        } else {
          if (!isActive) return;
          setRedisConnected("connected");
        }
      } catch {
        if (!isActive) return;
        setRedisConnected("disconnected");
      }
    };

    loadTodayVisitors();

    return () => {
      isActive = false;
    };
  }, []);

  const reportBlueprintCheck = useCallback(async () => {
    try {
      const response = await fetch("/api/visitors", {
        method: "POST",
        cache: "no-store",
      });
      if (!response.ok) return;

      const result = (await response.json()) as {
        blueprintsChecked?: unknown;
      };
      const nextBlueprintChecks = typeof result.blueprintsChecked === "number" ? result.blueprintsChecked : Number(result.blueprintsChecked);
      if (Number.isFinite(nextBlueprintChecks)) {
        setBlueprintChecks(nextBlueprintChecks);
      }
    } catch {
      // Ignore counter errors
    }
  }, []);

  const handleInfo = useCallback((next: ModelInfo | null) => {
    setInfo(next);

    const token = latestBlueprintCheckToken.current;
    if (!next || !token) return;
    if (reportedBlueprintCheckToken.current === token) return;

    reportedBlueprintCheckToken.current = token;
    reportBlueprintCheck();
  }, [reportBlueprintCheck]);

  const onSelect = useCallback((next: File | null) => {
    if (!next) return;
    if (!next.name.toLowerCase().endsWith(".dxf")) {
      setInfo(null);
      setCad2dStatus("Error");
      setError("DWG is not supported. Please upload a DXF file.");
      latestBlueprintCheckToken.current = null;
      reportedBlueprintCheckToken.current = null;
      setFile(next);
      pickRandomCheer();
      return;
    }
    setInfo(null);
    setError(null);
    setCad2dStatus("Idle");
    latestBlueprintCheckToken.current = `${next.name}-${next.size}-${next.lastModified}-${Date.now()}`;
    reportedBlueprintCheckToken.current = null;
    setFile(next);
    pickRandomCheer();
  }, [pickRandomCheer]);

  const onDrop: React.DragEventHandler<HTMLDivElement> = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    const next = event.dataTransfer.files?.[0] ?? null;
    onSelect(next);
  }, [onSelect]);

  const fileSummary = useMemo(() => {
    if (!file) return "No file selected";
    const mb = (file.size / (1024 * 1024)).toFixed(2);
    return `${file.name} (${mb}MB)`;
  }, [file]);

  const isDxf = useMemo(() => file?.name.toLowerCase().endsWith(".dxf") ?? false, [file]);
  const isCad2d = isDxf;
  const statusText = error ? "Error" : isCad2d ? cad2dStatus : file ? "Loaded" : "Idle";

  const rotateRight = useCallback(() => {
    setRotationDeg((prev) => (prev + 45) % 360);
  }, []);

  const rotateLeft = useCallback(() => {
    setRotationDeg((prev) => (prev - 45 + 360) % 360);
  }, []);

  const downloadCurrentBlueprint = useCallback(() => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".dxf")) return;

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [file]);

  return (
    <main className="relative mx-auto flex h-[100dvh] w-full max-w-[1400px] flex-col gap-4 overflow-visible px-4 py-4 text-[var(--text-main)] sm:px-6">
      <div className="sprite-piece sprite-saw" aria-hidden />
      <div className="sprite-piece sprite-plane" aria-hidden />
      <div className="sprite-piece sprite-hammer" aria-hidden />
      <div className="sprite-piece sprite-glue" aria-hidden />
      <div className="sprite-piece sprite-pencil" aria-hidden />
      <div className="sprite-piece sprite-shavings" aria-hidden />
      <div className="sprite-piece sprite-knife" aria-hidden />
      <div className="sprite-piece sprite-goggles" aria-hidden />
      <div className="sprite-piece sprite-character" aria-hidden />
      <div className="dot-bubble" aria-live="polite">
        {cheerText}
      </div>

      <section className="float-in glass rounded-2xl px-5 py-4">
        <div>
          <div>
            <p className="cad-mono text-xs uppercase tracking-[0.3em] text-[var(--accent)]">Barnwood Puzzle Shop</p>
            <h1 className="display-font mt-3 text-2xl leading-tight sm:text-3xl lg:text-4xl">
              Wood Puzzle Workshop Draft Table
            </h1>
            <p className="text-sm text-[var(--text-sub)]">
              Review DXF puzzle blueprints.
            </p>
          </div>
        </div>
      </section>

      <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-3" aria-label="Workbench layout">
        <article className="float-in glass min-h-0 rounded-2xl p-3 lg:col-span-2">
          <DXFViewer
            file={file}
            onError={setError}
            onStatus={setCad2dStatus}
            onInfo={handleInfo}
            rotationDeg={rotationDeg}
            className="h-full"
          />
        </article>

        <div className="min-h-0 space-y-4">
          <article
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={onDrop}
            className="blueprint-sheet float-in rounded-2xl p-5"
          >
            <h2 className="cad-mono text-xs uppercase tracking-[0.25em] text-[#305070]">Blueprint Sheet</h2>
            <p className="mt-3 text-sm text-[#2e4154]">Drop a blueprint here or pick one from your files.</p>
            <p className="mt-2 text-xs text-[#3f607f]">{fileSummary}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-md border border-[#4d6e8f] bg-[#d8e8f8] px-3 py-2 text-xs font-semibold text-[#294562] transition hover:bg-[#c8ddf3]"
              >
                Select Blueprint
              </button>
              {isDxf ? (
                <button
                  type="button"
                  onClick={downloadCurrentBlueprint}
                  className="rounded-md border border-[#4d6e8f] bg-[#bbd8f2] px-3 py-2 text-xs font-semibold text-[#294562] transition hover:bg-[#c8ddf3]"
                >
                  Download
                </button>
              ) : null}
              {file ? (
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setInfo(null);
                    setError(null);
                    setCad2dStatus("Idle");
                    setRotationDeg(0);
                    latestBlueprintCheckToken.current = null;
                    reportedBlueprintCheckToken.current = null;
                    pickRandomCheer();
                  }}
                  className="rounded-md border border-[#6a7f95] bg-[#f5f9fd] px-3 py-2 text-xs font-semibold text-[#3f566e] transition hover:bg-[#e7f0f8]"
                >
                  Clear
                </button>
              ) : null}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept={accepted}
              className="hidden"
              onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
            />
          </article>


          <article className="workshop-note float-in rounded-2xl p-5">
            <h2 className="cad-mono text-xs uppercase tracking-[0.24em] text-[#704f22]">Workshop Note</h2>
            <ul className="mt-3 space-y-2 text-sm text-[#5d4529]">
              <li>Mouse wheel: zoom in/out for joinery details.</li>
              <li>Left or right drag: pan across the blueprint.</li>
              <li>Middle drag: smooth pan for long-distance movement.</li>
              <li>Trackpad: two-finger drag to pan, pinch to zoom.</li>
              <li>Only DXF files are supported in this workshop.</li>
            </ul>
            {error ? <p className="mt-3 rounded-md bg-rose-100/90 p-2 text-sm text-rose-700">{error}</p> : null}
          </article>

          <article className="rotate-panel float-in rounded-2xl p-5">
            <h2 className="cad-mono text-xs uppercase tracking-[0.24em] text-[#704f22]">Rotate Blueprint</h2>
            <p className="mt-1 text-sm text-[#5d4529]">Rotate the blueprint by fixed 45° increments.</p>

            <div className="rotate-controls mt-4">
              <button
                type="button"
                onClick={rotateLeft}
                className="rotate-btn"
              >
                -45°
              </button>
              <button
                type="button"
                onClick={rotateRight}
                className="rotate-btn"
              >
                +45°
              </button>
              <span className="rotate-value" aria-live="polite">
                {rotationDeg}°
              </span>
            </div>
          </article>

          <article className="float-in rounded-2xl border border-[#8e6a43]/35 bg-[#f3e4c8]/90 px-4 py-3 text-sm text-[#5d4529] shadow-[0_8px_16px_rgba(70,44,22,0.16)]">
            <h2 className="cad-mono text-xs uppercase tracking-[0.24em] text-[#704f22]">Model Info</h2>
            <p>Format: {isDxf ? "DXF" : info?.ext?.toUpperCase() ?? "-"}</p>
            <p>Vertices: {info?.vertices?.toLocaleString() ?? "-"}</p>
            <p>Status: {statusText}</p>
          </article>
        </div>
      </section>

      <VisitorCounter
        redisConnected={redisConnected}
        todayVisitors={todayVisitors}
        blueprintChecks={blueprintChecks}
      />
    </main>
  );
}
