export interface UserProfile {
  nickname: string;
  diet: "normal" | "vegetarian" | "vegan" | "low-sodium";
  allergies: string[];
  excludeAllergies: boolean;
  specialNote: string;
  createdAt: string;
}

export interface SavedRecipe {
  id: string;
  name: string;
  description: string;
  time: string;
  difficulty: string;
  usedIngredients: string[];
  missingIngredients: string[];
  steps: string[];
  savedAt: string;
  favorited?: boolean;
}

function tryParse<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}

function trySave(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function getProfile(): UserProfile | null {
  return tryParse<UserProfile>("fridge_user_profile");
}

export function saveProfile(profile: UserProfile): void {
  trySave("fridge_user_profile", profile);
}

export function getSavedRecipes(): SavedRecipe[] {
  return tryParse<SavedRecipe[]>("fridge_saved_recipes") ?? [];
}

export function addSavedRecipe(recipe: Omit<SavedRecipe, "id" | "savedAt">): SavedRecipe {
  const saved: SavedRecipe = {
    ...recipe,
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
  };
  const next = [saved, ...getSavedRecipes()].slice(0, 50);
  trySave("fridge_saved_recipes", next);
  return saved;
}

export function deleteSavedRecipe(id: string): void {
  trySave("fridge_saved_recipes", getSavedRecipes().filter((r) => r.id !== id));
}

export function toggleFavoriteRecipe(id: string): void {
  trySave("fridge_saved_recipes", getSavedRecipes().map((r) =>
    r.id === id ? { ...r, favorited: !r.favorited } : r
  ));
}
