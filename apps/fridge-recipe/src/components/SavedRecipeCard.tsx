"use client";

import { useState } from "react";
import type { SavedRecipe } from "@/lib/storage";
import IngredientChip from "@/components/IngredientChip";

interface Props {
  recipe: SavedRecipe;
  onDelete: (id: string) => void;
  onFavorite?: (id: string) => void;
  allergies?: string[];
  index?: number;
}

export default function SavedRecipeCard({ recipe, onDelete, onFavorite, allergies = [], index }: Props) {
  const [expanded, setExpanded] = useState(false);

  const allergyMatches = allergies.length > 0
    ? recipe.usedIngredients.filter((ing) => allergies.some((a) => ing.includes(a) || a.includes(ing)))
    : [];

  const savedDate = new Date(recipe.savedAt).toLocaleString("ko-KR", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <article
      className="rounded-sm"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="px-5 pt-5 pb-4">
        {index !== undefined && (
          <p className="mb-1.5 font-mono text-xs" style={{ color: "var(--muted)" }}>#bookmark-{index}</p>
        )}
        <div className="mb-1 flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-medium leading-tight" style={{ color: "var(--text)" }}>
            {recipe.name}
          </h3>
          <div className="flex shrink-0 items-center gap-2 pt-0.5">
            <span className="font-mono text-xs" style={{ color: "var(--muted)" }}>{recipe.time}분</span>
            <span
              className="rounded-sm px-2 py-0.5 font-mono text-xs"
              style={{ background: "var(--accent-light)", color: "var(--accent-mid)" }}
            >
              {recipe.difficulty}
            </span>
            {onFavorite && (
              <button
                onClick={() => onFavorite(recipe.id)}
                aria-label={recipe.favorited ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                className="flex items-center justify-center rounded-sm p-1 transition-all duration-200 hover:opacity-70 active:scale-95"
                style={recipe.favorited ? {
                  color: "var(--warm)",
                } : {
                  color: "var(--muted)",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill={recipe.favorited ? "var(--warm)" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="8,1.5 10.09,5.74 14.85,6.41 11.42,9.74 12.18,14.5 8,12.27 3.82,14.5 4.58,9.74 1.15,6.41 5.91,5.74" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {recipe.description}
        </p>
        {allergyMatches.length > 0 && (
          <div
            className="mt-3 flex items-start gap-2 rounded-sm px-3 py-2"
            style={{ background: "var(--danger-light)", border: "1px solid var(--danger-mid)" }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="var(--danger)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
              <path d="M6.5 1L12 11H1L6.5 1Z" /><line x1="6.5" y1="5" x2="6.5" y2="7.5" /><circle cx="6.5" cy="9.5" r="0.5" fill="var(--danger)" stroke="none" />
            </svg>
            <p className="font-mono text-xs leading-relaxed" style={{ color: "var(--danger)" }}>
              알레르기 주의: {allergyMatches.join(", ")}
            </p>
          </div>
        )}
        <p className="mt-2 font-mono text-xs" style={{ color: "var(--muted)" }}>
          {savedDate} 저장
        </p>
      </div>

      <div style={{ borderTop: "1px solid var(--border)" }}>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3 transition-opacity hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          <span className="font-mono text-xs tracking-widest uppercase">재료 · 조리 순서</span>
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
            style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
          >
            <polyline points="2,4 6,8 10,4" />
          </svg>
        </button>

        {expanded && (
          <div className="px-5 pb-5 space-y-4">
            {recipe.usedIngredients.length > 0 && (
              <div>
                <p className="mb-1.5 font-mono text-xs tracking-widest uppercase" style={{ color: "var(--muted)" }}>사용 재료</p>
                <div className="flex flex-wrap gap-1.5">
                  {recipe.usedIngredients.map((i) => (
                    <IngredientChip
                      key={i}
                      label={i}
                      isAllergy={allergies.some((a) => i.includes(a) || a.includes(i))}
                    />
                  ))}
                </div>
              </div>
            )}
            <ol className="space-y-2">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm" style={{ color: "var(--text)" }}>
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm font-mono text-xs"
                    style={{ background: "var(--accent-light)", color: "var(--accent-mid)" }}>
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step.replace(/^\d+\.\s*/, "")}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid var(--border)" }} className="flex gap-2 px-5 py-3">
        <button
          onClick={() => onDelete(recipe.id)}
          className="flex-1 rounded-sm py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-70"
          style={{ border: "1px solid var(--danger-mid)", color: "var(--danger)", background: "var(--danger-light)" }}
        >
          삭제
        </button>
      </div>
    </article>
  );
}
