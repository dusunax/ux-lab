import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barnwood Puzzle Workshop",
  description: "A retro workshop viewer for checking DXF wood puzzle blueprints.",
  icons: {
    icon: "/images/favicon.ico",
    apple: "/images/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
