import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MythGraph - Neo4j Knowledge Graph of Mythology',
  description: 'Explore the interconnected world of Greek & Roman mythology through an interactive knowledge graph.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
