import { notFound } from 'next/navigation';
import RunAgentClient from '@/components/RunAgentClient';
import { agents, findAgent } from '@/data/mock';

interface RunAgentPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return agents.map((agent) => ({ id: agent.id }));
}

export default async function RunAgentPage({ params }: RunAgentPageProps) {
  const { id } = await params;
  const agent = findAgent(id);
  if (!agent) notFound();

  return <RunAgentClient agent={agent} />;
}
