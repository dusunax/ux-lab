"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ApsToken = {
  access_token: string;
  expires_in: number;
};

declare global {
  interface Window {
    Autodesk?: any;
  }
}

type ApsDwgViewerProps = {
  file: File | null;
  onError: (message: string | null) => void;
  onStatus: (status: string) => void;
};

let apsAssetsPromise: Promise<void> | null = null;

function loadApsAssets() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.Autodesk?.Viewing) {
    return Promise.resolve();
  }

  if (apsAssetsPromise) {
    return apsAssetsPromise;
  }

  apsAssetsPromise = new Promise((resolve, reject) => {
    const cssId = "aps-viewer-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css";
      document.head.appendChild(link);
    }

    const script = document.createElement("script");
    script.src = "https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("APS Viewer 스크립트 로드 실패"));

    document.body.appendChild(script);
  });

  return apsAssetsPromise;
}

async function getViewerToken(): Promise<ApsToken> {
  const response = await fetch("/api/aps/token", { cache: "no-store" });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "APS 토큰 조회 실패");
  }

  return payload as ApsToken;
}

async function uploadDwgAndGetUrn(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);

  const uploadResponse = await fetch("/api/aps/upload", {
    method: "POST",
    body,
  });

  const uploadPayload = await uploadResponse.json();

  if (!uploadResponse.ok) {
    throw new Error(uploadPayload.error || "DWG 업로드 실패");
  }

  const urn = uploadPayload.urn as string;

  const translateResponse = await fetch("/api/aps/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ urn }),
  });

  const translatePayload = await translateResponse.json();
  if (!translateResponse.ok) {
    throw new Error(translatePayload.error || "DWG 변환 요청 실패");
  }

  return urn;
}

async function waitForTranslation(urn: string, onStatus: (text: string) => void) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const response = await fetch(`/api/aps/manifest?urn=${encodeURIComponent(urn)}`, { cache: "no-store" });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "변환 상태 조회 실패");
    }

    const status = payload.status as string | undefined;
    const progress = payload.progress as string | undefined;

    if (status === "success") {
      onStatus("변환 완료");
      return;
    }

    if (status === "failed") {
      const reason = payload.messages?.[0]?.message || "DWG 변환 실패";
      throw new Error(reason);
    }

    onStatus(`DWG 변환 중 ${progress || "..."}`);
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }

  throw new Error("변환 대기 시간이 초과되었습니다.");
}

export default function ApsDwgViewer({ file, onError, onStatus }: ApsDwgViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const [urn, setUrn] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;

    async function run() {
      if (!file) {
        setUrn(null);
        onError(null);
        onStatus("대기");
        return;
      }

      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext !== "dwg") {
        setUrn(null);
        return;
      }

      try {
        onError(null);
        onStatus("DWG 업로드 중");
        const nextUrn = await uploadDwgAndGetUrn(file);
        if (aborted) return;
        setUrn(nextUrn);

        await waitForTranslation(nextUrn, onStatus);
        if (aborted) return;
      } catch (error) {
        if (aborted) return;
        onError(error instanceof Error ? error.message : "DWG 처리 실패");
      }
    }

    run();

    return () => {
      aborted = true;
    };
  }, [file, onError, onStatus]);

  useEffect(() => {
    let disposed = false;

    async function startViewer() {
      if (!urn || !containerRef.current) return;

      await loadApsAssets();
      if (disposed || !containerRef.current || !window.Autodesk?.Viewing) return;

      const Autodesk = window.Autodesk;
      const options = {
        env: "AutodeskProduction",
        api: "derivativeV2",
        getAccessToken: async (callback: (token: string, expires: number) => void) => {
          const token = await getViewerToken();
          callback(token.access_token, token.expires_in);
        },
      };

      Autodesk.Viewing.Initializer(options, () => {
        if (!containerRef.current || disposed) return;

        const viewer = new Autodesk.Viewing.GuiViewer3D(containerRef.current);
        const started = viewer.start();

        if (started > 0) {
          onError(`APS 뷰어 시작 실패 (code: ${started})`);
          return;
        }

        viewerRef.current = viewer;

        Autodesk.Viewing.Document.load(
          `urn:${urn}`,
          (doc: any) => {
            const defaultNode = doc.getRoot().getDefaultGeometry();
            if (!defaultNode) {
              onError("DWG에서 표시 가능한 geometry를 찾지 못했습니다.");
              return;
            }
            viewer.loadDocumentNode(doc, defaultNode);
            onStatus("렌더링 완료");
          },
          (code: number, msg: string) => {
            onError(`문서 로딩 실패 (${code}): ${msg}`);
          }
        );
      });
    }

    startViewer();

    return () => {
      disposed = true;
      if (viewerRef.current) {
        viewerRef.current.finish();
        viewerRef.current = null;
      }
    };
  }, [urn, onError]);

  const isDwg = useMemo(() => file?.name.toLowerCase().endsWith(".dwg") ?? false, [file]);

  if (!isDwg) {
    return null;
  }

  return (
    <div className="h-[62vh] w-full overflow-hidden rounded-2xl border border-slate-300/70 bg-slate-100 shadow-inner">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
