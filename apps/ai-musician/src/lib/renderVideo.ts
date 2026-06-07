import { Track } from "./types";

async function downloadBlob(res: Response, title: string) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "영상 생성 실패");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title}.mp4`;
  a.click();
  URL.revokeObjectURL(url);
}

// URL 기반 (트랙 목록 / PlayerBar)
export async function renderVideo(
  track: Pick<Track, "audioUrl" | "coverImageUrl" | "title">
): Promise<void> {
  const res = await fetch("/api/render-video", {
    method: "POST",
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
  bgColor = "#0a0a0f",
  artist = "",
  composer = "",
}: {
  audioFile: File;
  imageFile: File | null;
  imageUrl: string;
  title: string;
  bgColor?: string;
  artist?: string;
  composer?: string;
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
  fd.append("artist", artist);
  fd.append("composer", composer);

  const res = await fetch("/api/render-video", { method: "POST", body: fd });
  await downloadBlob(res, title || "track");
}
