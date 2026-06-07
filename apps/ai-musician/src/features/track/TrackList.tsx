"use client";

import { Play, Trash2, Music } from "lucide-react";
import { Track } from "@/lib/types";

interface Props {
  tracks: Track[];
  activeTrackId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export function TrackList({ tracks, activeTrackId, onSelect, onRemove }: Props) {
  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <Music size={32} className="text-border" />
        <p className="text-sm text-muted">아직 트랙이 없습니다.</p>
        <p className="text-xs text-border">프롬프트를 생성하고 트랙을 추가해보세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tracks.map((track, index) => (
        <div
          key={track.id}
          className={`group flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
            activeTrackId === track.id ? "bg-elevated" : "hover:bg-elevated/60"
          }`}
          onClick={() => onSelect(track.id)}
        >
          <span className="w-5 text-center text-xs text-muted shrink-0 group-hover:hidden">
            {index + 1}
          </span>
          <span className="w-5 text-center hidden group-hover:flex items-center justify-center shrink-0">
            <Play size={12} className="text-text" />
          </span>

          {track.coverImageUrl ? (
            <img src={track.coverImageUrl} alt={track.title} className="w-9 h-9 rounded object-cover shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded bg-elevated flex items-center justify-center shrink-0">
              <Music size={12} className="text-muted" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${activeTrackId === track.id ? "text-accent" : "text-text"}`}>
              {track.title}
            </p>
            <div className="flex gap-1 mt-0.5 flex-wrap">
              {track.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs text-muted">#{tag}</span>
              ))}
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onRemove(track.id); }}
            className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-red-400 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
