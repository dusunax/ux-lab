"use client";

import { useState } from "react";
import ImageDropzone from "@/components/ImageDropzone";
import IngredientTagList from "@/components/IngredientTagList";
import { recognizeIngredients } from "@/lib/openrouter";
import { compressImage } from "@/lib/compressImage";

type Status = "idle" | "loading" | "done" | "error";

export default function Step1Page() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  function handleFile(file: File) {
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setIngredients([]);
    setStatus("idle");
    setErrorMessage(null);
  }

  async function analyze() {
    if (!imageFile) return;
    setStatus("loading");
    setErrorMessage(null);
    try {
      const compressed = await compressImage(imageFile);
      const result = await recognizeIngredients(compressed);
      setIngredients(result);
      setStatus("done");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "알 수 없는 오류");
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-[520px] px-6 py-16">

        {/* Header */}
        <header className="mb-10">
          <div className="mb-3 flex items-center gap-3">
            <span
              className="font-mono text-xs tracking-widest uppercase"
              style={{ color: "var(--muted)" }}
            >
              Step 01 / 03
            </span>
            <span
              className="h-px flex-1"
              style={{ background: "var(--border)" }}
            />
          </div>
          <h1
            className="font-display text-5xl font-light leading-[1.1] tracking-tight"
            style={{ color: "var(--text)" }}
          >
            냉장고 안의<br />
            <em className="not-italic" style={{ color: "var(--accent-mid)", fontWeight: 500 }}>
              재료 인식
            </em>
          </h1>
          <p
            className="mt-3 text-sm leading-relaxed"
            style={{ color: "var(--muted)" }}
          >
            냉장고 사진을 업로드하면 AI가 식재료를 자동으로 찾아드립니다
          </p>
        </header>

        {/* Dropzone */}
        <div className="mb-5">
          <ImageDropzone imageUrl={imageUrl} onFile={handleFile} />
        </div>

        {/* Analyze button */}
        <button
          onClick={analyze}
          disabled={!imageFile || status === "loading"}
          className="mb-8 w-full rounded-sm py-3.5 text-sm font-medium tracking-wide transition-all duration-200 disabled:opacity-30"
          style={{
            background: status === "loading" ? "var(--accent-mid)" : "var(--accent)",
            color: "var(--surface)",
            letterSpacing: "0.05em",
          }}
        >
          {status === "loading" ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              분석 중…
            </span>
          ) : (
            "재료 인식 시작"
          )}
        </button>


        {/* Error */}
        {status === "error" && errorMessage && (
          <div
            className="mb-6 rounded-sm border px-4 py-3 font-mono text-xs"
            style={{ borderColor: "#e0b0b0", background: "#fdf5f5", color: "#b84040" }}
          >
            {errorMessage}
          </div>
        )}

        {/* Ingredient results */}
        {status === "done" && ingredients.length > 0 && (
          <div
            className="mb-8 rounded-xl p-6"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="mb-4 flex items-baseline justify-between">
              <h2
                className="font-display text-xl font-medium"
                style={{ color: "var(--text)" }}
              >
                인식된 재료
              </h2>
              <span
                className="font-mono text-xs"
                style={{ color: "var(--warm)" }}
              >
                {ingredients.length}가지
              </span>
            </div>
            <IngredientTagList ingredients={ingredients} onChange={setIngredients} />
          </div>
        )}

        {/* Next step */}
        <button
          disabled={ingredients.length === 0}
          className="group flex w-full items-center justify-between rounded-sm px-5 py-4 text-sm font-medium transition-all duration-200 disabled:opacity-20"
          style={{
            border: "1.5px solid var(--accent)",
            color: "var(--accent)",
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            if (ingredients.length > 0) {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--surface)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)";
          }}
        >
          <span>레시피 추천받기</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="2" y1="8" x2="13" y2="8" />
            <polyline points="9,4 13,8 9,12" />
          </svg>
        </button>

        {/* Footer note */}
        <p className="mt-8 text-center font-mono text-xs" style={{ color: "var(--muted)" }}>
          powered by openrouter / google/gemma / free tier
        </p>
      </div>
    </main>
  );
}
