import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile, unlink } from "fs/promises";
import { join } from "path";
import { isAbortError, throwIfAborted } from "@/lib/videoRender/abort";
import { AUDIO_EXT, IMAGE_EXT, resolveBuffer, sanitizeDownloadTitle } from "@/lib/videoRender/media";
import { createTextOverlay } from "@/lib/videoRender/canvas";
import { toFfmpegColor, buildFilterComplex, runFfmpeg, logRender } from "@/lib/videoRender/ffmpeg";

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

    logRender(id, "request:start", { contentType: req.headers.get("content-type") });

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
      "-f", "lavfi",
      "-i", `color=c=${ffmpegColor}:s=1920x1080:r=25`,
      "-loop", "1",
      "-i", imagePath,
      ...textOverlayInput,
      "-i", audioPath,
      "-filter_complex", filterComplex,
      "-map", "[vout]",
      "-map", audioMap,
      "-c:v", "libx264",
      "-tune", "stillimage",
      "-c:a", "aac",
      "-b:a", "192k",
      "-pix_fmt", "yuv420p",
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
