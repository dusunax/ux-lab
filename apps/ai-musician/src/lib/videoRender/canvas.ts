import { createCanvas } from "@napi-rs/canvas";
import { writeFile } from "fs/promises";
import { registerTextFont, registeredTextFonts, LATIN_FONT_FAMILY, KOREAN_FONT_FAMILY } from "./fonts";

export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;
export const COVER_SIZE = 500;
export const COVER_TOP = 210;
export const TEXT_TOP = COVER_TOP + COVER_SIZE + 48;
export const TEXT_MAX_WIDTH = 780;
export const TITLE_FONT_SIZE = 34;
export const TITLE_LINE_HEIGHT = 42;
export const ARTIST_FONT_SIZE = 22;
export const ARTIST_LINE_HEIGHT = 30;

export function normalizeOverlayText(text: string): string {
  return text.normalize("NFC").replace(/\r?\n/g, " ").trim();
}

type CanvasCtx = ReturnType<ReturnType<typeof createCanvas>["getContext"]>;

function wrapText(ctx: CanvasCtx, text: string, maxWidth: number): string[] {
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

function drawLines(ctx: CanvasCtx, lines: string[], y: number, lineHeight: number): number {
  for (const line of lines) {
    ctx.fillText(line, VIDEO_WIDTH / 2, y);
    y += lineHeight;
  }
  return y;
}

export async function createTextOverlay(
  path: string,
  textColor: string,
  artist: string,
  title: string
): Promise<boolean> {
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
