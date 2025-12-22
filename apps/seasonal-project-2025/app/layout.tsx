import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AnalysisProvider } from "@features/report/model/AnalysisContext";
import { GoogleAnalytics } from "./components/GoogleAnalytics";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Afterglow",
  description: "올해의 소중한 순간들을 AI와 함께 되돌아보세요.",
  keywords: ["연말 회고", "사진 분석", "AI", "2025", "회고"],
  openGraph: {
    title: "✨ Project Afterglow",
    description: "올해의 소중한 순간들을 AI와 함께 되돌아보세요.",
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
        <GoogleAnalytics />
        <AnalysisProvider>{children}</AnalysisProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
