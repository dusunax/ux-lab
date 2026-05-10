"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SavedRecipeCard from "@/components/SavedRecipeCard";
import { getSavedRecipes, deleteSavedRecipe, toggleFavoriteRecipe, getProfile, type SavedRecipe } from "@/lib/storage";

export default function SavedPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setRecipes(getSavedRecipes());
    const profile = getProfile();
    if (profile) setAllergies(profile.allergies);
  }, []);

  function handleDelete(id: string) {
    setPendingDeleteId(id);
  }

  function confirmDelete() {
    if (!pendingDeleteId) return;
    deleteSavedRecipe(pendingDeleteId);
    setRecipes((prev) => prev.filter((r) => r.id !== pendingDeleteId));
    setPendingDeleteId(null);
  }

  function handleFavorite(id: string) {
    toggleFavoriteRecipe(id);
    setRecipes((prev) => prev.map((r) => r.id === id ? { ...r, favorited: !r.favorited } : r));
  }

  const filteredRecipes = favoritesOnly ? recipes.filter((r) => r.favorited) : recipes;

  const pendingRecipeName = pendingDeleteId ? recipes.find((r) => r.id === pendingDeleteId)?.name : null;

  return (
    <main className="min-h-screen pb-20" style={{ background: "var(--bg)" }}>
      {/* Delete confirmation dialog */}
      {pendingDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center pb-6 px-6"
          style={{ background: "rgba(0,0,0,0.4)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div
            className="w-full max-w-[520px] rounded-sm p-5 space-y-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div>
              <p id="delete-dialog-title" className="text-sm font-medium" style={{ color: "var(--text)" }}>
                레시피를 삭제하시겠어요?
              </p>
              {pendingRecipeName && (
                <p className="mt-1 font-mono text-xs" style={{ color: "var(--muted)" }}>
                  &ldquo;{pendingRecipeName}&rdquo;이(가) 영구적으로 삭제됩니다.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingDeleteId(null)}
                className="flex-1 rounded-sm py-2.5 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ border: "1px solid var(--border)", color: "var(--text)", background: "transparent" }}
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 rounded-sm py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: "var(--danger)", color: "white", border: "none" }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-[520px] px-6 py-12">
        <header className="mb-6">
          <div className="mb-3 flex items-center gap-3">
            <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--muted)" }}>
              저장된 레시피
            </span>
            <span className="h-px flex-1" style={{ background: "var(--border)" }} />
            {recipes.length > 0 && (
              <span className="font-mono text-xs" style={{ color: "var(--warm)" }}>
                {recipes.length}개
              </span>
            )}
          </div>
          <h1 className="font-display text-4xl font-light leading-tight" style={{ color: "var(--text)" }}>
            내 레시피<br />
            <em className="not-italic" style={{ color: "var(--accent-mid)", fontWeight: 500 }}>북마크</em>
          </h1>
          {recipes.some((r) => r.favorited) && (
            <div className="-mb-3 flex gap-2 justify-end">
              <button
                onClick={() => setFavoritesOnly(false)}
                className="flex items-center gap-1.5 rounded-sm px-3 py-1.5 font-mono text-xs transition-all duration-150 active:scale-95"
                aria-pressed={!favoritesOnly}
                style={!favoritesOnly ? {
                  background: "var(--accent)",
                  color: "var(--surface)",
                  border: "1px solid var(--accent)",
                } : {
                  background: "transparent",
                  color: "var(--muted)",
                  border: "1px solid var(--border)",
                }}
              >
                전체
              </button>
              <button
                onClick={() => setFavoritesOnly(true)}
                className="flex items-center gap-1.5 rounded-sm px-3 py-1.5 font-mono text-xs transition-all duration-150 active:scale-95"
                aria-pressed={favoritesOnly}
                style={favoritesOnly ? {
                  background: "var(--warm)",
                  color: "var(--surface)",
                  border: "1px solid var(--warm)",
                } : {
                  background: "transparent",
                  color: "var(--muted)",
                  border: "1px solid var(--border)",
                }}
              >
                <svg width="11" height="11" viewBox="0 0 16 16" fill={favoritesOnly ? "var(--surface)" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="8,1.5 10.09,5.74 14.85,6.41 11.42,9.74 12.18,14.5 8,12.27 3.82,14.5 4.58,9.74 1.15,6.41 5.91,5.74" />
                </svg>
                즐겨찾기
              </button>
            </div>
          )}
        </header>

        {recipes.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>
              저장된 레시피가 없습니다
            </p>
            <button
              onClick={() => router.push("/")}
              className="rounded-sm px-6 py-3 text-sm font-medium"
              style={{ background: "var(--accent)", color: "var(--surface)" }}
            >
              냉장고 사진 찍으러 가기
            </button>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>즐겨찾기한 레시피가 없어요</p>
            <p className="font-mono text-xs" style={{ color: "var(--muted)" }}>
              레시피 카드의 별 아이콘을 눌러 즐겨찾기에 추가해 보세요.
            </p>
            <button
              onClick={() => setFavoritesOnly(false)}
              className="mt-2 font-mono text-xs underline underline-offset-2 transition-opacity hover:opacity-60"
              style={{ color: "var(--accent)" }}
            >
              전체 레시피 보기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecipes.map((recipe) => (
              <SavedRecipeCard key={recipe.id} recipe={recipe} onDelete={handleDelete} onFavorite={handleFavorite} allergies={allergies} index={recipes.length - recipes.indexOf(recipe)} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
