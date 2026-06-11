import { Persona, Track } from "./types";

const PERSONA_KEY = "ai-musician:personas";
const TRACK_KEY = "ai-musician:tracks";

export function loadPersonas(): Persona[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(PERSONA_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function savePersonas(personas: Persona[]): void {
  localStorage.setItem(PERSONA_KEY, JSON.stringify(personas));
}

export function loadTracks(): Track[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(TRACK_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveTracks(tracks: Track[]): void {
  localStorage.setItem(TRACK_KEY, JSON.stringify(tracks));
}
