import { NextResponse } from 'next/server';
import { runAgent } from '@/server/agentService';

interface RunApiContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RunApiContext) {
  const { id } = await params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!isRunBody(body)) {
    return NextResponse.json({ error: 'input must be a non-empty string up to 10000 chars' }, { status: 400 });
  }

  const result = runAgent({ agentId: id, input: body.input });
  if (!result) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  return NextResponse.json({ result });
}

function isRunBody(value: unknown): value is { input: string } {
  if (!value || typeof value !== 'object') return false;
  const input = (value as { input?: unknown }).input;
  return typeof input === 'string' && input.trim().length > 0 && input.length <= 10000;
}
