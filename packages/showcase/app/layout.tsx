import "./globals.css";

export const metadata = {
  title: "UI Components",
  description: "모노레포로 구성된 공통 컴포넌트 라이브러리 쇼케이스",
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
