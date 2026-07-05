'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';

export default function AuthNav({ user }: { user: UserProfile | null }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex h-9 items-center rounded-xl border border-[#BDEBDA] bg-[#E6F8F1] px-3 text-sm font-extrabold text-[#0C7A59] transition hover:bg-[#D8F2E7] focus-ring"
      >
        로그인
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/profile/${user.id}`}
        className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-extrabold focus-ring"
        style={{ background: user.avatarBg, color: user.avatarFg }}
        aria-label={`${user.name} 프로필`}
      >
        {user.name.charAt(0)}
      </Link>
      <button
        type="button"
        onClick={logout}
        disabled={loggingOut}
        className="hidden h-9 items-center rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-50 disabled:opacity-50 focus-ring sm:inline-flex"
      >
        {loggingOut ? '...' : '로그아웃'}
      </button>
    </div>
  );
}
