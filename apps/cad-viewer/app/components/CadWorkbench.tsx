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
type ExportScale = 2 | 4 | 8;
const EXPORT_SCALES: readonly ExportScale[] = [2, 4, 8];

export default function CadWorkbench() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const blueprintCanvasRef = useRef<HTMLDivElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [cad2dStatus, setCad2dStatus] = useState<string>("Idle");
  const [cheerText, setCheerText] = useState(cheerLines[0]);
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [exportScale, setExportScale] = useState<ExportScale>(2);
  const [isPreparingExportCanvas, setIsPreparingExportCanvas] = useState(false);
  const [exportAction, setExportAction] = useState<"none" | "download" | "image" | "pdf">("none");
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
      setExportError(null);
      latestBlueprintCheckToken.current = null;
      reportedBlueprintCheckToken.current = null;
      setFile(next);
      pickRandomCheer();
      return;
    }
    setInfo(null);
    setError(null);
    setExportError(null);
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

  const formatExportError = useCallback((error: unknown) => {
    const message = error instanceof Error ? error.message : "An export error occurred.";
    if (message.includes("Invalid string length")) {
      return "이미지/해상도 크기가 너무 커서 PDF 내보내기에서 문자열 제한 오류가 발생했습니다. 8x 이하로 낮춰서 다시 시도해 주세요.";
    }
    return message;
  }, []);

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

  const getCanvasByRole = useCallback((mode: "preview" | "export") => {
    const viewport = blueprintCanvasRef.current;
    if (!viewport) return null;

    const role = mode === "export" ? "export" : "preview";
    const roleCanvas = viewport.querySelector<HTMLCanvasElement>(`canvas[data-export-role="${role}"]`);
    if (roleCanvas && roleCanvas.width > 0 && roleCanvas.height > 0) {
      return roleCanvas;
    }
    if (mode === "export") return null;

    return (
      Array.from(viewport.querySelectorAll("canvas")).find((item) => item.width > 0 && item.height > 0) ?? null
    );
  }, []);

  const getBlueprintCanvas = useCallback(
    (mode: "preview" | "export" = "preview") => {
      const targetCanvas = mode === "export" ? getCanvasByRole("export") : getCanvasByRole(mode);

      if (!targetCanvas) {
        throw new Error(mode === "export" ? "Export canvas is not available." : "Blueprint canvas is not available.");
      }
      if (targetCanvas.width === 0 || targetCanvas.height === 0) {
        throw new Error(mode === "export" ? "Export canvas is not ready yet." : "Blueprint canvas is not ready yet.");
      }

      return targetCanvas;
    },
    [getCanvasByRole]
  );

  const waitForCanvas = useCallback(
    async (mode: "preview" | "export") => {
      for (let i = 0; i < 60; i += 1) {
        const canvas = mode === "export" ? getCanvasByRole("export") : getCanvasByRole(mode);
        if (canvas && canvas.width > 0 && canvas.height > 0) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
          return;
        }
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      throw new Error("Export canvas is not available.");
    },
    [getCanvasByRole]
  );

  const captureBlueprintImage = useCallback(
    (mode: "preview" | "export" = "preview") => {
      const sourceCanvas = getBlueprintCanvas(mode);

      const snapshotCanvas = document.createElement("canvas");
      snapshotCanvas.width = Math.max(1, sourceCanvas.width);
      snapshotCanvas.height = Math.max(1, sourceCanvas.height);
      const snapshotContext = snapshotCanvas.getContext("2d");
      if (!snapshotContext) {
        throw new Error("Failed to create snapshot context.");
      }

      snapshotContext.imageSmoothingEnabled = true;
      snapshotContext.imageSmoothingQuality = "high";
      snapshotContext.drawImage(sourceCanvas, 0, 0, snapshotCanvas.width, snapshotCanvas.height);

      return {
        imageSrc: snapshotCanvas.toDataURL("image/png"),
        sourceWidth: sourceCanvas.width,
        sourceHeight: sourceCanvas.height,
      };
    },
    [getBlueprintCanvas]
  );

  const stripWhiteBackgroundForPdf = useCallback(async (imageSrc: string) => {
    const image = new Image();
    const loadedImage = await new Promise<HTMLImageElement>((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Failed to load image for PDF export."));
      image.src = imageSrc;
    });

    const canvas = document.createElement("canvas");
    canvas.width = loadedImage.width;
    canvas.height = loadedImage.height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to create transparent mask context.");
    }

    context.drawImage(loadedImage, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;
      if (r >= 245 && g >= 245 && b >= 245) {
        data[i + 3] = 0;
      }
    }
    context.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  }, []);

  const captureExportBlueprintImage = useCallback(async () => {
    if (!file) return null;
    if (!file.name.toLowerCase().endsWith(".dxf")) return null;

    try {
      setIsPreparingExportCanvas(true);
      await waitForCanvas("export");
      return captureBlueprintImage("export");
    } finally {
      setIsPreparingExportCanvas(false);
    }
  }, [captureBlueprintImage, file, waitForCanvas]);

  const exportSelectedBlueprintPng = useCallback(async () => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".dxf")) return;

    try {
      setExportAction("image");
      setExportError(null);
      setError(null);
      const snapshot = await captureExportBlueprintImage();
      if (!snapshot) return;

      const link = document.createElement("a");
      const exportName = file.name.replace(/\.[^.]+$/i, "") || "blueprint";
      link.href = snapshot.imageSrc;
      link.download = `${exportName}_${exportScale}x.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      const message = formatExportError(err);
      setExportError(message);
      setError(null);
    } finally {
      setExportAction("none");
    }
  }, [captureExportBlueprintImage, exportScale, file, formatExportError]);

  const exportSelectedBlueprintPdf = useCallback(async () => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".dxf")) return;

    try {
      setExportAction("pdf");
      setExportError(null);
      setError(null);
      const runtimeImport = new Function("m", "return import(m)") as (mod: string) => Promise<unknown>;

      const module = await (async () => {
        try {
          return await runtimeImport("jspdf");
        } catch {
          return await runtimeImport("https://esm.sh/jspdf@2.5.1?bundle");
        }
      })();

      const parsedModule = module as {
        jsPDF?: unknown;
        default?: unknown;
      };
      const JsPDF =
        parsedModule?.jsPDF ??
        (typeof parsedModule?.default === "function" ? parsedModule.default : undefined) ??
        (parsedModule?.default as { jsPDF?: unknown })?.jsPDF;
      if (typeof JsPDF !== "function") {
        throw new Error("PDF export library could not be initialized.");
      }

      const snapshot = await captureExportBlueprintImage();
      if (!snapshot) return;
      const imageSrc = await stripWhiteBackgroundForPdf(snapshot.imageSrc);

      // Ensure TypeScript treats JsPDF as a constructable type.
      const JsPDFCtor = JsPDF as unknown as { new (opts?: any): any };
      const pdf = new JsPDFCtor({
        unit: "mm",
        format: "a4",
        orientation: snapshot.sourceWidth >= snapshot.sourceHeight ? "landscape" : "portrait",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const padding = 8;
      const maxWidth = pageWidth - padding * 2;
      const maxHeight = pageHeight - padding * 2;
      const fitScale = Math.min(maxWidth / snapshot.sourceWidth, maxHeight / snapshot.sourceHeight);
      const renderWidth = snapshot.sourceWidth * fitScale;
      const renderHeight = snapshot.sourceHeight * fitScale;
      const x = (pageWidth - renderWidth) / 2;
      const y = (pageHeight - renderHeight) / 2;

      pdf.addImage(imageSrc, "PNG", x, y, renderWidth, renderHeight);

      const exportName = file.name.replace(/\.[^.]+$/i, "") || "blueprint";
      pdf.save(`${exportName}_${exportScale}x.pdf`);
    } catch (err) {
      const message = err instanceof Error && err.message ? formatExportError(err) : formatExportError("Failed to export PDF.");
      setExportError(message);
      setError(null);
    } finally {
      setExportAction("none");
    }
  }, [captureExportBlueprintImage, exportScale, file, formatExportError, stripWhiteBackgroundForPdf]);

  const downloadCurrentBlueprint = useCallback(async () => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".dxf")) return;

    setExportAction("download");
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportAction("none");
  }, [file]);

  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-[1400px] max-w-full flex-col gap-4 overflow-x-hidden overflow-y-visible px-4 pb-24 pt-4 text-[var(--text-main)] sm:px-6 sm:pb-20 lg:pb-16">
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

      <section className="grid min-h-0 min-w-0 flex-1 gap-4 lg:grid-cols-3" aria-label="Workbench layout">
        <article ref={blueprintCanvasRef} className="float-in glass min-h-[50vh] min-w-0 rounded-2xl p-3 lg:min-h-0 lg:col-span-2">
          <DXFViewer
            file={file}
            onError={setError}
            onStatus={setCad2dStatus}
            onInfo={handleInfo}
            rotationDeg={rotationDeg}
            exportScale={isPreparingExportCanvas ? exportScale : 1}
            className="h-full"
          />
        </article>

        <div className="min-h-0 min-w-0 space-y-4">
          <article
            className="blueprint-sheet float-in flex min-h-0 min-w-0 flex-col rounded-2xl p-5"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={onDrop}
          >
            <h2 className="cad-mono text-xs uppercase tracking-[0.25em] text-[#305070]">Blueprint Sheet</h2>
            <p className="mt-3 text-sm text-[#2e4154]">Drop a blueprint here or pick one from your files.</p>
            <p className="mt-2 break-all text-xs text-[#3f607f]">{fileSummary}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-md border border-[#4d6e8f] bg-[#d8e8f8] px-3 py-2 text-xs font-semibold text-[#294562] transition hover:bg-[#c8ddf3]"
              >
                Select Blueprint
              </button>
              {file ? (
                <button
                  type="button"
	                  onClick={() => {
                    setFile(null);
                    setInfo(null);
                    setError(null);
                    setExportError(null);
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


          <article className="workshop-note float-in min-w-0 rounded-2xl p-5">
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

          <article className="rotate-panel float-in min-w-0 rounded-2xl p-5">
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

          <article className="float-in min-w-0 rounded-2xl border border-[#8e6a43]/35 bg-[#f3e4c8]/90 px-4 py-3 text-sm text-[#5d4529] shadow-[0_8px_16px_rgba(70,44,22,0.16)]">
            <h2 className="cad-mono text-xs uppercase tracking-[0.24em] text-[#704f22]">Model Info</h2>
            <p>Format: {isDxf ? "DXF" : info?.ext?.toUpperCase() ?? "-"}</p>
            <p>Vertices: {info?.vertices?.toLocaleString() ?? "-"}</p>
            <p>Status: {statusText}</p>
          </article>

          <article className="flex min-w-0 flex-col items-end rounded-2xl border border-[#8e6a43]/35 bg-[#f3e4c8]/90 p-5 shadow-[0_8px_16px_rgba(70,44,22,0.16)]">
            <h2 className="cad-mono text-xs uppercase tracking-[0.24em] text-[#704f22]">Export</h2>
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={downloadCurrentBlueprint}
                disabled={!isDxf || exportAction !== "none"}
                className="rounded-md border border-[#8e6a43] bg-[#f8edd3] px-3 py-2 text-xs font-semibold text-[#5c4725] transition hover:bg-[#efd7a5] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {exportAction === "download" ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#5c4725] border-t-transparent" />
                    Downloading
                  </span>
                ) : (
                  "Download"
                )}
              </button>
              <button
                type="button"
                onClick={exportSelectedBlueprintPng}
                disabled={!isDxf || exportAction !== "none"}
                className="rounded-md border border-[#8e6a43] bg-[#f8edd3] px-3 py-2 text-xs font-semibold text-[#5c4725] transition hover:bg-[#efd7a5] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {exportAction === "image" ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#5c4725] border-t-transparent" />
                    Saving
                  </span>
                ) : (
                  "Save Image"
                )}
              </button>
              <button
                type="button"
                onClick={exportSelectedBlueprintPdf}
                disabled={!isDxf || exportAction !== "none"}
                className="rounded-md border border-[#8e6a43] bg-[#f8edd3] px-3 py-2 text-xs font-semibold text-[#5c4725] transition hover:bg-[#efd7a5] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {exportAction === "pdf" ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#5c4725] border-t-transparent" />
                    Exporting
                  </span>
                ) : (
                  "Export PDF"
                )}
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between w-full rounded-md border border-[#8e6a43]/35 bg-[#faeecf]/80 px-4 py-2">
              <div>
                <p className="text-xs font-semibold text-[#5c4725]">Export Settings</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#5c4725]">Resolution</span>
                <div className="flex flex-wrap items-center gap-1 rounded-md border border-[#8e6a43]/35 bg-[#fff6dd] p-1">
                  {EXPORT_SCALES.map((scale) => (
                    <button
                      type="button"
                      key={scale}
                      onClick={() => setExportScale(scale)}
                      className={`rounded px-2 py-1 text-[11px] font-semibold text-[#5c4725] transition ${
                        exportScale === scale
                          ? "bg-[#f5d58f] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
                          : "hover:bg-[#f5e3b6]"
                      }`}
                    >
                      {scale}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {exportError ? (
              <p className="mt-3 w-full rounded-md bg-rose-100/90 p-2 text-xs leading-5 text-rose-700">
                {exportError}
              </p>
            ) : null}
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
