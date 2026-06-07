"use client";

import { useState } from "react";
import { Persona } from "@/lib/types";

type FormData = Omit<Persona, "id" | "createdAt">;

const EMPTY: FormData = {
  name: "",
  genre: "",
  worldview: "",
  signatureSound: "",
  albumConcept: "",
  sunoPrompt: "",
  coverImageUrl: "",
};

interface Props {
  initial?: FormData;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
}

export function PersonaForm({ initial = EMPTY, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<FormData>(initial);

  const field = (key: keyof FormData) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.genre.trim()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="뮤지션 이름" required>
        <input {...field("name")} placeholder="e.g. NOVA" className={inputCls} />
      </Field>
      <Field label="장르" required>
        <input {...field("genre")} placeholder="e.g. Synth-pop, Dark ambient" className={inputCls} />
      </Field>
      <Field label="작가관 (세계관)">
        <textarea
          {...field("worldview")}
          rows={3}
          placeholder="이 뮤지션이 음악을 통해 전달하려는 세계관을 적어주세요"
          className={inputCls}
        />
      </Field>
      <Field label="시그니처 사운드">
        <input
          {...field("signatureSound")}
          placeholder="e.g. analog synth, reverb-heavy vocals, 80bpm"
          className={inputCls}
        />
      </Field>
      <Field label="앨범 컨셉">
        <textarea
          {...field("albumConcept")}
          rows={2}
          placeholder="이 뮤지션의 앨범이 담는 주제나 감성"
          className={inputCls}
        />
      </Field>
      <Field label="Suno 프롬프트" hint="Suno Advanced > Lyrics/Prompt 필드에 그대로 사용">
        <textarea
          {...field("sunoPrompt")}
          rows={4}
          placeholder={"이 뮤지션의 음악이 어떤 분위기인지 서술하세요.\ne.g. A cold, cinematic darkwave track. Pulsing analog synth basslines under distant, reverb-soaked atmosphere. Melancholy but forward-moving."}
          className={inputCls}
        />
      </Field>
      <Field label="커버 이미지 URL">
        <input {...field("coverImageUrl")} placeholder="https://..." className={inputCls} />
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

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-2">
        <label className="text-xs text-muted font-medium uppercase tracking-wide">
          {label}{required && <span className="text-accent ml-1">*</span>}
        </label>
        {hint && <span className="text-xs text-border">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text placeholder:text-border focus:outline-none focus:border-accent transition-colors resize-none";
