import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Musician",
  description: "페르소나 기반 AI 음원 생성",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
