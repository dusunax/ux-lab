import type { Metadata } from "next";
import { Cormorant_Garamond, Space_Mono, Lora } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-display",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "냉장고 레시피",
  description: "냉장고 사진으로 재료를 인식하고 레시피를 추천받으세요",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${cormorant.variable} ${spaceMono.variable} ${lora.variable}`}>
      <body className="min-h-screen antialiased" style={{ fontFamily: "var(--font-body)" }}>
        {children}
        <Nav />
      </body>
    </html>
  );
}
