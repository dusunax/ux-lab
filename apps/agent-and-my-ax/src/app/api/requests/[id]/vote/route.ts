import { NextResponse } from 'next/server';
import { voteRequest } from '@/server/agentService';
import { getUserFromRequest, unauthorized } from '@/server/auth';

interface VoteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: VoteContext) {
  const user = getUserFromRequest(request);
  if (!user) {
    return unauthorized();
  }

  const { id } = await params;
  const updated = voteRequest(id);
  if (!updated) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }
  return NextResponse.json({ request: updated });
}
