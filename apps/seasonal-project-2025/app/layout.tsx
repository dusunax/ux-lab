import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Afterglow",
  description: "AI 기반 연말 사진 회고 웹 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}