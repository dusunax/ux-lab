'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

export default function LoginClient({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const login = async () => {
    setLoggingIn(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'dusun' }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? '로그인에 실패했습니다.');
      }
      router.push(next);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '로그인에 실패했습니다.');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-hairline">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E6F8F1] text-[#0C7A59]">
        <ShieldCheck size={22} />
      </div>
      <p className="mb-1 text-xs font-extrabold uppercase tracking-wider text-slate-400">Google Workspace SSO</p>
      <h1 className="text-2xl font-extrabold tracking-normal text-ink">로그인이 필요합니다</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Agent 등록, 요청, 댓글, 좋아요, 써봤어요는 사내 계정으로 로그인한 사용자만 사용할 수 있습니다.
      </p>
      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}
      <button
        type="button"
        onClick={login}
        disabled={loggingIn}
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink text-sm font-extrabold text-white transition hover:bg-slate-800 disabled:opacity-50 focus-ring"
      >
        <ShieldCheck size={17} />
        {loggingIn ? '로그인 중...' : 'SSO mock으로 로그인'}
      </button>
    </div>
  );
}
