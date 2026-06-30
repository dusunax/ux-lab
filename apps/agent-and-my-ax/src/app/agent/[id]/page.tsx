import Link from 'next/link';
import { notFound } from 'next/navigation';
import AgentDetailClient from '@/components/AgentDetailClient';
import { getAgentDetail } from '@/server/agentService';

interface AgentDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { id } = await params;
  const detail = getAgentDetail(id);
  if (!detail) notFound();

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Link href="/" className="hover:text-ink">
          Home Feed
        </Link>
        <span>/</span>
        <span className="text-slate-600">{detail.agent.title}</span>
      </div>
      <AgentDetailClient agent={detail.agent} initialComments={detail.comments} />
    </div>
  );
}
