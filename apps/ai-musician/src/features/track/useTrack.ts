"use client";

import { useState, useEffect, useCallback } from "react";
import { Track } from "@/lib/types";
import { loadTracks, saveTracks } from "@/lib/storage";

export function useTrack() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);

  useEffect(() => {
    setTracks(loadTracks());
  }, []);

  const activeTrack = tracks.find((t) => t.id === activeTrackId) ?? null;

  const addTrack = useCallback((track: Omit<Track, "id" | "createdAt">) => {
    const next: Track = {
      ...track,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTracks((prev) => {
      const updated = [...prev, next];
      saveTracks(updated);
      return updated;
    });
    setActiveTrackId(next.id);
  }, []);

  const removeTrack = useCallback((id: string) => {
    setTracks((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveTracks(updated);
      return updated;
    });
    setActiveTrackId((prev) => (prev === id ? null : prev));
  }, []);

  const updateTrack = useCallback((id: string, patch: Partial<Omit<Track, "id" | "personaId" | "createdAt">>) => {
    setTracks((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...patch } : t));
      saveTracks(updated);
      return updated;
    });
  }, []);

  const tracksByPersona = useCallback(
    (personaId: string) => tracks.filter((t) => t.personaId === personaId),
    [tracks]
  );

  return { tracks, activeTrack, activeTrackId, setActiveTrackId, addTrack, updateTrack, removeTrack, tracksByPersona };
}
