import { NextResponse } from 'next/server';
import { getAgentDetail } from '@/server/agentService';

interface AgentApiContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: AgentApiContext) {
  const { id } = await params;
  const detail = getAgentDetail(id);
  if (!detail) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  return NextResponse.json(detail);
}
