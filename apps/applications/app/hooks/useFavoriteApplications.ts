"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "favorite_applications";

export function useFavoriteApplications() {
  const [favoriteApplicationIds, setFavoriteApplicationIds] = useState<
    string[]
  >([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setFavoriteApplicationIds(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to load favorite applications:", error);
      }
    }
  }, []);

  const saveToStorage = (ids: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    setFavoriteApplicationIds(ids);
  };

  const addFavorite = (applicationId: string) => {
    if (!favoriteApplicationIds.includes(applicationId)) {
      saveToStorage([...favoriteApplicationIds, applicationId]);
    }
  };

  const removeFavorite = (applicationId: string) => {
    saveToStorage(favoriteApplicationIds.filter((id) => id !== applicationId));
  };

  const toggleFavorite = (applicationId: string) => {
    if (favoriteApplicationIds.includes(applicationId)) {
      removeFavorite(applicationId);
    } else {
      addFavorite(applicationId);
    }
  };

  const isFavorite = (applicationId: string) => {
    return favoriteApplicationIds.includes(applicationId);
  };

  return {
    favoriteApplicationIds,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  };
}
