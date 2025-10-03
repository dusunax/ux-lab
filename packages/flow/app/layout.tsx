import "./globals.css";

export const metadata = {
  title: "UX Flow Designer",
  description: "React Flow를 사용한 UX 디자인 도구",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
