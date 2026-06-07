import { Persona } from "@/lib/types";

// Suno Advanced > Style of Music
export function generateSunoStyle(persona: Persona): string {
  return [persona.genre, persona.signatureSound].filter(Boolean).join(", ");
}

// Suno Advanced > Lyrics/Prompt — 프롬프트(페르소나+스토리) + 가사 합성
export function buildSunoLyrics(
  persona: Persona,
  trackTitle: string,
  trackStory: string,
  lyrics: string
): string {
  const parts: string[] = [];

  if (persona.sunoPrompt) {
    parts.push(persona.sunoPrompt.trim());
  }

  const storyLines = [
    trackTitle && `[Track] ${trackTitle}`,
    trackStory && `[Story] ${trackStory}`,
  ].filter(Boolean).join("\n");

  if (storyLines) parts.push(storyLines);

  if (lyrics.trim()) parts.push(lyrics.trim());

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
