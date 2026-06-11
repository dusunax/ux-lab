import { NextRequest, NextResponse } from "next/server";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { spawn } from "child_process";
import { writeFile, readFile, unlink, access } from "fs/promises";
import { join, extname } from "path";

const VIDEO_WIDTH = 1920;
const VIDEO_HEIGHT = 1080;
const COVER_SIZE = 500;
const COVER_TOP = 210;
const TEXT_TOP = COVER_TOP + COVER_SIZE + 48;
const TEXT_MAX_WIDTH = 780;
const TITLE_FONT_SIZE = 34;
const TITLE_LINE_HEIGHT = 42;
const ARTIST_FONT_SIZE = 22;
const ARTIST_LINE_HEIGHT = 30;
const LATIN_FONT_FAMILY = "AiMusicianLatin";
const KOREAN_FONT_FAMILY = "AiMusicianKorean";
let registeredTextFonts = false;

const AUDIO_EXT: Record<string, string> = {
  "audio/mpeg": ".mp3",
  "audio/mp4": ".m4a",
  "audio/x-m4a": ".m4a",
  "audio/wav": ".wav",
  "audio/ogg": ".ogg",
  "audio/flac": ".flac",
};
const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const FONT_CANDIDATES = [
  "/System/Library/Fonts/Avenir.ttc",
  "/System/Library/Fonts/Helvetica.ttc",
  "/Library/Fonts/Arial.ttf",
  "/System/Library/Fonts/Supplemental/Arial.ttf",
  "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
];
const KOREAN_FONT_CANDIDATES = [
  "/System/Library/Fonts/AppleSDGothicNeo.ttc",
  "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
  "/System/Library/Fonts/AppleGothic.ttf",
  "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
  "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
  "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
];

async function findFont(candidates: string[]): Promise<string | null> {
  for (const p of candidates) {
    try {
      await access(p);
      return p;
    } catch {}
  }
  return null;
}

async function registerTextFont(): Promise<void> {
  if (registeredTextFonts) return;

  const [latinFontPath, koreanFontPath] = await Promise.all([
    findFont(FONT_CANDIDATES),
    findFont(KOREAN_FONT_CANDIDATES),
  ]);

  const latinRegistered = Boolean(
    latinFontPath && GlobalFonts.registerFromPath(latinFontPath, LATIN_FONT_FAMILY)
  );
  const koreanRegistered = Boolean(
    koreanFontPath && GlobalFonts.registerFromPath(koreanFontPath, KOREAN_FONT_FAMILY)
  );

  registeredTextFonts = latinRegistered || koreanRegistered;
}

function toFfmpegColor(hex: string): string {
  return "0x" + hex.replace("#", "").toUpperCase();
}

function logRender(id: string, step: string, details?: Record<string, unknown>): void {
  const suffix = details ? ` ${JSON.stringify(details)}` : "";
  console.info(`[render-video:${id}] ${step}${suffix}`);
}

function extFromMime(mime: string, map: Record<string, string>, fallback: string) {
  return map[mime.split(";")[0].trim()] ?? fallback;
}

async function resolveBuffer(
  file: File | null,
  url: string | null,
  ext: { map: Record<string, string>; fallback: string },
  signal: AbortSignal
): Promise<{ buffer: Buffer; fileExt: string }> {
  throwIfAborted(signal);

  if (file) {
    const fileExt = extname(file.name) || extFromMime(file.type, ext.map, ext.fallback);
    return { buffer: Buffer.from(await file.arrayBuffer()), fileExt };
  }
  if (url) {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`다운로드 실패 (${res.status}): ${url}`);
    const mime = res.headers.get("content-type") ?? "";
    const fileExt = extFromMime(mime, ext.map, ext.fallback);
    return { buffer: Buffer.from(await res.arrayBuffer()), fileExt };
  }
  throw new Error("audio 또는 image 입력이 필요합니다");
}

function createAbortError(): Error {
  const error = new Error("영상 생성 요청이 취소되었습니다");
  error.name = "AbortError";
  return error;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw createAbortError();
}

