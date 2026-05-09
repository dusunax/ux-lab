"use client";

import { useState, KeyboardEvent } from "react";

interface Props {
  ingredients: string[];
  onChange: (next: string[]) => void;
}

export default function IngredientTagList({ ingredients, onChange }: Props) {
  const [input, setInput] = useState("");

  function addIngredient() {
    const v = input.trim();
    if (v && !ingredients.includes(v)) onChange([...ingredients, v]);
    setInput("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); addIngredient(); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ingredients.map((item, i) => (
          <span
            key={item}
            className="tag-animate group flex items-center gap-1.5 rounded-sm px-3 py-1.5"
            style={{
              animationDelay: `${i * 40}ms`,
              background: "var(--accent-light)",
              border: "1px solid",
              borderColor: "color-mix(in srgb, var(--accent-mid) 30%, transparent)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.72rem",
              letterSpacing: "0.04em",
              color: "var(--accent)",
            }}
          >
            {item}
            <button
              onClick={() => onChange(ingredients.filter((x) => x !== item))}
              aria-label={`${item} 삭제`}
              className="opacity-40 transition-opacity hover:opacity-100"
              style={{ color: "var(--accent)", lineHeight: 1 }}
            >
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="1" y1="1" x2="8" y2="8" />
                <line x1="8" y1="1" x2="1" y2="8" />
              </svg>
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="재료 직접 추가 후 Enter"
          className="flex-1 rounded-sm border bg-transparent px-3 py-2 text-sm placeholder:text-sm focus:outline-none focus:ring-1"
          style={{
            borderColor: "var(--border)",
            color: "var(--text)",
            fontFamily: "var(--font-body)",
            "--tw-ring-color": "var(--accent-mid)",
          } as React.CSSProperties}
        />
        <button
          onClick={addIngredient}
          disabled={!input.trim()}
          className="rounded-sm px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-30"
          style={{ background: "var(--accent)", color: "var(--surface)" }}
        >
          추가
        </button>
      </div>
    </div>
  );
}
