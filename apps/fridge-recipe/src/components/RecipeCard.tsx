"use client";

import { useState } from "react";
import type { Recipe } from "@/lib/recipeApi";
import IngredientChip from "@/components/IngredientChip";

interface Props {
  recipe: Recipe;
  onSave: (recipe: Recipe) => void;
  saved: boolean;
  allergies?: string[];
}

export default function RecipeCard({ recipe, onSave, saved, allergies = [] }: Props) {
  const [expanded, setExpanded] = useState(false);

  const allergyMatches = allergies.length > 0
    ? recipe.usedIngredients.filter((ing) =>
        allergies.some((a) => ing.includes(a) || a.includes(ing))
      )
    : [];

  return (
    <article
      className="rounded-sm"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h3
            className="font-display text-2xl font-medium leading-tight"
            style={{ color: "var(--text)" }}
          >
            {recipe.name}
          </h3>
          <div className="flex shrink-0 items-center gap-2 pt-1">
            <span className="font-mono text-xs" style={{ color: "var(--muted)" }}>
              {recipe.time}분
            </span>
            <span
              className="rounded-sm px-2 py-0.5 font-mono text-xs"
              style={{ background: "var(--accent-light)", color: "var(--accent-mid)" }}
            >
              {recipe.difficulty}
            </span>
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
      </div>

      {/* Ingredients */}
      <div className="px-6 pb-4 space-y-3">
        {recipe.usedIngredients.length > 0 && (
          <div>
            <p className="mb-1.5 font-mono text-xs tracking-widest uppercase" style={{ color: "var(--muted)" }}>
              사용 재료
            </p>
            <div className="flex flex-wrap gap-1.5">
              {recipe.usedIngredients.map((i) => (
                <IngredientChip key={i} label={i} isAllergy={allergyMatches.includes(i)} />
              ))}
            </div>
          </div>
        )}
        {recipe.missingIngredients.length > 0 && (
          <div>
            <p className="mb-1.5 font-mono text-xs tracking-widest uppercase" style={{ color: "var(--muted)" }}>
              추가 필요
            </p>
            <div className="flex flex-wrap gap-1.5">
              {recipe.missingIngredients.map((i) => (
                <span
                  key={i}
                  className="rounded-sm px-2.5 py-1 font-mono text-xs"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--muted)",
                  }}
                >
                  {i}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Steps toggle */}
      <div style={{ borderTop: "1px solid var(--border)" }}>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between px-6 py-3 text-sm transition-opacity hover:opacity-70"
          style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
        >
          <span className="text-xs tracking-widest uppercase">조리 순서</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
          >
            <polyline points="2,4 6,8 10,4" />
          </svg>
        </button>

        {expanded && (
          <ol className="px-6 pb-5 space-y-2">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm" style={{ color: "var(--text)" }}>
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm font-mono text-xs"
                  style={{ background: "var(--accent-light)", color: "var(--accent-mid)" }}
                >
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step.replace(/^\d+\.\s*/, "")}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Save button */}
      <div style={{ borderTop: "1px solid var(--border)" }} className="px-6 py-4">
        <button
          onClick={() => onSave(recipe)}
          disabled={saved}
          className="w-full rounded-sm py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-50"
          style={{
            background: saved ? "var(--accent-light)" : "transparent",
            color: saved ? "var(--accent-mid)" : "var(--accent)",
            border: `1.5px solid ${saved ? "transparent" : "var(--accent)"}`,
          }}
        >
          {saved ? "저장됨" : "저장"}
        </button>
      </div>
    </article>
  );
}
