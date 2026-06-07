"use client";

import { useState } from "react";
import { Copy, Check, Loader2, Music2 } from "lucide-react";
import { Persona } from "@/lib/types";
import { generatePrompt, generateTags, generateSunoTags } from "./generatePrompt";

interface Props {
  persona: Persona;
  onAddTrack: (title: string, prompt: string, tags: string[], audioUrl: string) => void;
}

type Status = "idle" | "generating" | "done" | "error";

export function PromptPreview({ persona, onAddTrack }: Props) {
  const [title, setTitle] = useState("");
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const prompt = generatePrompt(persona, title || "Untitled");
  const tags = generateTags(persona);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = async () => {
    if (!title.trim()) return;
    setStatus("generating");
    setErrorMsg("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: generateSunoTags(persona), title: title.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");

      onAddTrack(title.trim(), prompt, tags, data.audioUrl);
      setStatus("done");
      setTitle("");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "알 수 없는 오류");
      setStatus("error");
    }
  };

  const handleAddWithoutAudio = () => {
    if (!title.trim()) return;
    onAddTrack(title.trim(), prompt, tags, "");
    setTitle("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs text-muted uppercase tracking-wide font-medium">트랙 제목</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="트랙 제목을 입력하면 프롬프트가 생성됩니다"
          disabled={status === "generating"}
          className="w-full bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text placeholder:text-border focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted uppercase tracking-wide font-medium">생성된 프롬프트</label>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "복사됨" : "복사"}
          </button>
        </div>
        <pre className="bg-bg border border-border rounded-md p-3 text-xs text-muted whitespace-pre-wrap font-mono leading-relaxed">
          {prompt}
        </pre>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className="px-2 py-0.5 rounded-full bg-accent-glow text-accent text-xs">
            #{tag}
          </span>
        ))}
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!title.trim() || status === "generating"}
        className="w-full py-2.5 rounded-full bg-accent text-bg font-semibold text-sm hover:bg-accent-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {status === "generating" ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            AI 음원 생성 중… (최대 60초)
          </>
        ) : status === "done" ? (
          <>
            <Check size={15} />
            트랙 추가 완료
          </>
        ) : (
          <>
            <Music2 size={15} />
            AI 음원 생성
          </>
        )}
      </button>

      {/* Add without audio (fallback) */}
      <button
        onClick={handleAddWithoutAudio}
        disabled={!title.trim() || status === "generating"}
        className="w-full py-2 rounded-full border border-border text-muted text-sm hover:text-text hover:border-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        프롬프트만 저장 (음원 없이)
      </button>

      {status === "error" && (
        <p className="text-xs text-red-400 text-center">{errorMsg}</p>
      )}
    </div>
  );
}
