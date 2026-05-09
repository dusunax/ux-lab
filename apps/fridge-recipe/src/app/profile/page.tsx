"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { getProfile, saveProfile, type UserProfile } from "@/lib/storage";

const DIET_OPTIONS: { value: UserProfile["diet"]; label: string }[] = [
  { value: "normal", label: "일반" },
  { value: "vegetarian", label: "채식" },
  { value: "vegan", label: "비건" },
  { value: "low-sodium", label: "무염식" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [diet, setDiet] = useState<UserProfile["diet"]>("normal");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState("");
  const [excludeAllergies, setExcludeAllergies] = useState(false);
  const [specialNote, setSpecialNote] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const profile = getProfile();
    if (profile) {
      setNickname(profile.nickname);
      setDiet(profile.diet);
      setAllergies(profile.allergies);
      setExcludeAllergies(profile.excludeAllergies ?? false);
      setSpecialNote(profile.specialNote ?? "");
      setIsEdit(true);
    }
  }, []);

  function addAllergy() {
    const v = allergyInput.trim();
    if (v && !allergies.includes(v) && allergies.length < 10) {
      setAllergies([...allergies, v]);
      setSaved(false);
    }
    setAllergyInput("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); addAllergy(); }
  }

  function handleSave() {
    if (!nickname.trim()) return;
    const profile: UserProfile = {
      nickname: nickname.trim(),
      diet,
      allergies,
      excludeAllergies,
      specialNote: specialNote.trim(),
      createdAt: getProfile()?.createdAt ?? new Date().toISOString(),
    };
    saveProfile(profile);
    setSaved(true);
  }

  return (
    <main className="min-h-screen pb-20" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-[520px] px-6 py-12">
        <header className="mb-6">
          <div className="mb-3 flex items-center gap-3">
            <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--muted)" }}>
              프로필
            </span>
            <span className="h-px flex-1" style={{ background: "var(--border)" }} />
          </div>
          <h1 className="font-display text-4xl font-light leading-tight" style={{ color: "var(--text)" }}>
            {isEdit ? "프로필 수정" : "프로필 설정"}
          </h1>
        </header>

        <div className="space-y-6">
          {/* Nickname */}
          <div>
            <label className="mb-2 block font-mono text-xs tracking-widest uppercase" style={{ color: "var(--muted)" }}>
              닉네임
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => { setNickname(e.target.value.slice(0, 20)); setSaved(false); }}
              placeholder="1–20자"
              className="w-full rounded-sm border bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-1"
              style={{ borderColor: "var(--border)", color: "var(--text)", "--tw-ring-color": "var(--accent-mid)" } as React.CSSProperties}
            />
          </div>

          {/* Diet */}
          <div>
            <p className="mb-2 font-mono text-xs tracking-widest uppercase" style={{ color: "var(--muted)" }}>식단 유형</p>
            <div className="flex gap-2">
              {DIET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setDiet(opt.value); setSaved(false); }}
                  className="rounded-sm px-4 py-2 text-sm transition-all duration-150"
                  style={{
                    background: diet === opt.value ? "var(--accent)" : "var(--surface)",
                    color: diet === opt.value ? "var(--surface)" : "var(--text)",
                    border: `1px solid ${diet === opt.value ? "var(--accent)" : "var(--border)"}`,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div>
            <p className="mb-2 font-mono text-xs tracking-widest uppercase" style={{ color: "var(--muted)" }}>
              알레르기 재료 <span style={{ color: "var(--warm)" }}>({allergies.length}/10)</span>
            </p>
            {allergies.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {allergies.map((a) => (
                  <span
                    key={a}
                    className="flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-mono text-xs"
                    style={{ background: "var(--danger-light)", border: "1px solid var(--danger-mid)", color: "var(--danger)" }}
                  >
                    {a}
                    <button onClick={() => { setAllergies(allergies.filter((x) => x !== a)); setSaved(false); }} style={{ lineHeight: 1 }}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <line x1="1" y1="1" x2="7" y2="7" /><line x1="7" y1="1" x2="1" y2="7" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="재료 입력 후 Enter"
                disabled={allergies.length >= 10}
                className="flex-1 rounded-sm border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 disabled:opacity-40"
                style={{ borderColor: "var(--border)", color: "var(--text)", "--tw-ring-color": "var(--accent-mid)" } as React.CSSProperties}
              />
              <button
                onClick={addAllergy}
                disabled={!allergyInput.trim() || allergies.length >= 10 || allergies.includes(allergyInput.trim())}
                className="rounded-sm px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-30"
                style={{ background: "var(--accent)", color: "var(--surface)" }}
              >
                추가
              </button>
            </div>
          </div>

          {/* 특이사항 */}
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <label className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--muted)" }}>
                특이사항
              </label>
              <span className="font-mono text-xs" style={{ color: specialNote.length >= 280 ? "var(--warm)" : "var(--muted)" }}>
                {specialNote.length}/300
              </span>
            </div>
            <textarea
              value={specialNote}
              onChange={(e) => { setSpecialNote(e.target.value.slice(0, 300)); setSaved(false); }}
              placeholder="레시피 추천 시 우선 반영할 사항을 입력하세요 (예: 매운 음식 선호, 기름진 요리 제외)"
              rows={3}
              className="w-full resize-none rounded-sm border bg-transparent px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-1"
              style={{ borderColor: "var(--border)", color: "var(--text)", "--tw-ring-color": "var(--accent-mid)" } as React.CSSProperties}
            />
          </div>

          {/* 개인설정 */}
          {allergies.length > 0 && (
            <div className="space-y-3">
              <p className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--muted)" }}>개인설정</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>알레르기 재료 기본 무시</p>
                  <p className="font-mono text-xs" style={{ color: "var(--muted)" }}>레시피 추천 시 기본으로 제외</p>
                </div>
                <button
                  onClick={() => { setExcludeAllergies((v) => !v); setSaved(false); }}
                  className="relative h-6 w-11 shrink-0 rounded-full transition-all duration-200"
                  style={{ background: excludeAllergies ? "var(--accent)" : "var(--border)" }}
                  aria-checked={excludeAllergies}
                  role="switch"
                >
                  <span
                    className="absolute top-0.5 h-5 w-5 rounded-full transition-all duration-200"
                    style={{
                      background: "var(--surface)",
                      left: excludeAllergies ? "22px" : "2px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                    }}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!nickname.trim() || saved}
            className="w-full rounded-sm py-3.5 text-sm font-medium tracking-wide transition-all duration-200 disabled:opacity-40"
            style={{ background: saved ? "var(--accent-mid)" : "var(--accent)", color: "var(--surface)", letterSpacing: "0.05em" }}
          >
            {saved ? "저장됨" : "저장"}
          </button>
        </div>
      </div>
    </main>
  );
}
