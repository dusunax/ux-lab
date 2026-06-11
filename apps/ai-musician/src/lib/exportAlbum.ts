import { Persona, Track } from "./types";

export function exportAlbum(persona: Persona, tracks: Track[]): void {
  const album = {
    musician: {
      name: persona.name,
      genre: persona.genre,
      worldview: persona.worldview,
      signatureSound: persona.signatureSound,
      albumConcept: persona.albumConcept,
      coverImageUrl: persona.coverImageUrl,
    },
    tracks: tracks.map((t, i) => ({
      trackNumber: i + 1,
      title: t.title,
      tags: t.tags,
      prompt: t.prompt,
      audioUrl: t.audioUrl,
      coverImageUrl: t.coverImageUrl,
      createdAt: t.createdAt,
    })),
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(album, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${persona.name.replace(/\s+/g, "-")}-album.json`;
  a.click();
  URL.revokeObjectURL(url);
}
