import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Noto_Sans_KR } from "next/font/google";
import { Toaster } from "sonner";
import { AnalysisProvider } from "@features/report/model/AnalysisContext";
import { GoogleAnalytics } from "./components/GoogleAnalytics";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto-sans-kr",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "system-ui",
    "Roboto",
    "Helvetica Neue",
    "Segoe UI",
    "Apple SD Gothic Neo",
    "Malgun Gothic",
    "sans-serif",
  ],
});

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
    <html lang="ko" className={notoSansKR.variable}>
      <body className={`${notoSansKR.className} antialiased`}>
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <AnalysisProvider>{children}</AnalysisProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
