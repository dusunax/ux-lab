import { extname } from "path";
import { throwIfAborted } from "./abort";

export const AUDIO_EXT: Record<string, string> = {
  "audio/mpeg": ".mp3",
  "audio/mp4": ".m4a",
  "audio/x-m4a": ".m4a",
  "audio/wav": ".wav",
  "audio/ogg": ".ogg",
  "audio/flac": ".flac",
};

export const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export function extFromMime(mime: string, map: Record<string, string>, fallback: string): string {
  return map[mime.split(";")[0].trim()] ?? fallback;
}

export async function resolveBuffer(
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

export function sanitizeDownloadTitle(title: string): string {
  // eslint-disable-next-line no-control-regex
  const safeTitle = title
    .normalize("NFC")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+$/, "");

  return safeTitle || "track";
}
