import Link from 'next/link';
import { notFound } from 'next/navigation';
import AgentDetailClient from '@/components/AgentDetailClient';
import { agents, findAgent } from '@/data/mock';

interface AgentDetailPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return agents.map((agent) => ({ id: agent.id }));
}

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { id } = await params;
  const agent = findAgent(id);
  if (!agent) notFound();

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Link href="/" className="hover:text-ink">
          Home Feed
        </Link>
        <span>/</span>
        <span className="text-slate-600">{agent.title}</span>
      </div>
      <AgentDetailClient agent={agent} />
    </div>
  );
}
