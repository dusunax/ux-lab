import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AnalysisProvider } from "@features/report/model/AnalysisContext";
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
      <body className="antialiased">
        <AnalysisProvider>{children}</AnalysisProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}