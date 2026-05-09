"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ConditionSelector from "@/components/ConditionSelector";
import RecipeCard from "@/components/RecipeCard";
import RecipeCardSkeleton from "@/components/RecipeCardSkeleton";
import { fetchRecipes, type Recipe, type Conditions } from "@/lib/recipeApi";

const DEFAULT_CONDITIONS: Conditions = {
  maxTime: null,
  difficulty: null,
  diet: "normal",
  cuisine: "any",
};


function saveToLocalStorage(recipe: Recipe): Recipe {
  const saved = recipe.savedAt ? recipe : { ...recipe, savedAt: new Date().toISOString() };
  try {
    const raw = localStorage.getItem("fridge_saved_recipes");
    const list: Recipe[] = raw ? JSON.parse(raw) : [];
    const next = [saved, ...list].slice(0, 50);
    localStorage.setItem("fridge_saved_recipes", JSON.stringify(next));
  } catch {}
  return saved;
}

function isNearBottom(threshold = 80) {
  return window.scrollY + window.innerHeight >= document.body.scrollHeight - threshold;
}

export default function Step2Page() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const ingredients = (searchParams.get("ingredients") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const [conditions, setConditions] = useState<Conditions>(DEFAULT_CONDITIONS);
  const [conditionsOpen, setConditionsOpen] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [streamingRecipes, setStreamingRecipes] = useState<Recipe[]>([]);
  const [status, setStatus] = useState<"idle" | "streaming" | "done" | "error">("idle");
  const [streamStartedAt, setStreamStartedAt] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const autoScrollRef = useRef(true);

  useEffect(() => {
    if (ingredients.length === 0) router.replace("/");
  }, []);

  useEffect(() => {
    function onScroll() {
      const atBottom = isNearBottom();
      setShowScrollBtn(!atBottom);
      autoScrollRef.current = atBottom;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 새 레시피 카드 완성 시 스크롤 (스트리밍 중에만)
  useEffect(() => {
    if (status === "streaming" && streamingRecipes.length > 0 && autoScrollRef.current) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  }, [streamingRecipes.length]);

  useEffect(() => {
    if (status === "streaming") {
      autoScrollRef.current = true;
      setShowScrollBtn(false);
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }, 50);
    }
    if (status === "done") {
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }, 100);
    }
  }, [status]);

  const request = useCallback(async () => {
    const now = Date.now();
    setStatus("streaming");
    setStreamStartedAt(now);
    setConditionsOpen(false);
    setErrorMessage(null);
    setRecipes([]);
    setStreamingRecipes([]);
    try {
      const result = await fetchRecipes(ingredients, conditions, (found) => {
        setStreamingRecipes(found);
      });
      setRecipes(result);
      setStatus("done");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "알 수 없는 오류");
      setStatus("error");
    }
  }, [ingredients, conditions]);

  function handleSave(recipe: Recipe) {
    saveToLocalStorage(recipe);
    setSavedIds((prev) => new Set([...prev, recipe.name]));
  }

  function scrollToBottom() {
    autoScrollRef.current = true;
    setShowScrollBtn(false);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  const skeletonCount = status === "streaming" ? 1 : 0;

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-[520px] px-6 py-16">

        {/* Header */}
        <header className="mb-6">
          <div className="mb-3 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 font-mono text-xs tracking-widest uppercase transition-opacity hover:opacity-60"
              style={{ color: "var(--muted)" }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="7,1 3,5 7,9" />
              </svg>
              Step 01
            </button>
            <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--muted)" }}>
              / Step 02 / 03
            </span>
            <span className="h-px flex-1" style={{ background: "var(--border)" }} />
          </div>
          <h1
            className="font-display text-5xl font-light leading-[1.1] tracking-tight"
            style={{ color: "var(--text)" }}
          >
            재료로 만드는<br />
            <em className="not-italic" style={{ color: "var(--accent-mid)", fontWeight: 500 }}>
              레시피 추천
            </em>
          </h1>
        </header>

        {/* Ingredient summary */}
        <div
          className="mb-6 rounded-sm p-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <p className="mb-2 font-mono text-xs tracking-widest uppercase" style={{ color: "var(--muted)" }}>
            인식된 재료 {ingredients.length}가지
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ingredients.map((item) => (
              <span
                key={item}
                className="rounded-sm px-2.5 py-1 font-mono text-xs"
                style={{
                  background: "var(--accent-light)",
                  border: "1px solid color-mix(in srgb, var(--accent-mid) 25%, transparent)",
                  color: "var(--accent)",
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Condition selector */}
        <div
          className="mb-6 rounded-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <button
            onClick={() => setConditionsOpen((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-4 transition-opacity hover:opacity-70"
          >
            <p className="font-display text-lg font-medium" style={{ color: "var(--text)" }}>
              조리 조건
            </p>
            <svg
              width="14" height="14" viewBox="0 0 14 14" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
              style={{ color: "var(--muted)", transform: conditionsOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
            >
              <polyline points="2,5 7,9 12,5" />
            </svg>
          </button>
          {conditionsOpen && (
            <div className="px-5 pb-5">
              <ConditionSelector value={conditions} onChange={setConditions} />
            </div>
          )}
        </div>

        {/* Request button */}
        <button
          onClick={request}
          disabled={status === "streaming"}
          className="mb-6 w-full rounded-sm py-3.5 text-sm font-medium tracking-wide transition-all duration-200 disabled:opacity-40"
          style={{
            background: status === "streaming" ? "var(--accent-mid)" : "var(--accent)",
            color: "var(--surface)",
            letterSpacing: "0.05em",
          }}
        >
          {status === "streaming" ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              레시피 생성 중…
            </span>
          ) : status === "done" ? (
            "다시 추천"
          ) : (
            "레시피 추천"
          )}
        </button>

        {/* Error */}
        {status === "error" && errorMessage && (
          <div
            className="mb-6 rounded-sm border px-4 py-3 font-mono text-xs"
            style={{ borderColor: "#e0b0b0", background: "#fdf5f5", color: "#b84040" }}
          >
            {errorMessage}
          </div>
        )}

        {/* Progressive recipe cards */}
        {(streamingRecipes.length > 0 || skeletonCount > 0 || recipes.length > 0) && (
          <div className="space-y-4">
            {/* 완성된 카드 */}
            {(status === "streaming" ? streamingRecipes : recipes).map((recipe, i) => (
              <RecipeCard
                key={recipe.name + i}
                recipe={recipe}
                saved={savedIds.has(recipe.name)}
                onSave={handleSave}
              />
            ))}
            {/* 아직 생성 중인 스켈레톤 */}
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <RecipeCardSkeleton key={i} startedAt={streamStartedAt} />
            ))}
          </div>
        )}

        <p className="mt-10 text-center font-mono text-xs" style={{ color: "var(--muted)" }}>
          powered by openrouter / auto fallback / free tier
        </p>
      </div>

      {/* Fixed scroll-to-bottom button */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          aria-label="맨 아래로 이동"
          className="fixed bottom-6 right-6 flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-all duration-200 active:scale-95"
          style={{
            background: "var(--accent)",
            color: "var(--surface)",
            boxShadow: "0 4px 16px rgba(36,61,44,0.25)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="2" x2="8" y2="13" />
            <polyline points="4,9 8,13 12,9" />
          </svg>
        </button>
      )}
    </main>
  );
}
