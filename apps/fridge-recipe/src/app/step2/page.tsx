"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ConditionSelector from "@/components/ConditionSelector";
import RecipeCard from "@/components/RecipeCard";
import RecipeCardSkeleton from "@/components/RecipeCardSkeleton";
import { fetchRecipes, type Recipe, type Conditions } from "@/lib/recipeApi";
import { addSavedRecipe, getProfile } from "@/lib/storage";
import IngredientChip from "@/components/IngredientChip";

const DEFAULT_CONDITIONS: Conditions = {
  maxTime: null,
  difficulty: null,
  diet: "normal",
  cuisine: "any",
};



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
  const [allergies, setAllergies] = useState<string[]>([]);
  const [excludeAllergies, setExcludeAllergies] = useState(false);
  const [specialNote, setSpecialNote] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [streamingRecipes, setStreamingRecipes] = useState<Recipe[]>([]);
  const [status, setStatus] = useState<"idle" | "streaming" | "done" | "error">("idle");
  const [streamStartedAt, setStreamStartedAt] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const autoScrollRef = useRef(true);

  const sessionKey = `step2_${ingredients.join(",")}`;

  useEffect(() => {
    if (ingredients.length === 0) router.replace("/");
    const profile = getProfile();
    if (profile) {
      setAllergies(profile.allergies);
      setExcludeAllergies(profile.excludeAllergies ?? false);
      setSpecialNote(profile.specialNote ?? "");
      if (profile.diet !== "normal") {
        setConditions((c) => ({ ...c, diet: profile.diet as Conditions["diet"] }));
      }
    }
    try {
      const cached = sessionStorage.getItem(sessionKey);
      if (cached) {
        const { recipes: r, conditions: c, savedIds: s } = JSON.parse(cached);
        setRecipes(r);
        setConditions(c);
        setSavedIds(new Set(s));
        setStatus("done");
        setConditionsOpen(false);
      }
    } catch {}
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

  const effectiveIngredients = excludeAllergies && allergies.length > 0
    ? ingredients.filter((i) => !allergies.some((a) => i.includes(a) || a.includes(i)))
    : ingredients;

  const request = useCallback(async () => {
    const now = Date.now();
    setStatus("streaming");
    setStreamStartedAt(now);
    setConditionsOpen(false);
    setErrorMessage(null);
    setRecipes([]);
    setStreamingRecipes([]);
    try {
      const result = await fetchRecipes(effectiveIngredients, conditions, allergies, excludeAllergies, specialNote, (found) => {
        setStreamingRecipes(found);
      });
      setRecipes(result);
      setStatus("done");
      try {
        sessionStorage.setItem(sessionKey, JSON.stringify({ recipes: result, conditions, savedIds: [] }));
      } catch {}
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "알 수 없는 오류");
      setStatus("error");
    }
  }, [effectiveIngredients, conditions, allergies, excludeAllergies, specialNote]);

  function handleSave(recipe: Recipe) {
    addSavedRecipe(recipe);
    setSavedIds((prev) => {
      const next = new Set([...prev, recipe.name]);
      try {
        const cached = sessionStorage.getItem(sessionKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          sessionStorage.setItem(sessionKey, JSON.stringify({ ...parsed, savedIds: [...next] }));
        }
      } catch {}
      return next;
    });
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
          <div className="mb-4 flex items-center gap-3 font-mono text-xs">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 transition-opacity hover:opacity-60"
              style={{ color: "var(--muted)" }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="8,2 4,6 8,10" />
              </svg>
              재료 인식
            </button>
            <span className="h-px w-6" style={{ background: "var(--border)" }} />
            <span className="flex items-center gap-1.5" style={{ color: "var(--accent)" }}>
              <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor" /></svg>
              <span style={{ fontWeight: 600 }}>레시피 추천</span>
            </span>
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
            인식된 재료 {effectiveIngredients.length}가지
          </p>
          <div className="flex flex-wrap gap-1.5">
            {effectiveIngredients.map((item) => (
              <IngredientChip
                key={item}
                label={item}
                isAllergy={allergies.some((a) => item.includes(a) || a.includes(item))}
              />
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
              <ConditionSelector
                value={conditions}
                onChange={setConditions}
                allergies={allergies}
                excludeAllergies={excludeAllergies}
                onExcludeAllergiesChange={setExcludeAllergies}
              />
            </div>
          )}
        </div>

        {/* Request button */}
        <div className="mb-6 flex flex-col gap-2">
          <button
            onClick={request}
            disabled={status === "streaming"}
            className="w-full rounded-sm py-3.5 text-sm font-medium tracking-wide transition-all duration-200 disabled:opacity-40"
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
          <button
            onClick={() => {
              try { sessionStorage.clear(); } catch {}
              router.push("/");
            }}
            className="w-full rounded-sm py-3 text-sm font-medium transition-all duration-200 hover:opacity-70"
            style={{ border: "1px solid var(--border)", color: "var(--muted)", background: "transparent" }}
          >
            처음으로
          </button>
        </div>

        {/* Error */}
        {status === "error" && errorMessage && (
          <div
            className="mb-6 rounded-sm border px-4 py-3 font-mono text-xs"
            style={{ borderColor: "var(--danger-mid)", background: "var(--danger-light)", color: "var(--danger)" }}
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
                allergies={allergies}
              />
            ))}
            {/* 아직 생성 중인 스켈레톤 */}
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <RecipeCardSkeleton key={i} startedAt={streamStartedAt} />
            ))}
          </div>
        )}

        <p className="mt-10 mb-8 text-center font-mono text-xs" style={{ color: "var(--muted)" }}>
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
