"use client";

import type { Conditions } from "@/lib/recipeApi";

interface Props {
  value: Conditions;
  onChange: (next: Conditions) => void;
}

function ChipGroup<T extends string | number | null>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onSelect: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--muted)" }}>
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              onClick={() => onSelect(opt.value)}
              className="rounded-sm px-3 py-1.5 text-sm transition-all duration-150"
              style={{
                background: active ? "var(--accent)" : "var(--surface)",
                color: active ? "var(--surface)" : "var(--text)",
                border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                fontFamily: "var(--font-body)",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ConditionSelector({ value, onChange }: Props) {
  return (
    <div className="space-y-5">
      <ChipGroup
        label="조리 시간"
        options={[
          { value: null, label: "제한 없음" },
          { value: 15, label: "15분 이내" },
          { value: 30, label: "30분 이내" },
        ]}
        value={value.maxTime}
        onSelect={(v) => onChange({ ...value, maxTime: v as Conditions["maxTime"] })}
      />
      <ChipGroup
        label="난이도"
        options={[
          { value: null, label: "상관없음" },
          { value: "easy", label: "쉬움" },
          { value: "normal", label: "보통" },
          { value: "hard", label: "어려움" },
        ]}
        value={value.difficulty}
        onSelect={(v) => onChange({ ...value, difficulty: v as Conditions["difficulty"] })}
      />
      <ChipGroup
        label="식단"
        options={[
          { value: "normal", label: "일반" },
          { value: "vegetarian", label: "채식" },
          { value: "vegan", label: "비건" },
          { value: "weird", label: "괴식" },
        ]}
        value={value.diet}
        onSelect={(v) => onChange({ ...value, diet: v as Conditions["diet"] })}
      />
      <ChipGroup
        label="요리 스타일"
        options={[
          { value: "any", label: "상관없음" },
          { value: "korean", label: "한식" },
          { value: "western", label: "양식" },
          { value: "chinese", label: "중식" },
          { value: "southeast-asian", label: "동남아식" },
        ]}
        value={value.cuisine}
        onSelect={(v) => onChange({ ...value, cuisine: v as Conditions["cuisine"] })}
      />
    </div>
  );
}
