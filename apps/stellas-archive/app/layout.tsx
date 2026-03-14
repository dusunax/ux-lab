import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Stella's Archive",
  description: "Observe. Interact. Mutate.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
