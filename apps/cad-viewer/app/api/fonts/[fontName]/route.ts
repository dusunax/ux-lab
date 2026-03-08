import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import opentype from "opentype.js";

export const runtime = "nodejs";

// Cache converted fonts in memory for the lifetime of the server process
const cache = new Map<string, string>();

const INCLUDE_RANGES: [number, number][] = [
  [0x0020, 0x007e], // ASCII printable
  [0x00b0, 0x00b0], // °
  [0x00b1, 0x00b1], // ±
  [0x00d8, 0x00d8], // Ø
  [0x1100, 0x11ff], // Korean Jamo
  [0xac00, 0xd7a3], // Korean syllable blocks
];

function inRange(cp: number) {
  return INCLUDE_RANGES.some(([s, e]) => cp >= s && cp <= e);
}

const round = (v: number) => Math.round(v);

// Use glyph.path.commands (raw font coords, y↑) instead of getPath() which flips y to screen coords.
function glyphToO(glyph: opentype.Glyph, scale: number): string {
  const parts: string[] = [];
  for (const cmd of glyph.path.commands) {
    switch (cmd.type) {
      case "M":
        parts.push(`m ${round(cmd.x * scale)} ${round(cmd.y * scale)}`);
        break;
      case "L":
        parts.push(`l ${round(cmd.x * scale)} ${round(cmd.y * scale)}`);
        break;
      case "C":
        parts.push(
          `b ${round(cmd.x1 * scale)} ${round(cmd.y1 * scale)} ${round(cmd.x2 * scale)} ${round(cmd.y2 * scale)} ${round(cmd.x * scale)} ${round(cmd.y * scale)}`
        );
        break;
      case "Q":
        parts.push(
          `q ${round(cmd.x1 * scale)} ${round(cmd.y1 * scale)} ${round(cmd.x * scale)} ${round(cmd.y * scale)}`
        );
        break;
      case "Z":
        parts.push("z");
        break;
    }
  }
  return parts.join(" ");
}

function glyphToEntry(glyph: opentype.Glyph, scale: number) {
  const metrics = glyph.getMetrics();
  return {
    x_min: round((metrics.xMin ?? 0) * scale),
    x_max: round((metrics.xMax ?? 0) * scale),
    ha: round((glyph.advanceWidth ?? 0) * scale),
    o: glyphToO(glyph, scale),
  };
}

function ttfToTypeface(buffer: ArrayBuffer): string {
  const font = opentype.parse(buffer);
  const RESOLUTION = 1000;
  const scale = RESOLUTION / font.unitsPerEm;
  const os2 = (font.tables as Record<string, unknown>).os2 as
    | { sTypoAscender?: number; sTypoDescender?: number }
    | undefined;
  const ascender = os2?.sTypoAscender != null ? round(os2.sTypoAscender * scale) : round(font.ascender * scale);
  const descender = os2?.sTypoDescender != null ? round(os2.sTypoDescender * scale) : round(font.descender * scale);

  const glyphs: Record<string, unknown> = {};

  for (const [start, end] of INCLUDE_RANGES) {
    for (let cp = start; cp <= end; cp++) {
      const char = String.fromCodePoint(cp);
      const glyph = font.charToGlyph(char);
      if (!glyph || glyph.index === 0) continue;
      glyphs[char] = glyphToEntry(glyph, scale);
    }
  }

  // Ensure "?" fallback
  if (!glyphs["?"]) {
    const q = font.charToGlyph("?");
    if (q && q.index !== 0) glyphs["?"] = glyphToEntry(q, scale);
  }

  const familyName =
    (font.names as Record<string, unknown>)?.fontFamily != null
      ? ((font.names as Record<string, Record<string, string>>).fontFamily.en ?? "Font")
      : "Font";

  return JSON.stringify({
    familyName,
    ascender,
    descender,
    resolution: RESOLUTION,
    boundingBox: { yMin: descender, xMin: 0, yMax: ascender, xMax: RESOLUTION },
    glyphs,
  });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ fontName: string }> }) {
  const { fontName } = await params;

  // Only allow .ttf files from public/fonts/
  if (!fontName.endsWith(".ttf") || fontName.includes("..") || fontName.includes("/")) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (cache.has(fontName)) {
    return new NextResponse(cache.get(fontName)!, {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=86400" },
    });
  }

  const fontPath = join(process.cwd(), "public", "fonts", fontName);
  let buffer: Buffer;
  try {
    buffer = await readFile(fontPath);
  } catch {
    return new NextResponse("Font file not found", { status: 404 });
  }

  const json = ttfToTypeface(buffer.buffer as ArrayBuffer);
  cache.set(fontName, json);

  return new NextResponse(json, {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=86400" },
  });
}
