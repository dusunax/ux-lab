"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Music2, Plus } from "lucide-react";
import { Persona } from "@/lib/types";
import { generatePrompt, generateTags, generateSunoStyle, buildSunoLyrics } from "./generatePrompt";

interface Props {
  persona: Persona;
  onAddTrack: (title: string, titleEn: string, prompt: string, lyrics: string, tags: string[], audioUrl: string) => void;
}

type Step = "input" | "suno";

export function PromptPreview({ persona, onAddTrack }: Props) {
  const [title, setTitle] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [trackStory, setTrackStory] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [copied, setCopied] = useState<"style" | "lyrics" | "title" | null>(null);

  const sunoStyle = generateSunoStyle(persona);
  const sunoLyrics = buildSunoLyrics(persona, title || "Untitled", trackStory, lyrics);
  const tags = generateTags(persona);
  const prompt = generatePrompt(persona, title || "Untitled");

  const copy = async (text: string, key: "style" | "lyrics" | "title") => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleOpenSuno = () => {
    setStep("suno");
    window.open("https://suno.com/create", "_blank");
  };

  const handleAddTrack = (withAudio: boolean) => {
    if (!title.trim()) return;
    onAddTrack(title.trim(), titleEn.trim(), prompt, lyrics.trim(), tags, withAudio ? audioUrl.trim() : "");
    setTitle("");
    setTitleEn("");
    setTrackStory("");
    setLyrics("");
    setAudioUrl("");
    setStep("input");
  };

  return (
    <div className="space-y-5 max-w-lg">
      {/* 트랙 제목 */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="트랙 제목">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="트랙 제목 (한글)"
            className={inputCls}
          />
        </Field>
        <Field label="영어 제목">
          <input
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder="English Title"
            className={inputCls}
          />
        </Field>
      </div>

      {/* 트랙 스토리 + 가사 — 나란히 */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="트랙 스토리" hint="프롬프트에 반영">
          <textarea
            value={trackStory}
            onChange={(e) => setTrackStory(e.target.value)}
            rows={3}
            placeholder={`이 트랙에서 어떤 동물/동화/상황이 등장하나요?\ne.g. 좋아하는 아이의 창문 밖에 앉고 싶은 새 한 마리.`}
            className={inputCls}
          />
        </Field>
        <Field label="가사 (Lyrics)" hint="가사에 반영">
          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            rows={3}
            placeholder={`[Verse]\n그 창문 너머로\n네가 보여\n\n[Chorus]\n나는 새가 되고 싶어`}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        {/* 헤더 */}
        <div className="px-4 py-2 bg-elevated border-b border-border flex items-center gap-2">
          <span className="text-xs font-semibold text-muted uppercase tracking-widest">Suno Advanced 모드</span>
          <span className="text-xs text-border">— 각 필드를 복사해서 붙여넣으세요</span>
        </div>

        <div className="divide-y divide-border">
          {/* Style of Music */}
          <SunoField
            label="Style of Music"
            hint="장르 + 시그니처 사운드"
            value={sunoStyle}
            onCopy={() => copy(sunoStyle, "style")}
            copied={copied === "style"}
            mono
          />

          {/* Lyrics / Prompt */}
          <SunoField
            label="Lyrics / Prompt"
            hint="프롬프트 + 가사 합산"
            value={sunoLyrics}
            empty={!persona.sunoPrompt && !trackStory && !lyrics}
            onCopy={() => sunoLyrics && copy(sunoLyrics, "lyrics")}
            copied={copied === "lyrics"}
            multiline
          />

          {/* Title */}
          <SunoField
            label="Title"
            hint="트랙 제목"
            value={title || "—"}
            onCopy={() => title && copy(title, "title")}
            copied={copied === "title"}
          />
        </div>
      </div>

      {/* 태그 뱃지 */}
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className="px-2 py-0.5 rounded-full bg-accent-glow text-accent text-xs">
            #{tag}
          </span>
        ))}
      </div>

      {/* Suno 열기 */}
      <button
        onClick={handleOpenSuno}
        disabled={!title.trim()}
        className="w-full py-2.5 rounded-full bg-accent text-bg font-semibold text-sm hover:bg-accent-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <ExternalLink size={15} /> Suno에서 생성하기
      </button>

      {/* Suno 생성 후 URL 입력 */}
      {step === "suno" && (
        <div className="space-y-3 border border-border rounded-lg p-4 bg-elevated/40">
          <p className="text-xs text-muted leading-relaxed">
            Suno에서 생성 완료 후 오디오 URL을 붙여넣으세요.
            <br />
            <span className="text-border">트랙 우클릭 → Copy audio link</span>
          </p>
          <Field label="오디오 URL (선택)">
            <input
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              placeholder="https://cdn1.suno.ai/..."
              className={inputCls}
            />
          </Field>
          <div className="flex gap-2">
            <button
              onClick={() => handleAddTrack(true)}
              disabled={!title.trim()}
              className="flex-1 py-2 rounded-full bg-accent text-bg font-semibold text-sm hover:bg-accent-dark transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              <Music2 size={14} /> 트랙 추가
            </button>
            <button
              onClick={() => handleAddTrack(false)}
              className="px-4 py-2 rounded-full border border-border text-muted text-sm hover:text-text transition-colors"
            >
              URL 없이
            </button>
          </div>
        </div>
      )}

      {/* 프롬프트만 저장 */}
      {step === "input" && (
        <button
          onClick={() => handleAddTrack(false)}
          disabled={!title.trim()}
          className="w-full py-2 rounded-full border border-border text-muted text-sm hover:text-text transition-colors disabled:opacity-30 flex items-center justify-center gap-1.5"
        >
          <Plus size={14} /> 프롬프트만 저장
        </button>
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-2">
        <label className="text-xs text-muted uppercase tracking-wide font-medium">{label}</label>
        {hint && <span className="text-xs text-border">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function SunoField({
  label, hint, value, empty, onCopy, copied, multiline, mono,
}: {
  label: string;
  hint: string;
  value: string;
  empty?: boolean;
  onCopy: () => void;
  copied: boolean;
  multiline?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-text">{label}</span>
          <span className="text-xs text-border ml-2">{hint}</span>
        </div>
        {!empty && (
          <button
            onClick={onCopy}
            className="flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors"
          >
            {copied ? <Check size={12} className="text-accent" /> : <Copy size={12} />}
            {copied ? "복사됨" : "복사"}
          </button>
        )}
      </div>
      {empty ? (
        <p className="text-xs text-border italic">뮤지션 편집 탭에서 Suno 프롬프트를 작성해주세요</p>
      ) : (
        <div
          className={`text-sm leading-relaxed ${mono ? "font-mono text-accent" : "text-text"} ${
            multiline ? "whitespace-pre-wrap" : "truncate"
          }`}
        >
          {value}
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text placeholder:text-border focus:outline-none focus:border-accent transition-colors";
