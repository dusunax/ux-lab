'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { getQuestById } from '@/data/quests';
import { useAuth } from '@/lib/useAuth';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default function ApplyPage({ params }: Props) {
  const { id } = use(params);
  const quest = getQuestById(id);
  if (!quest) notFound();

  const { getIdToken, loading: authLoading } = useAuth();
  const [form, setForm] = useState({
    nickname: '',
    reason: '',
    plan: '',
    schedule: '',
    desiredReward: quest.reward,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'desiredReward' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ questId: id, ...form }),
      });
      if (res.status === 409) {
        setError('이미 지원한 의뢰입니다.');
        return;
      }
      if (!res.ok) throw new Error('server error');
      setSubmitted(true);
    } catch {
      setError('제출에 실패했어요. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="py-16 text-center" style={{ fontFamily: 'Georgia, serif' }}>
        <div className="mb-6">
          <p className="text-[10px] text-ink/30 tracking-[0.3em] uppercase mb-3">
            Application Submitted
          </p>
          <div className="text-4xl mb-4">📜</div>
          <h2 className="text-lg font-bold text-ink mb-2">지원서가 접수됐습니다!</h2>
          <p className="text-sm text-ink/60 leading-relaxed">
            의뢰인이 검토 후 연락드릴 예정이에요.
            <br />
            좋은 결과가 있길 바랍니다.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Link
            href={`/quest/${id}`}
            className="text-xs font-bold tracking-widest border border-ink/20 text-ink/60 px-4 py-2 hover:border-primary hover:text-primary transition-colors uppercase"
          >
            의뢰 보기
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
      <div className="flex items-center gap-2 mb-6 text-[10px] text-ink/40 font-mono">
        <Link href="/" className="hover:text-primary transition-colors">Quest Board</Link>
        <span>›</span>
        <Link href={`/quest/${id}`} className="hover:text-primary transition-colors">
          {quest.title}
        </Link>
        <span>›</span>
        <span className="text-ink/60">지원서</span>
      </div>

      <div className="mb-6" style={{ fontFamily: 'Georgia, serif' }}>
        <p className="text-[10px] text-ink/30 tracking-[0.3em] uppercase mb-1">
          Application Form · 지원서
        </p>
        <h1 className="text-xl font-bold text-ink mb-1">{quest.title}</h1>
        <p className="text-xs text-ink/40 font-mono">{quest.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-paper border border-ink/15 p-6 flex flex-col gap-5">
        <FormField label="닉네임 · Nickname" required hint="활동할 닉네임을 입력하세요">
          <input
            type="text"
            name="nickname"
            value={form.nickname}
            onChange={handleChange}
            placeholder="MountainFox"
            required
            maxLength={20}
            className="w-full bg-white border border-ink/20 px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-primary"
          />
        </FormField>

        <div className="divider-dashed" />

        <FormField label="지원 이유 · Why Apply" required hint="왜 이 의뢰에 지원하는지 알려주세요 (최대 300자)">
          <textarea
            name="reason"
            value={form.reason}
            onChange={handleChange}
            placeholder="이 의뢰를 대신 이뤄드릴 수 있는 이유를 써주세요..."
            required
            maxLength={300}
            rows={4}
            className="w-full bg-white border border-ink/20 px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-primary resize-none leading-relaxed"
          />
          <p className="text-[10px] text-ink/30 text-right mt-1 font-mono">
            {form.reason.length}/300
          </p>
        </FormField>

        <FormField label="수행 계획 · Plan" required hint="어떻게 진행할지 구체적으로 알려주세요">
          <textarea
            name="plan"
            value={form.plan}
            onChange={handleChange}
            placeholder="단계별 계획을 작성해주세요..."
            required
            maxLength={500}
            rows={4}
            className="w-full bg-white border border-ink/20 px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-primary resize-none leading-relaxed"
          />
        </FormField>

        <FormField label="예상 일정 · Schedule" hint="완료 예정 시기를 알려주세요">
          <input
            type="text"
            name="schedule"
            value={form.schedule}
            onChange={handleChange}
            placeholder="예: 7월 첫째 주 (3~4일 소요)"
            maxLength={100}
            className="w-full bg-white border border-ink/20 px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-primary"
          />
        </FormField>

        <FormField label={`희망 보상 · Reward (제시 보상: ${quest.reward.toLocaleString()}P)`} hint="희망하는 보상 포인트를 입력하세요">
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="desiredReward"
              value={form.desiredReward}
              onChange={handleChange}
              min={0}
              max={999999}
              className="w-full bg-white border border-ink/20 px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary"
            />
            <span className="text-xs text-ink/60 font-mono flex-shrink-0">P</span>
          </div>
        </FormField>

        <div className="divider-dashed" />

        {error && (
          <p className="text-xs text-stamp font-mono">{error}</p>
        )}

        <button
          type="submit"
          disabled={!form.nickname || !form.reason || !form.plan || submitting || authLoading}
          className="w-full py-3 bg-primary text-white text-xs font-bold tracking-widest uppercase hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? '제출 중...' : '제출하기 · Submit'}
        </button>
      </form>

      <div className="mt-4">
        <Link href={`/quest/${id}`} className="text-[10px] text-ink/40 font-mono hover:text-primary transition-colors tracking-widest">
          ← 의뢰 상세로 돌아가기
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
