import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink } from "fs/promises";
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
    };
  }

  const body = await req.json();
  return {
    audioFile: null,
    audioUrl: body.audioUrl as string | null,
    imageFile: null,
    imageUrl: body.imageUrl as string | null,
    title: (body.title as string | null) ?? "track",
  };
}

export async function POST(req: NextRequest) {
  const { audioFile, audioUrl, imageFile, imageUrl, title } = await parseSources(req);

  const id = crypto.randomUUID();
  let audioPath = "";
  let imagePath = "";
  const outputPath = join("/tmp", `${id}.mp4`);

  try {
    const [audio, image] = await Promise.all([
      resolveBuffer(audioFile, audioUrl, { map: AUDIO_EXT, fallback: ".mp3" }),
      resolveBuffer(imageFile, imageUrl, { map: IMAGE_EXT, fallback: ".jpg" }),
    ]);

    audioPath = join("/tmp", `${id}${audio.fileExt}`);
    imagePath = join("/tmp", `${id}${image.fileExt}`);

    await Promise.all([
      writeFile(audioPath, audio.buffer),
      writeFile(imagePath, image.buffer),
    ]);

    await execAsync(
      `ffmpeg -y -loop 1 -i "${imagePath}" -i "${audioPath}"` +
        ` -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1"` +
        ` -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${outputPath}"`
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
