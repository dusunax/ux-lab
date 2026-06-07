"use client";

import { useRef, useState } from "react";
import { Film, Upload, Loader2, Image as ImageIcon, Music } from "lucide-react";
import { Persona } from "@/lib/types";
import { renderVideoFromFiles } from "@/lib/renderVideo";

interface Props {
  persona: Persona | null;
}

export function VideoRender({ persona }: Props) {
  const audioRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [rendering, setRendering] = useState(false);

  const imageUrl = persona?.coverImageUrl ?? "";
  const hasImage = !!imageFile || !!imageUrl;
  const canRender = !!audioFile && hasImage && !!title.trim();

  const handleRender = async () => {
    if (!audioFile) return;
    setRendering(true);
    try {
      await renderVideoFromFiles({
        audioFile,
        imageFile,
        imageUrl,
        title: title.trim(),
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "영상 생성 실패");
    } finally {
      setRendering(false);
    }
  };

  return (
    <div className="space-y-5 max-w-lg">
      {/* 제목 */}
      <Field label="영상 제목">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="트랙 제목을 입력하세요"
          className={inputCls}
        />
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
        hint={!imageFile && imageUrl ? "뮤지션 커버 이미지 사용 중" : undefined}
      >
        {!imageFile && imageUrl ? (
          <div className="flex items-center gap-3 p-3 border border-border rounded-md bg-elevated">
            <img src={imageUrl} alt="cover" className="w-12 h-12 rounded object-cover" />
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
          {!audioFile ? "오디오 파일을 선택해주세요" : !hasImage ? "이미지를 선택해주세요" : "제목을 입력해주세요"}
        </p>
      )}
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
            onClick={(e) => { e.stopPropagation(); inputRef.current!.value = ""; onChange(null as unknown as File); }}
            className="text-xs text-muted hover:text-red-400 ml-auto shrink-0"
          >
            제거
          </button>
        </>
      ) : (
        <>
          <div className="w-9 h-9 rounded bg-elevated flex items-center justify-center shrink-0">{icon}</div>
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

function Field({ label, hint, required, children }: {
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
