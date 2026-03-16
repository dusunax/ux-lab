import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ASSET_PATHS } from "../lib/assets";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stellas-archive.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Stella's Archive",
    template: "%s | Stella's Archive",
  },
  description: "Observe Lumina in a lab.",
  applicationName: "Stella's Archive",
  authors: [{ name: "Dusunax" }],
  robots: {
    index: true,
    follow: true,
  },
  category: "games",
  icons: {
    icon: [
      {
        url: ASSET_PATHS.icons.favicon16,
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: ASSET_PATHS.icons.favicon32,
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: ASSET_PATHS.icons.favicon192,
        sizes: "192x192",
        type: "image/png",
      },
    ],
    shortcut: ASSET_PATHS.icons.faviconIco,
    apple: ASSET_PATHS.icons.appleTouch,
  },
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      ko: "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Stella's Archive",
    title: "Stella's Archive",
    description: "Observe. Interact. Mutate.",
    images: [ASSET_PATHS.imgs.logo],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stella's Archive",
    description: "Observe Lumina in a lab.",
    creator: "@dusunax",
    images: [ASSET_PATHS.imgs.logo],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