async function parseSources(req: NextRequest) {
  const ct = req.headers.get("content-type") ?? "";

  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    return {
      audioFile: fd.get("audio") as File | null,
      audioUrl: fd.get("audioUrl") as string | null,
      imageFile: fd.get("image") as File | null,
      imageUrl: fd.get("imageUrl") as string | null,
      title: (fd.get("title") as string | null) ?? "track",
      bgColor: (fd.get("bgColor") as string | null) ?? "#e8e0f5",
      textColor: (fd.get("textColor") as string | null) ?? "#1a1a1a",
      artist: (fd.get("artist") as string | null) ?? "",
    };
  }

  const body = await req.json();
  return {
    audioFile: null,
    audioUrl: body.audioUrl as string | null,
    imageFile: null,
    imageUrl: body.imageUrl as string | null,
    title: (body.title as string | null) ?? "track",
    bgColor: (body.bgColor as string | null) ?? "#e8e0f5",
    textColor: (body.textColor as string | null) ?? "#1a1a1a",
    artist: (body.artist as string | null) ?? "",
  };
}

function normalizeOverlayText(text: string): string {
  return text.normalize("NFC").replace(/\r?\n/g, " ").trim();
}

function sanitizeDownloadTitle(title: string): string {
  const safeTitle = title
    .normalize("NFC")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+$/, "");

  return safeTitle || "track";
}

