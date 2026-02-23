"use client";

import { useEffect, useRef, useState } from "react";
import { parseDwgLocally } from "../lib/dwg/parser";
import type { DwgParseReport } from "../lib/dwg/types";

type LocalDwgViewerProps = {
  file: File | null;
  onError: (message: string | null) => void;
  onStatus: (status: string) => void;
};

function formatBytes(bytes: number) {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function LocalDwgViewer({ file, onError, onStatus }: LocalDwgViewerProps) {
  const [report, setReport] = useState<DwgParseReport | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!file) {
        setReport(null);
        onError(null);
        onStatus("대기");
        return;
      }

      if (!file.name.toLowerCase().endsWith(".dwg")) {
        setReport(null);
        return;
      }

      try {
        onError(null);
        onStatus("로컬 DWG 파싱 중");

        const buffer = await file.arrayBuffer();
        const parsed = parseDwgLocally(buffer);

        if (cancelled) return;
        setReport(parsed);
        onStatus("로컬 파싱 완료");
      } catch (error) {
        if (cancelled) return;
        setReport(null);
        onError(error instanceof Error ? error.message : "DWG 로컬 파싱 실패");
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [file, onError, onStatus]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !report) return;

    const segments = report.previewSegments;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 920;
    const height = 420;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (segments.length === 0) {
      ctx.fillStyle = "#64748b";
      ctx.font = "14px monospace";
      ctx.fillText("2D 프리뷰를 만들 수 있는 수치 패턴을 찾지 못했습니다.", 24, 40);
      return;
    }

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const s of segments) {
      minX = Math.min(minX, s.x1, s.x2);
      minY = Math.min(minY, s.y1, s.y2);
      maxX = Math.max(maxX, s.x1, s.x2);
      maxY = Math.max(maxY, s.y1, s.y2);
    }

    const spanX = Math.max(maxX - minX, 1e-6);
    const spanY = Math.max(maxY - minY, 1e-6);
    const pad = 20;
    const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY);

    const mapX = (x: number) => pad + (x - minX) * scale;
    const mapY = (y: number) => height - (pad + (y - minY) * scale);

    ctx.strokeStyle = "#0f766e";
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.9;

    for (const s of segments) {
      ctx.beginPath();
      ctx.moveTo(mapX(s.x1), mapY(s.y1));
      ctx.lineTo(mapX(s.x2), mapY(s.y2));
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = "#0f172a";
    ctx.font = "12px monospace";
    ctx.fillText(`segments: ${segments.length}`, 12, height - 12);
  }, [report]);

  return (
    <div className="h-[62vh] w-full overflow-auto rounded-2xl border border-slate-300/70 bg-slate-50 p-4 shadow-inner">
      {!report ? (
        <p className="text-sm text-slate-600">DWG를 업로드하면 로컬 파서 분석 결과가 표시됩니다.</p>
      ) : (
        <div className="space-y-4 text-sm text-slate-800">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p>시그니처: {report.signature}</p>
            <p>버전: {report.version}</p>
            <p>파일 크기: {formatBytes(report.fileSize)}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="mb-2 font-semibold">2D Preview (Experimental)</p>
            <canvas ref={canvasRef} className="w-full rounded border border-slate-200 bg-slate-50" />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="font-semibold">Entity Hints</p>
            {report.entityHints.length === 0 ? (
              <p className="mt-1 text-slate-600">탐지된 엔티티 마커 없음</p>
            ) : (
              <ul className="mt-1 space-y-1">
                {report.entityHints.map((entry) => (
                  <li key={entry.type}>
                    {entry.type}: {entry.count}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="font-semibold">Text Snippets</p>
            {report.textSnippets.length === 0 ? (
              <p className="mt-1 text-slate-600">추출된 텍스트 없음</p>
            ) : (
              <div className="mt-1 flex flex-wrap gap-2">
                {report.textSnippets.map((token) => (
                  <span key={token} className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs">
                    {token}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="font-semibold text-amber-800">Warnings</p>
            <ul className="mt-1 space-y-1 text-amber-900">
              {report.warnings.map((warning, index) => (
                <li key={`${warning}-${index}`}>{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
