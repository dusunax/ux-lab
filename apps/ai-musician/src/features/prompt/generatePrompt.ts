import { Persona } from "@/lib/types";

export function generatePrompt(persona: Persona, trackTitle: string): string {
  const parts = [
    `[Genre] ${persona.genre}`,
    `[Artist Worldview] ${persona.worldview}`,
    `[Signature Sound] ${persona.signatureSound}`,
    `[Album Concept] ${persona.albumConcept}`,
    `[Track] ${trackTitle}`,
    `[Style] instrumental, high quality, rich production`,
  ];
  return parts.join("\n");
}

export function generateTags(persona: Persona): string[] {
  return [
    persona.genre.toLowerCase(),
    ...persona.signatureSound.split(",").map((s) => s.trim().toLowerCase()),
  ].filter(Boolean);
}

// Suno용 스타일 태그 — genre + signatureSound를 콤마로 합침
export function generateSunoTags(persona: Persona): string {
  return [persona.genre, persona.signatureSound, persona.worldview ? "atmospheric" : ""]
    .filter(Boolean)
    .join(", ");
}