function wrapText(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  const words = text.split(/\s+/).filter(Boolean);

  if (words.length === 0) return [];

  for (const word of words) {
    const lastLine = lines.at(-1);
    const candidate = lastLine ? `${lastLine} ${word}` : word;

    if (!lastLine || ctx.measureText(candidate).width <= maxWidth) {
      if (lastLine) {
        lines[lines.length - 1] = candidate;
      } else {
        lines.push(candidate);
      }
      continue;
    }

    if (ctx.measureText(word).width <= maxWidth) {
      lines.push(word);
      continue;
    }

    let current = "";
    for (const char of word) {
      const next = `${current}${char}`;
      if (current && ctx.measureText(next).width > maxWidth) {
        lines.push(current);
        current = char;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
  }

  return lines;
}

function drawLines(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  lines: string[],
  y: number,
  lineHeight: number
): number {
  for (const line of lines) {
    ctx.fillText(line, VIDEO_WIDTH / 2, y);
    y += lineHeight;
  }
  return y;
}

async function createTextOverlay(path: string, textColor: string, artist: string, title: string): Promise<boolean> {
  const normalizedTitle = normalizeOverlayText(title);
  const normalizedArtist = normalizeOverlayText(artist);
  if (!normalizedTitle && !normalizedArtist) return false;

  await registerTextFont();

  const canvas = createCanvas(VIDEO_WIDTH, VIDEO_HEIGHT);
  const ctx = canvas.getContext("2d");
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = textColor;

  const fontFamily = registeredTextFonts
    ? `${LATIN_FONT_FAMILY}, ${KOREAN_FONT_FAMILY}, sans-serif`
    : "sans-serif";
  let cursorY = TEXT_TOP;

  if (normalizedTitle) {
    ctx.globalAlpha = 1;
    ctx.font = `700 ${TITLE_FONT_SIZE}px ${fontFamily}`;
    const titleLines = wrapText(ctx, normalizedTitle, TEXT_MAX_WIDTH);
    cursorY = drawLines(ctx, titleLines, cursorY, TITLE_LINE_HEIGHT) + 8;
  }

  if (normalizedArtist) {
    ctx.globalAlpha = 0.7;
    ctx.font = `${ARTIST_FONT_SIZE}px ${fontFamily}`;
    const artistLines = wrapText(ctx, normalizedArtist, TEXT_MAX_WIDTH);
    drawLines(ctx, artistLines, cursorY, ARTIST_LINE_HEIGHT);
  }

  await writeFile(path, canvas.toBuffer("image/png"));
  return true;
}

// 이미지: 500x500 정사각형, 텍스트는 아래에 줄바꿈 표시
// 텍스트는 Node canvas로 만든 PNG 레이어를 ffmpeg overlay로 합성
function buildFilterComplex(bgColor: string, hasTextOverlay: boolean): string {
  const ffmpegColor = toFfmpegColor(bgColor);

  const scale =
    `[1:v]scale=${COVER_SIZE}:${COVER_SIZE}:force_original_aspect_ratio=decrease,` +
    `pad=${COVER_SIZE}:${COVER_SIZE}:(ow-iw)/2:(oh-ih)/2:color=${ffmpegColor}[img]`;

  const overlay = `[0:v][img]overlay=(W-w)/2:${COVER_TOP}[withimg]`;

  if (!hasTextOverlay) return `${scale};${overlay};[withimg]copy[vout]`;
  return `${scale};${overlay};[withimg][2:v]overlay=0:0[vout]`;
}

function runFfmpeg(args: string[], id: string, signal: AbortSignal): Promise<void> {
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

export async function POST(req: NextRequest) {
  const id = crypto.randomUUID();
  const startedAt = Date.now();
  let audioPath = "";
  let imagePath = "";
  let textOverlayPath = "";
  const outputPath = join("/tmp", `${id}.mp4`);

  try {
    req.signal.addEventListener("abort", () => {
      logRender(id, "request:aborted", { elapsedMs: Date.now() - startedAt });
    }, { once: true });

    logRender(id, "request:start", {
      contentType: req.headers.get("content-type"),
    });

    const { audioFile, audioUrl, imageFile, imageUrl, title, bgColor, textColor, artist } =
      await parseSources(req);

    logRender(id, "request:parsed", {
      titleLength: title.length,
      artistLength: artist.length,
      hasAudioFile: Boolean(audioFile),
      hasAudioUrl: Boolean(audioUrl),
      hasImageFile: Boolean(imageFile),
      hasImageUrl: Boolean(imageUrl),
      audioFileSize: audioFile?.size,
      imageFileSize: imageFile?.size,
    });

    logRender(id, "inputs:resolve:start");
    const [audio, image] = await Promise.all([
      resolveBuffer(audioFile, audioUrl, { map: AUDIO_EXT, fallback: ".mp3" }, req.signal),
      resolveBuffer(imageFile, imageUrl, { map: IMAGE_EXT, fallback: ".jpg" }, req.signal),
    ]);
    throwIfAborted(req.signal);

    logRender(id, "inputs:resolve:done", {
      audioBytes: audio.buffer.byteLength,
      audioExt: audio.fileExt,
      imageBytes: image.buffer.byteLength,
      imageExt: image.fileExt,
    });

    audioPath = join("/tmp", `${id}${audio.fileExt}`);
    imagePath = join("/tmp", `${id}${image.fileExt}`);
    textOverlayPath = join("/tmp", `${id}-text.png`);

    logRender(id, "temp:write:start");
    await Promise.all([
      writeFile(audioPath, audio.buffer),
      writeFile(imagePath, image.buffer),
    ]);
    throwIfAborted(req.signal);
    logRender(id, "temp:write:done");

    logRender(id, "text-overlay:start");
    const hasTextOverlay = await createTextOverlay(textOverlayPath, textColor, artist, title);
    throwIfAborted(req.signal);
    logRender(id, "text-overlay:done", { hasTextOverlay });

    const ffmpegColor = toFfmpegColor(bgColor);
    const filterComplex = buildFilterComplex(bgColor, hasTextOverlay);
    const audioMap = hasTextOverlay ? "3:a" : "2:a";
    const textOverlayInput = hasTextOverlay ? ["-loop", "1", "-i", textOverlayPath] : [];

    await runFfmpeg([
      "-y",
      "-f",
      "lavfi",
      "-i",
      `color=c=${ffmpegColor}:s=1920x1080:r=25`,
      "-loop",
      "1",
      "-i",
      imagePath,
      ...textOverlayInput,
      "-i",
      audioPath,
      "-filter_complex",
      filterComplex,
      "-map",
      "[vout]",
      "-map",
      audioMap,
      "-c:v",
      "libx264",
      "-tune",
      "stillimage",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-pix_fmt",
      "yuv420p",
      "-shortest",
      outputPath,
    ], id, req.signal);

    logRender(id, "output:read:start");
    throwIfAborted(req.signal);
    const videoBuffer = await readFile(outputPath);
    logRender(id, "output:read:done", {
      outputBytes: videoBuffer.byteLength,
      elapsedMs: Date.now() - startedAt,
    });

    const safeTitle = sanitizeDownloadTitle(title);

    return new NextResponse(videoBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(safeTitle)}.mp4`,
      },
    });
  } catch (error) {
    if (isAbortError(error)) {
      logRender(id, "request:abort-handled", { elapsedMs: Date.now() - startedAt });
      return NextResponse.json({ error: "영상 생성 요청이 취소되었습니다" }, { status: 499 });
    }

    console.error("[render-video]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "영상 생성 실패" },
      { status: 500 }
    );
  } finally {
    logRender(id, "cleanup:start");
    await Promise.allSettled([
      audioPath && unlink(audioPath).catch(() => {}),
      imagePath && unlink(imagePath).catch(() => {}),
      textOverlayPath && unlink(textOverlayPath).catch(() => {}),
      unlink(outputPath).catch(() => {}),
    ]);
    logRender(id, "cleanup:done", { elapsedMs: Date.now() - startedAt });
  }
}
