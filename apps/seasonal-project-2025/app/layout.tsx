import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AnalysisProvider } from "@features/report/model/AnalysisContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Afterglow",
  description:
    "AI 연말 사진 회고. 올해의 소중한 순간들을 AI와 함께 되돌아보며, 따뜻한 회고를 만들어보세요.",
  keywords: ["연말 회고", "사진 분석", "AI", "2025", "회고"],
  openGraph: {
    title: "Project Afterglow",
    description:
      "AI 연말 사진 회고. 올해의 소중한 순간들을 AI와 함께 되돌아보며, 따뜻한 회고를 만들어보세요.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <AnalysisProvider>{children}</AnalysisProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
