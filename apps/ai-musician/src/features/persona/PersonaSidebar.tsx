"use client";

import { Plus, Music2 } from "lucide-react";
import { Persona } from "@/lib/types";

interface Props {
  personas: Persona[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function PersonaSidebar({ personas, activeId, onSelect, onNew }: Props) {
  return (
    <aside className="w-60 shrink-0 bg-bg flex flex-col border-r border-border">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted">뮤지션</span>
        <button
          onClick={onNew}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-elevated hover:bg-accent hover:text-bg transition-colors text-muted"
        >
          <Plus size={14} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {personas.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-border">
            뮤지션이 없습니다.
            <br />+ 버튼으로 추가하세요.
          </p>
        )}
        {personas.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
              activeId === p.id
                ? "bg-elevated text-text"
                : "text-muted hover:text-text hover:bg-elevated/50"
            }`}
          >
            {p.coverImageUrl ? (
              <img src={p.coverImageUrl} alt={p.name} className="w-8 h-8 rounded object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded bg-elevated flex items-center justify-center shrink-0">
                <Music2 size={14} className="text-muted" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{p.name}</p>
              <p className="text-xs text-muted truncate">{p.genre}</p>
            </div>
          </button>
        ))}
      </nav>
    </aside>
  );
}
