import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink, access } from "fs/promises";
import { join, extname } from "path";

const execAsync = promisify(exec);

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
  "/System/Library/Fonts/Helvetica.ttc",
  "/Library/Fonts/Arial.ttf",
  "/System/Library/Fonts/Supplemental/Arial.ttf",
  "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
];

async function findFont(): Promise<string | null> {
  for (const p of FONT_CANDIDATES) {
    try {
      await access(p);
      return p;
    } catch {}
  }
  return null;
}

function escapeDrawtext(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");
}

function toFfmpegColor(hex: string): string {
  return "0x" + hex.replace("#", "").toUpperCase();
}

function extFromMime(mime: string, map: Record<string, string>, fallback: string) {
  return map[mime.split(";")[0].trim()] ?? fallback;
}

async function resolveBuffer(
  file: File | null,
  url: string | null,
  ext: { map: Record<string, string>; fallback: string }
): Promise<{ buffer: Buffer; fileExt: string }> {
  if (file) {
    const fileExt = extname(file.name) || extFromMime(file.type, ext.map, ext.fallback);
    return { buffer: Buffer.from(await file.arrayBuffer()), fileExt };
  }
  if (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`다운로드 실패 (${res.status}): ${url}`);
    const mime = res.headers.get("content-type") ?? "";
    const fileExt = extFromMime(mime, ext.map, ext.fallback);
    return { buffer: Buffer.from(await res.arrayBuffer()), fileExt };
  }
  throw new Error("audio 또는 image 입력이 필요합니다");
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
      bgColor: (fd.get("bgColor") as string | null) ?? "#0a0a0f",
      artist: (fd.get("artist") as string | null) ?? "",
      composer: (fd.get("composer") as string | null) ?? "",
    };
  }

  const body = await req.json();
  return {
    audioFile: null,
    audioUrl: body.audioUrl as string | null,
    imageFile: null,
    imageUrl: body.imageUrl as string | null,
    title: (body.title as string | null) ?? "track",
    bgColor: (body.bgColor as string | null) ?? "#0a0a0f",
    artist: (body.artist as string | null) ?? "",
    composer: (body.composer as string | null) ?? "",
  };
}

// 이미지: 680×680 정사각형, y=100에 중앙 배치
// 가수/작가 텍스트: 이미지 아래 (y≈800, y≈858)
function buildFilterComplex(bgColor: string, fontPath: string | null, artist: string, composer: string): string {
  const ffmpegColor = toFfmpegColor(bgColor);
  const fontAttr = fontPath ? `fontfile='${fontPath}':` : "";
  const hasText = fontPath && (artist || composer);

  const scale =
    `[1:v]scale=680:680:force_original_aspect_ratio=decrease,` +
    `pad=680:680:(ow-iw)/2:(oh-ih)/2:color=${ffmpegColor}[img]`;

  const overlay = `[0:v][img]overlay=(W-w)/2:100[withimg]`;

  if (!hasText) return `${scale};${overlay};[withimg]copy[vout]`;

  const parts = [scale, overlay];
  let lastLabel = "withimg";

  if (artist) {
    const escaped = escapeDrawtext(artist);
    parts.push(
      `[${lastLabel}]drawtext=${fontAttr}text='${escaped}':fontsize=50:fontcolor=white:` +
        `x=(w-tw)/2:y=800:shadowcolor=black:shadowx=2:shadowy=2[v_artist]`
    );
    lastLabel = "v_artist";
  }

  if (composer) {
    const escaped = escapeDrawtext(composer);
    parts.push(
      `[${lastLabel}]drawtext=${fontAttr}text='${escaped}':fontsize=30:fontcolor=white@0.75:` +
        `x=(w-tw)/2:y=860[vout]`
    );
  } else {
    parts.push(`[${lastLabel}]copy[vout]`);
  }

  return parts.join(";");
}

export async function POST(req: NextRequest) {
  const { audioFile, audioUrl, imageFile, imageUrl, title, bgColor, artist, composer } =
    await parseSources(req);

  const id = crypto.randomUUID();
  let audioPath = "";
  let imagePath = "";
  const outputPath = join("/tmp", `${id}.mp4`);

  try {
    const [audio, image, fontPath] = await Promise.all([
      resolveBuffer(audioFile, audioUrl, { map: AUDIO_EXT, fallback: ".mp3" }),
      resolveBuffer(imageFile, imageUrl, { map: IMAGE_EXT, fallback: ".jpg" }),
      findFont(),
    ]);

    audioPath = join("/tmp", `${id}${audio.fileExt}`);
    imagePath = join("/tmp", `${id}${image.fileExt}`);

    await Promise.all([
      writeFile(audioPath, audio.buffer),
      writeFile(imagePath, image.buffer),
    ]);

    const ffmpegColor = toFfmpegColor(bgColor);
    const filterComplex = buildFilterComplex(bgColor, fontPath, artist, composer);

    await execAsync(
      `ffmpeg -y` +
        ` -f lavfi -i "color=c=${ffmpegColor}:s=1920x1080:r=25"` +
        ` -loop 1 -i "${imagePath}"` +
        ` -i "${audioPath}"` +
        ` -filter_complex "${filterComplex}"` +
        ` -map "[vout]" -map 2:a` +
        ` -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest` +
        ` "${outputPath}"`
    );

    const videoBuffer = await readFile(outputPath);
    const safeTitle = title.replace(/[^\w가-힣 _-]/g, "").trim() || "track";

    return new NextResponse(videoBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(safeTitle)}.mp4`,
      },
    });
  } catch (error) {
    console.error("[render-video]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "영상 생성 실패" },
      { status: 500 }
    );
  } finally {
    await Promise.allSettled([
      audioPath && unlink(audioPath).catch(() => {}),
      imagePath && unlink(imagePath).catch(() => {}),
      unlink(outputPath).catch(() => {}),
    ]);
  }
}
