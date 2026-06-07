"use client";

import { useState, useEffect, useCallback } from "react";
import { Persona } from "@/lib/types";
import { loadPersonas, savePersonas } from "@/lib/storage";

export function usePersona() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadPersonas();
    setPersonas(stored);
    if (stored.length > 0) setActiveId(stored[0].id);
  }, []);

  const activePersona = personas.find((p) => p.id === activeId) ?? null;

  const addPersona = useCallback((persona: Omit<Persona, "id" | "createdAt">) => {
    const next: Persona = {
      ...persona,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setPersonas((prev) => {
      const updated = [...prev, next];
      savePersonas(updated);
      return updated;
    });
    setActiveId(next.id);
  }, []);

  const updatePersona = useCallback((id: string, patch: Partial<Persona>) => {
    setPersonas((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
      savePersonas(updated);
      return updated;
    });
  }, []);

  const removePersona = useCallback((id: string) => {
    setPersonas((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      savePersonas(updated);
      return updated;
    });
    setActiveId((prev) => (prev === id ? null : prev));
  }, []);

  return { personas, activePersona, activeId, setActiveId, addPersona, updatePersona, removePersona };
}
