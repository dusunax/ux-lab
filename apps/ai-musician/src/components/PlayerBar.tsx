"use client";

import { Play, Pause, Music2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Track } from "@/lib/types";

interface Props {
  track: Track | null;
}

export function PlayerBar({ track }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setPlaying(false);
    setProgress(0);
  }, [track?.id]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const { currentTime, duration } = audioRef.current;
    if (duration > 0) setProgress((currentTime / duration) * 100);
  };

  return (
    <footer className="h-20 bg-surface border-t border-border flex items-center px-6 gap-4 shrink-0">
      {/* Track info */}
      <div className="flex items-center gap-3 w-56 shrink-0">
        {track?.coverImageUrl ? (
          <img src={track.coverImageUrl} alt={track.title} className="w-12 h-12 rounded object-cover" />
        ) : (
          <div className="w-12 h-12 rounded bg-elevated flex items-center justify-center">
            <Music2 size={18} className="text-muted" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-text truncate">{track?.title ?? "재생 중인 트랙 없음"}</p>
          {track && (
            <div className="flex gap-1 mt-0.5">
              {track.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-xs text-muted">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col items-center gap-1.5">
        <button
          onClick={toggle}
          disabled={!track?.audioUrl}
          className="w-8 h-8 rounded-full bg-text flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {playing ? <Pause size={14} className="text-bg" /> : <Play size={14} className="text-bg ml-0.5" />}
        </button>
        <div className="w-full max-w-sm h-1 bg-elevated rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="w-56 shrink-0" />

      {track?.audioUrl && (
        <audio
          ref={audioRef}
          src={track.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setPlaying(false)}
        />
      )}
    </footer>
  );
}
