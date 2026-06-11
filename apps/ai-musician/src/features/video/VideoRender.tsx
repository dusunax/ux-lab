"use client";

import { useRef, useState, useEffect } from "react";
import { Film, Upload, Loader2, Image as ImageIcon, Music } from "lucide-react";
import type { Persona } from "@/lib/types";
import { isAbortError, renderVideoFromFiles } from "@/lib/renderVideo";

const BG_PRESETS = [
  { label: "Lavender",  value: "#e8e0f5" },
  { label: "Blush",     value: "#fde8e8" },
  { label: "Mint",      value: "#e0f5ec" },
  { label: "Sky",       value: "#dceef8" },
  { label: "Peach",     value: "#fdf0e0" },
  { label: "Lemon",     value: "#f5f5dc" },
];

const TEXT_PRESETS = [
  { label: "Black",      value: "#1a1a1a" },
  { label: "Charcoal",   value: "#3d3d3d" },
  { label: "White",      value: "#ffffff" },
  { label: "Ivory",      value: "#f5f0e8" },
];

interface Props {
  persona: Persona | null;
}

export function VideoRender({ persona }: Props) {
  const audioRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const renderAbortRef = useRef<AbortController | null>(null);

  const [audioFile, setAudioFile]   = useState<File | null>(null);
  const [imageFile, setImageFile]   = useState<File | null>(null);
  const [title, setTitle]           = useState("");
  const [titleEn, setTitleEn]       = useState("");
  const [bgColor, setBgColor]       = useState(BG_PRESETS[0].value);
  const [textColor, setTextColor]   = useState(TEXT_PRESETS[0].value);
  const [artist, setArtist]         = useState(persona?.name ?? "");
  const [rendering, setRendering]   = useState(false);

  const coverUrl = persona?.coverImageUrl ?? "";
  const [previewUrl, setPreviewUrl] = useState(coverUrl);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(coverUrl);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile, coverUrl]);

  useEffect(() => {
    return () => {
      renderAbortRef.current?.abort();
    };
  }, []);

  const displayTitle = title && titleEn ? `${title} (${titleEn})` : title || titleEn;
  const hasImage  = !!imageFile || !!coverUrl;
  const canRender = !!audioFile && hasImage && !!title.trim();

  const handleRender = async () => {
    if (!audioFile) return;
    renderAbortRef.current?.abort();
    const controller = new AbortController();
    renderAbortRef.current = controller;
    setRendering(true);
    try {
      await renderVideoFromFiles({
        audioFile,
        imageFile,
        imageUrl: coverUrl,
        title: displayTitle,
        bgColor,
        textColor,
        artist: artist.trim(),
        signal: controller.signal,
      });
    } catch (err) {
      if (isAbortError(err)) return;
      alert(err instanceof Error ? err.message : "영상 생성 실패");
    } finally {
      if (renderAbortRef.current === controller) {
        renderAbortRef.current = null;
        setRendering(false);
      }
    }
  };

  return (
    <div className="space-y-5 max-w-lg">
      {/* 제목 */}
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

      {/* 가수 */}
      <Field label="가수">
        <input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder={persona?.name ?? "가수명"}
          className={inputCls}
        />
      </Field>

      {/* 배경색 */}
      <Field label="배경색">
        <ColorPicker
          presets={BG_PRESETS}
          value={bgColor}
          onChange={setBgColor}
        />
      </Field>

      {/* 폰트색 */}
      <Field label="폰트색">
        <ColorPicker
          presets={TEXT_PRESETS}
          value={textColor}
          onChange={setTextColor}
        />
      </Field>

      {/* 썸네일 미리보기 */}
      <Field label="미리보기">
        <div
          className="w-full rounded-lg overflow-hidden flex flex-col items-center justify-center gap-2"
          style={{ backgroundColor: bgColor, aspectRatio: "16 / 9" }}
        >
          {/* 앨범아트 — 너비 25%, 정사각형 */}
          <div
            style={{ width: "34%", aspectRatio: "1 / 1", backgroundColor: bgColor, flexShrink: 0 }}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="thumbnail" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center border border-black/10 rounded">
                <ImageIcon size={16} className="text-black/20" />
              </div>
            )}
          </div>

          {/* 제목·가수명 */}
          <div className="text-center w-full px-6 space-y-0.5 leading-tight">
            <p className="text-[10px] font-semibold break-words" style={{ color: textColor }}>
              {displayTitle || <span className="opacity-20">제목 (English Title)</span>}
            </p>
            <p className="text-[7px] break-words" style={{ color: textColor, opacity: 0.7 }}>
              {artist || <span className="opacity-30">가수명</span>}
            </p>
          </div>
        </div>
      </Field>

      {/* 오디오 파일 */}
      <Field label="오디오 파일" required>
        <FileDrop
          file={audioFile}
          accept="audio/*"
          icon={<Music size={20} className="text-muted" />}
          hint="MP3, WAV, M4A 등"
          onChange={setAudioFile}
          inputRef={audioRef}
        />
      </Field>

      {/* 이미지 파일 */}
      <Field
        label="썸네일 이미지"
        hint={!imageFile && coverUrl ? "뮤지션 커버 이미지 사용 중" : undefined}
      >
        {!imageFile && coverUrl ? (
          <div className="flex items-center gap-3 p-3 border border-border rounded-md bg-elevated">
            <img src={coverUrl} alt="cover" className="w-12 h-12 rounded object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text truncate">{persona?.name} 커버</p>
              <button
                onClick={() => imageRef.current?.click()}
                className="text-xs text-accent hover:underline mt-0.5"
              >
                다른 이미지 선택
              </button>
            </div>
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
          </div>
        ) : (
          <FileDrop
            file={imageFile}
            accept="image/*"
            icon={<ImageIcon size={20} className="text-muted" />}
            hint="JPG, PNG, WebP"
            onChange={setImageFile}
            inputRef={imageRef}
          />
        )}
      </Field>

      {/* 생성 버튼 */}
      <button
        onClick={handleRender}
        disabled={!canRender || rendering}
        className="w-full py-3 rounded-full bg-accent text-bg font-semibold text-sm hover:bg-accent-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {rendering ? (
          <><Loader2 size={15} className="animate-spin" /> 생성 중...</>
        ) : (
          <><Film size={15} /> 영상 생성</>
        )}
      </button>

      {!canRender && !rendering && (
        <p className="text-xs text-border text-center">
          {!audioFile
            ? "오디오 파일을 선택해주세요"
            : !hasImage
            ? "이미지를 선택해주세요"
            : "제목을 입력해주세요"}
        </p>
      )}
    </div>
  );
}

