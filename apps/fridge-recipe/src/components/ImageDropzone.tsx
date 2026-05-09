"use client";

import { useRef, useState } from "react";

interface Props {
  imageUrl: string | null;
  onFile: (file: File) => void;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

export default function ImageDropzone({ imageUrl, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  function validate(file: File): string | null {
    if (!ACCEPTED.includes(file.type)) return "JPEG, PNG, WebP 파일만 지원합니다.";
    if (file.size > MAX_BYTES) return "파일 크기는 10MB 이하여야 합니다.";
    return null;
  }

  function handle(file: File) {
    const err = validate(file);
    if (err) { setFileError(err); return; }
    setFileError(null);
    onFile(file);
  }

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handle(file);
        }}
        className="relative cursor-pointer overflow-hidden rounded-xl transition-all duration-300"
        style={{
          height: imageUrl ? 280 : 220,
          background: dragging ? "var(--accent-light)" : "var(--surface)",
          border: dragging
            ? "1.5px dashed var(--accent-mid)"
            : "1.5px dashed var(--border)",
        }}
      >
        {imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="미리보기" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/0 transition-all hover:bg-black/40 group">
              <span className="font-mono text-xs tracking-widest text-white opacity-0 transition-opacity group-hover:opacity-100 uppercase">
                다른 사진 선택
              </span>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 select-none">
            {/* Corner marks */}
            {["top-3 left-3", "top-3 right-3", "bottom-3 left-3", "bottom-3 right-3"].map((pos) => (
              <div
                key={pos}
                className={`absolute ${pos} h-3 w-3 pointer-events-none`}
                style={{
                  borderColor: dragging ? "var(--accent-mid)" : "var(--border)",
                  borderStyle: "solid",
                  borderWidth: pos.includes("top") && pos.includes("left")
                    ? "1.5px 0 0 1.5px"
                    : pos.includes("top") && pos.includes("right")
                    ? "1.5px 1.5px 0 0"
                    : pos.includes("bottom") && pos.includes("left")
                    ? "0 0 1.5px 1.5px"
                    : "0 1.5px 1.5px 0",
                }}
              />
            ))}

            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 ${dragging ? "pulse-animate" : ""}`}
              style={{ background: "var(--accent-light)" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>

            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                사진을 끌어다 놓거나 클릭
              </p>
              <p className="mt-1 font-mono text-xs" style={{ color: "var(--muted)" }}>
                JPEG / PNG / WebP / max 10MB
              </p>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ""; }}
        />
      </div>

      {fileError && (
        <p className="font-mono text-xs" style={{ color: "#b84040" }}>
          {fileError}
        </p>
      )}
    </div>
  );
}
