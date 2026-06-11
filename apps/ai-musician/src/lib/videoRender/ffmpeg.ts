import { spawn } from "child_process";
import { createAbortError, isAbortError } from "./abort";
import { COVER_SIZE, COVER_TOP } from "./canvas";

export function toFfmpegColor(hex: string): string {
  return "0x" + hex.replace("#", "").toUpperCase();
}

export function logRender(id: string, step: string, details?: Record<string, unknown>): void {
  const suffix = details ? ` ${JSON.stringify(details)}` : "";
  console.info(`[render-video:${id}] ${step}${suffix}`);
}

// 이미지: 500x500 정사각형, 텍스트는 아래에 줄바꿈 표시
// 텍스트는 Node canvas로 만든 PNG 레이어를 ffmpeg overlay로 합성
export function buildFilterComplex(bgColor: string, hasTextOverlay: boolean): string {
  const ffmpegColor = toFfmpegColor(bgColor);

  const scale =
    `[1:v]scale=${COVER_SIZE}:${COVER_SIZE}:force_original_aspect_ratio=decrease,` +
    `pad=${COVER_SIZE}:${COVER_SIZE}:(ow-iw)/2:(oh-ih)/2:color=${ffmpegColor}[img]`;

  const overlay = `[0:v][img]overlay=(W-w)/2:${COVER_TOP}[withimg]`;

  if (!hasTextOverlay) return `${scale};${overlay};[withimg]copy[vout]`;
  return `${scale};${overlay};[withimg][2:v]overlay=0:0[vout]`;
}

export function runFfmpeg(args: string[], id: string, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(createAbortError());
      return;
    }

    const startedAt = Date.now();
    const child = spawn("ffmpeg", args);
    let stderr = "";
    let lastProgressLog = 0;
    let aborted = false;

    logRender(id, "ffmpeg:start", { pid: child.pid });

    const heartbeat = setInterval(() => {
      logRender(id, "ffmpeg:running", { elapsedMs: Date.now() - startedAt });
    }, 10000);

    child.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stderr += text;

      const now = Date.now();
      if (now - lastProgressLog < 2000) return;

      const frame = text.match(/frame=\s*(\d+)/)?.[1];
      const time = text.match(/time=([0-9:.]+)/)?.[1];
      const speed = text.match(/speed=\s*([0-9.]+x)/)?.[1];
      if (frame || time || speed) {
        logRender(id, "ffmpeg:progress", { frame, time, speed });
        lastProgressLog = now;
      }
    });

    const abort = () => {
      aborted = true;
      logRender(id, "ffmpeg:abort", { pid: child.pid, elapsedMs: Date.now() - startedAt });
      child.kill("SIGTERM");
      setTimeout(() => {
        if (!child.killed) child.kill("SIGKILL");
      }, 3000);
    };

    signal.addEventListener("abort", abort, { once: true });

    child.on("error", (error) => {
      clearInterval(heartbeat);
      signal.removeEventListener("abort", abort);
      reject(error);
    });

    child.on("close", (code) => {
      clearInterval(heartbeat);
      signal.removeEventListener("abort", abort);
      const elapsedMs = Date.now() - startedAt;
      if (aborted || signal.aborted) {
        logRender(id, "ffmpeg:aborted", { elapsedMs });
        reject(createAbortError());
        return;
      }

      if (code === 0) {
        logRender(id, "ffmpeg:done", { elapsedMs });
        resolve();
        return;
      }

      reject(new Error(`ffmpeg 실패 (${code}): ${stderr.slice(-1200)}`));
    });
  });
}

export { isAbortError };
