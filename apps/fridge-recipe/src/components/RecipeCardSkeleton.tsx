"use client";

import { useState, useEffect } from "react";

export default function RecipeCardSkeleton({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed((Date.now() - startedAt) / 1000), 100);
    return () => clearInterval(id);
  }, [startedAt]);

  return (
    <article
      className="rounded-sm"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="px-6 pt-5 pb-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="h-6 w-36 rounded-sm animate-pulse" style={{ background: "var(--border)" }} />
          <span className="font-mono text-xs shrink-0" style={{ color: "var(--muted)" }}>
            레시피 구상 중 {elapsed.toFixed(1)}s
          </span>
        </div>
        <div className="h-3 w-full rounded-sm animate-pulse" style={{ background: "var(--border)" }} />
        <div className="h-3 w-2/3 rounded-sm animate-pulse" style={{ background: "var(--border)" }} />
      </div>
      <div className="px-6 pb-5 space-y-2">
        <div className="h-3 w-16 rounded-sm animate-pulse" style={{ background: "var(--border)" }} />
        <div className="flex gap-1.5">
          {[56, 44, 60, 40].map((w) => (
            <div
              key={w}
              className="h-6 rounded-sm animate-pulse"
              style={{ background: "var(--border)", width: w }}
            />
          ))}
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--border)" }} className="px-6 py-4">
        <div className="h-9 w-full rounded-sm animate-pulse" style={{ background: "var(--border)" }} />
      </div>
    </article>
  );
}
