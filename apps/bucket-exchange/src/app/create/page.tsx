'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { QuestCategory, Difficulty } from '@/data/quests';

const CATEGORIES: { value: Exclude<QuestCategory, 'all'>; label: string }[] = [
  { value: 'travel', label: '여행 · Travel' },
  { value: 'challenge', label: '챌린지 · Challenge' },
  { value: 'learn', label: '배움 · Learn' },
  { value: 'bonds', label: '인연 · Bonds' },
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: '쉬움 ●○○' },
  { value: 'medium', label: '보통 ●●○' },
  { value: 'hard', label: '어려움 ●●●' },
];

export default function CreateQuestPage() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'travel' as Exclude<QuestCategory, 'all'>,
    reward: 10000,
    difficulty: 'medium' as Difficulty,
    deadline: '',
    maxApplicants: 1,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'reward' || name === 'maxApplicants' ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="py-16 text-center" style={{ fontFamily: 'Georgia, serif' }}>
        <div className="mb-6">
          <p className="text-[10px] text-ink/30 tracking-[0.3em] uppercase mb-3">
            Quest Posted
          </p>
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-lg font-bold text-ink mb-2">의뢰가 게시됐습니다!</h2>
          <p className="text-sm text-ink/60 leading-relaxed">
            누군가가 당신의 버킷리스트를 이뤄줄 거예요.
            <br />
            지원자가 생기면 알려드릴게요.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Link
            href="/create"
            className="text-xs font-bold tracking-widest border border-ink/20 text-ink/60 px-4 py-2 hover:border-primary hover:text-primary transition-colors uppercase"
            onClick={() => setSubmitted(false)}
          >
            다른 의뢰 등록
          </Link>
          <Link
            href="/"
            className="text-xs font-bold tracking-widest bg-primary text-white px-4 py-2 hover:bg-primary-dark transition-colors uppercase"
          >
            게시판으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-[10px] text-ink/40 font-mono">
        <Link href="/" className="hover:text-primary transition-colors">
          Quest Board
        </Link>
        <span>›</span>
        <span className="text-ink/60">의뢰 등록</span>
      </div>

      {/* Header */}
      <div className="mb-6" style={{ fontFamily: 'Georgia, serif' }}>
        <p className="text-[10px] text-ink/30 tracking-[0.3em] uppercase mb-1">
          Create Quest · 의뢰 등록
        </p>
        <h1 className="text-xl font-bold text-ink mb-1">새 의뢰 작성</h1>
        <p className="text-xs text-ink/40">
          이루고 싶은 버킷리스트를 의뢰로 등록하세요.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-paper border border-ink/15 p-6 flex flex-col gap-5"
      >
        <FormField label="의뢰 제목 · Title" required hint="간결하고 명확하게 작성해주세요">
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="예: 제주 올레길 1~5코스 완주 대리 여행"
            required
            maxLength={60}
            className="w-full bg-white border border-ink/20 px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-primary"
          />
          <p className="text-[10px] text-ink/30 text-right mt-1 font-mono">
            {form.title.length}/60
          </p>
        </FormField>

        <div className="divider-dashed" />

        <FormField label="의뢰 내용 · Details" required hint="무엇을 원하는지 상세히 설명해주세요">
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="의뢰 내용을 자세히 설명해주세요. 조건, 방법, 결과물 형태 등을 포함하면 좋아요."
            required
            maxLength={600}
            rows={5}
            className="w-full bg-white border border-ink/20 px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-primary resize-none leading-relaxed"
          />
          <p className="text-[10px] text-ink/30 text-right mt-1 font-mono">
            {form.description.length}/600
          </p>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="카테고리 · Category" required>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full bg-white border border-ink/20 px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="난이도 · Difficulty">
            <select
              name="difficulty"
              value={form.difficulty}
              onChange={handleChange}
              className="w-full bg-white border border-ink/20 px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="보상 포인트 · Reward (P)" required>
            <input
              type="number"
              name="reward"
              value={form.reward}
              onChange={handleChange}
              min={1000}
              max={9999999}
              step={1000}
              required
              className="w-full bg-white border border-ink/20 px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary"
            />
          </FormField>

          <FormField label="모집 인원 · Spots">
            <input
              type="number"
              name="maxApplicants"
              value={form.maxApplicants}
              onChange={handleChange}
              min={1}
              max={10}
              className="w-full bg-white border border-ink/20 px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary"
            />
          </FormField>
        </div>

        <FormField label="마감일 · Deadline" hint="YYYY-MM-DD 형식">
          <input
            type="date"
            name="deadline"
            value={form.deadline}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            className="w-full bg-white border border-ink/20 px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary"
          />
        </FormField>

        <div className="divider-dashed" />

        {/* Submit */}
        <button
          type="submit"
          disabled={!form.title || !form.description}
          className="w-full py-3 bg-primary text-white text-xs font-bold tracking-widest uppercase hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          의뢰 등록하기 · Post
        </button>
      </form>

      {/* Back */}
      <div className="mt-4">
        <Link
          href="/"
          className="text-[10px] text-ink/40 font-mono hover:text-primary transition-colors tracking-widest"
        >
          ← 게시판으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] text-ink/50 tracking-widest uppercase mb-2 font-mono">
        {label}
        {required && <span className="text-stamp ml-1">*</span>}
      </label>
      {hint && <p className="text-[10px] text-ink/30 mb-2">{hint}</p>}
      {children}
    </div>
  );
}
