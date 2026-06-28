import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bucket Exchange · 버킷 익스체인지',
  description: '당신의 버킷리스트를 대신 이뤄줄 사람을 찾습니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-paper relative">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur-sm border-b border-ink/10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span
                className="text-xs font-bold tracking-[0.25em] text-ink/40 uppercase"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Bucket
              </span>
              <span className="w-1 h-1 rounded-full bg-primary" />
              <span
                className="text-xs font-bold tracking-[0.25em] text-primary uppercase"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Exchange
              </span>
            </a>
            <a
              href="/create"
              className="text-[10px] font-bold tracking-widest border border-primary text-primary px-3 py-1.5 hover:bg-primary hover:text-white transition-colors uppercase"
            >
              + 의뢰하기
            </a>
          </div>
        </header>

        {/* Main */}
        <main className="relative z-10 max-w-2xl mx-auto px-4 py-6">{children}</main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-ink/10 mt-12">
          <div className="max-w-2xl mx-auto px-4 py-6 text-center">
            <p
              className="text-[10px] text-ink/30 tracking-widest uppercase"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Bucket Exchange · Experience Marketplace · Sprint 1
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
