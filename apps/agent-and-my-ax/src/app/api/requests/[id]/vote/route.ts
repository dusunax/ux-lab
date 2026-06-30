import { NextResponse } from 'next/server';
import { voteRequest } from '@/server/agentService';

interface VoteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: VoteContext) {
  const { id } = await params;
  const updated = voteRequest(id);
  if (!updated) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }
  return NextResponse.json({ request: updated });
}
