import type { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, ClipboardList, Plus, Search } from 'lucide-react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agent를 부탁해 · Agent & My AX',
  description: '사내 AI Agent를 발견하고 실행하고 함께 개선하는 커뮤니티',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
            <Link href="/" className="flex min-w-0 items-center gap-3 focus-ring rounded-xl">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[12px_12px_12px_4px] bg-brand shadow-[0_2px_9px_rgba(255,128,0,.36)]">
                <span className="ml-0.5 h-0 w-0 border-y-[7px] border-l-[10px] border-y-transparent border-l-white" />
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block text-sm font-extrabold">Agent를 부탁해</span>
                <span className="block text-[10px] font-semibold text-slate-400">Agent & My AX</span>
              </span>
            </Link>

            <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-400 md:flex">
              <Search size={16} />
              <span>Agent · 작성자 · 태그 검색</span>
            </div>

            <nav className="ml-auto flex items-center gap-2">
              <Link
                href="/requests"
                className="hidden h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-ring sm:inline-flex"
              >
                <ClipboardList size={16} />
                요청
              </Link>
              <Link
                href="/ranking"
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-ring"
              >
                <BarChart3 size={16} />
                <span className="hidden sm:inline">랭킹</span>
              </Link>
              <Link
                href="/agent/new"
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-ink px-3 text-sm font-bold text-white shadow-[0_2px_8px_rgba(15,23,42,.22)] transition hover:bg-slate-800 focus-ring"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">새 Agent</span>
              </Link>
              <Link href="/profile/dusun" className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#E7E9FD] text-sm font-extrabold text-[#4F46E5] focus-ring">
                김
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-5 md:py-8">{children}</main>
      </body>
    </html>
  );
}
