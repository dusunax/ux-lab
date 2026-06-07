"use client";

import { useState } from "react";
import { Track } from "@/lib/types";

type EditableFields = Pick<Track, "title" | "lyrics" | "audioUrl" | "coverImageUrl">;

interface Props {
  track: Track;
  onSubmit: (patch: EditableFields) => void;
  onCancel: () => void;
}

export function TrackEditForm({ track, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<EditableFields>({
    title: track.title,
    lyrics: track.lyrics,
    audioUrl: track.audioUrl,
    coverImageUrl: track.coverImageUrl,
  });

  const set = (key: keyof EditableFields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="트랙 제목" required>
        <input value={form.title} onChange={set("title")} className={inputCls} />
      </Field>
      <Field label="가사 (Lyrics)">
        <textarea
          value={form.lyrics}
          onChange={set("lyrics")}
          rows={6}
          placeholder={"[Verse]\n\n[Chorus]\n"}
          className={inputCls}
        />
      </Field>
      <Field label="오디오 URL">
        <input value={form.audioUrl} onChange={set("audioUrl")} placeholder="https://cdn1.suno.ai/..." className={inputCls} />
      </Field>
      <Field label="커버 이미지 URL">
        <input value={form.coverImageUrl} onChange={set("coverImageUrl")} placeholder="https://..." className={inputCls} />
      </Field>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="flex-1 py-2 rounded-full bg-accent text-bg font-semibold text-sm hover:bg-accent-dark transition-colors">
          저장
        </button>
        <button type="button" onClick={onCancel} className="flex-1 py-2 rounded-full border border-border text-muted text-sm hover:text-text transition-colors">
          취소
        </button>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted uppercase tracking-wide font-medium">
        {label}{required && <span className="text-accent ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text placeholder:text-border focus:outline-none focus:border-accent transition-colors resize-none";
