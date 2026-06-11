import { GlobalFonts } from "@napi-rs/canvas";
import { access } from "fs/promises";

export const LATIN_FONT_FAMILY = "AiMusicianLatin";
export const KOREAN_FONT_FAMILY = "AiMusicianKorean";

export const FONT_CANDIDATES = [
  "/System/Library/Fonts/Avenir.ttc",
  "/System/Library/Fonts/Helvetica.ttc",
  "/Library/Fonts/Arial.ttf",
  "/System/Library/Fonts/Supplemental/Arial.ttf",
  "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
];

export const KOREAN_FONT_CANDIDATES = [
  "/System/Library/Fonts/AppleSDGothicNeo.ttc",
  "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
  "/System/Library/Fonts/AppleGothic.ttf",
  "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
  "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
  "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
];

export let registeredTextFonts = false;

export async function findFont(candidates: string[]): Promise<string | null> {
  for (const p of candidates) {
    try {
      await access(p);
      return p;
    } catch {}
  }
  return null;
}

export async function registerTextFont(): Promise<void> {
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
