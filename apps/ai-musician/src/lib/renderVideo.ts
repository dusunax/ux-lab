import type { Track } from "./types";

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
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

async function downloadBlob(res: Response, title: string) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "영상 생성 실패");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeDownloadTitle(title)}.mp4`;
  a.click();
  URL.revokeObjectURL(url);
}

// URL 기반 (트랙 목록 / PlayerBar)
export async function renderVideo(
  track: Pick<Track, "audioUrl" | "coverImageUrl" | "title">,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch("/api/render-video", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audioUrl: track.audioUrl,
      imageUrl: track.coverImageUrl,
      title: track.title,
    }),
  });
  await downloadBlob(res, track.title);
}

// 파일 업로드 기반 (미발행 음원)
export async function renderVideoFromFiles({
  audioFile,
  imageFile,
  imageUrl,
  title,
  bgColor = "#e8e0f5",
  textColor = "#1a1a1a",
  artist = "",
  signal,
}: {
  audioFile: File;
  imageFile: File | null;
  imageUrl: string;
  title: string;
  bgColor?: string;
  textColor?: string;
  artist?: string;
  signal?: AbortSignal;
}): Promise<void> {
  const fd = new FormData();
  fd.append("audio", audioFile);
  if (imageFile) {
    fd.append("image", imageFile);
  } else if (imageUrl) {
    fd.append("imageUrl", imageUrl);
  }
  fd.append("title", title);
  fd.append("bgColor", bgColor);
  fd.append("textColor", textColor);
  fd.append("artist", artist);

  const res = await fetch("/api/render-video", { method: "POST", body: fd, signal });
  await downloadBlob(res, title || "track");
}
