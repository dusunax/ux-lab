"use client";

import { useState, KeyboardEvent } from "react";
import IngredientChip from "@/components/IngredientChip";

interface Props {
  ingredients: string[];
  onChange: (next: string[]) => void;
  allergies?: string[];
}

export default function IngredientTagList({ ingredients, onChange, allergies = [] }: Props) {
  const [input, setInput] = useState("");

  function addIngredient() {
    const v = input.trim();
    if (v && !ingredients.includes(v)) onChange([...ingredients, v]);
    setInput("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); addIngredient(); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ingredients.map((item, i) => (
          <IngredientChip
            key={item}
            label={item}
            isAllergy={allergies.some((a) => item.includes(a) || a.includes(item))}
            onDelete={() => onChange(ingredients.filter((x) => x !== item))}
            animationDelay={i * 40}
          />
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
