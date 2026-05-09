"use client";

import { useState } from "react";
import type { Recipe } from "@/lib/recipeApi";

interface Props {
  recipe: Recipe;
  onSave: (recipe: Recipe) => void;
  saved: boolean;
}

export default function RecipeCard({ recipe, onSave, saved }: Props) {
  const [expanded, setExpanded] = useState(false);

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
                <span
                  key={i}
                  className="rounded-sm px-2.5 py-1 font-mono text-xs"
                  style={{
                    background: "var(--accent-light)",
                    border: "1px solid color-mix(in srgb, var(--accent-mid) 25%, transparent)",
                    color: "var(--accent)",
                  }}
                >
                  {i}
                </span>
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
