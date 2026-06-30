import { notFound } from 'next/navigation';
import RunAgentClient from '@/components/RunAgentClient';
import { getAgentDetail } from '@/server/agentService';

interface RunAgentPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function RunAgentPage({ params }: RunAgentPageProps) {
  const { id } = await params;
  const detail = getAgentDetail(id);
  if (!detail) notFound();

  return <RunAgentClient agent={detail.agent} />;
}