function ColorPicker({
  presets, value, onChange,
}: {
  presets: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {presets.map((p) => (
        <button
          key={p.value}
          title={p.label}
          onClick={() => onChange(p.value)}
          className="w-5 h-5 rounded-full border-2 transition-all shrink-0"
          style={{
            backgroundColor: p.value,
            borderColor: value === p.value ? "#22d3ee" : "transparent",
            outline: value === p.value ? "2px solid #22d3ee44" : "none",
            boxShadow: p.value === "#ffffff" || p.value === "#f5f0e8" ? "inset 0 0 0 1px rgba(0,0,0,0.15)" : "none",
          }}
        />
      ))}
      <label className="flex items-center gap-1 cursor-pointer ml-1">
        <span className="text-xs text-muted">직접</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-5 h-5 rounded cursor-pointer border border-border bg-transparent p-0"
        />
      </label>
      <span className="text-xs text-border font-mono ml-auto">{value}</span>
    </div>
  );
}

function FileDrop({
  file, accept, icon, hint, onChange, inputRef,
}: {
  file: File | null;
  accept: string;
  icon: React.ReactNode;
  hint: string;
  onChange: (f: File) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) onChange(f);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="flex items-center gap-3 p-4 border border-dashed border-border rounded-md bg-elevated/40 cursor-pointer hover:border-accent hover:bg-elevated transition-colors"
    >
      {file ? (
        <>
          <div className="w-9 h-9 rounded bg-accent-glow flex items-center justify-center shrink-0">
            <Upload size={16} className="text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-text truncate">{file.name}</p>
            <p className="text-xs text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current!.value = "";
              onChange(null as unknown as File);
            }}
            className="text-xs text-muted hover:text-red-400 ml-auto shrink-0"
          >
            제거
          </button>
        </>
      ) : (
        <>
          <div className="w-9 h-9 rounded bg-elevated flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <p className="text-sm text-muted">클릭 또는 드래그하여 파일 선택</p>
            <p className="text-xs text-border">{hint}</p>
          </div>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange(f);
        }}
      />
    </div>
  );
}

function Field({
  label, hint, required, children,
}: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-2">
        <label className="text-xs text-muted uppercase tracking-wide font-medium">
          {label}{required && <span className="text-accent ml-1">*</span>}
        </label>
        {hint && <span className="text-xs text-border">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text placeholder:text-border focus:outline-none focus:border-accent transition-colors";
