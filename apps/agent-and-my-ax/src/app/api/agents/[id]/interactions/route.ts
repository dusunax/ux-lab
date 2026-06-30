import { NextResponse } from 'next/server';
import { setInteraction } from '@/server/agentService';
import type { AgentInteractionKind } from '@/types';

const kinds: AgentInteractionKind[] = ['likes', 'tried', 'forks'];

interface InteractionApiContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: InteractionApiContext) {
  const { id } = await params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!isInteractionBody(body)) {
    return NextResponse.json({ error: 'kind and active are required' }, { status: 400 });
  }

  const agent = setInteraction(id, body.kind, body.active);
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  return NextResponse.json({ agent });
}

function isInteractionBody(value: unknown): value is { kind: AgentInteractionKind; active: boolean } {
  if (!value || typeof value !== 'object') return false;
  const source = value as { kind?: unknown; active?: unknown };
  return kinds.includes(source.kind as AgentInteractionKind) && typeof source.active === 'boolean';
}
