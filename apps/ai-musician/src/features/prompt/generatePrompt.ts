import { Persona } from "@/lib/types";

// Suno Advanced > Style of Music
export function generateSunoStyle(persona: Persona): string {
  return [persona.genre, persona.signatureSound].filter(Boolean).join(", ");
}

// Suno Advanced > Lyrics/Prompt — 페르소나 + 트랙 스토리 합성
export function buildSunoLyrics(
  persona: Persona,
  trackTitle: string,
  trackStory: string
): string {
  const parts: string[] = [];

  if (persona.sunoPrompt) {
    parts.push(persona.sunoPrompt.trim());
  }

  const trackLines = [
    trackTitle && `[Track] ${trackTitle}`,
    trackStory && `[Story] ${trackStory}`,
  ].filter(Boolean).join("\n");

  if (trackLines) parts.push(trackLines);

  return parts.join("\n\n");
}

// 내부 참고용 전체 프롬프트
export function generatePrompt(persona: Persona, trackTitle: string): string {
  return [
    `[Genre] ${persona.genre}`,
    persona.worldview ? `[Worldview] ${persona.worldview}` : null,
    persona.signatureSound ? `[Sound] ${persona.signatureSound}` : null,
    persona.albumConcept ? `[Album] ${persona.albumConcept}` : null,
    `[Track] ${trackTitle}`,
  ]
    .filter(Boolean)
    .join("\n");
}

// 앱 내부 태그 뱃지용
export function generateTags(persona: Persona): string[] {
  return [
    persona.genre.toLowerCase(),
    ...persona.signatureSound.split(",").map((s) => s.trim().toLowerCase()),
  ].filter(Boolean);
}

export const generateSunoTags = generateSunoStyle;
