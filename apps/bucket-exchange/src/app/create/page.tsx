'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { QuestCategory, Difficulty } from '@/data/quests';
import { useAuth } from '@/lib/useAuth';

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
  const router = useRouter();
  const { getIdToken, loading: authLoading } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'travel' as Exclude<QuestCategory, 'all'>,
    reward: 10000,
    difficulty: 'medium' as Difficulty,
    deadline: '',
    maxApplicants: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'reward' || name === 'maxApplicants' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/quests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('server error');
      router.push('/');
    } catch {
      setError('의뢰 등록에 실패했어요. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 text-[10px] text-ink/40 font-mono">
        <Link href="/" className="hover:text-primary transition-colors">Quest Board</Link>
        <span>›</span>
        <span className="text-ink/60">의뢰 등록</span>
      </div>

      <div className="mb-6" style={{ fontFamily: 'Georgia, serif' }}>
        <p className="text-[10px] text-ink/30 tracking-[0.3em] uppercase mb-1">
          Create Quest · 의뢰 등록
        </p>
        <h1 className="text-xl font-bold text-ink mb-1">새 의뢰 작성</h1>
        <p className="text-xs text-ink/40">이루고 싶은 버킷리스트를 의뢰로 등록하세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-paper border border-ink/15 p-6 flex flex-col gap-5">
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
          <p className="text-[10px] text-ink/30 text-right mt-1 font-mono">{form.title.length}/60</p>
        </FormField>

        <div className="divider-dashed" />

        <FormField label="의뢰 내용 · Details" required hint="무엇을 원하는지 상세히 설명해주세요">
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="의뢰 내용을 자세히 설명해주세요."
            required
            maxLength={600}
            rows={5}
            className="w-full bg-white border border-ink/20 px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-primary resize-none leading-relaxed"
          />
          <p className="text-[10px] text-ink/30 text-right mt-1 font-mono">{form.description.length}/600</p>
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
                <option key={cat.value} value={cat.value}>{cat.label}</option>
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
                <option key={d.value} value={d.value}>{d.label}</option>
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

        {error && <p className="text-xs text-stamp font-mono">{error}</p>}

        <button
          type="submit"
          disabled={!form.title || !form.description || submitting || authLoading}
          className="w-full py-3 bg-primary text-white text-xs font-bold tracking-widest uppercase hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? '등록 중...' : '의뢰 등록하기 · Post'}
        </button>
      </form>

      <div className="mt-4">
        <Link href="/" className="text-[10px] text-ink/40 font-mono hover:text-primary transition-colors tracking-widest">
          ← 게시판으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

function FormField({
  label, children, required, hint,
}: {
  label: string; children: React.ReactNode; required?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] text-ink/50 tracking-widest uppercase mb-2 font-mono">
        {label}{required && <span className="text-stamp ml-1">*</span>}
      </label>
      {hint && <p className="text-[10px] text-ink/30 mb-2">{hint}</p>}
      {children}
    </div>
  );
}
