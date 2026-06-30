import { NextResponse } from 'next/server';
import { createRequest, listRequests } from '@/server/agentService';
import type { CreateAgentRequestInput } from '@/types';

export function GET() {
  return NextResponse.json({ requests: listRequests() });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = validateRequest(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  return NextResponse.json({ request: createRequest(validation.input) }, { status: 201 });
}

function validateRequest(value: unknown): { ok: true; input: CreateAgentRequestInput } | { ok: false; error: string } {
  if (!value || typeof value !== 'object') return { ok: false, error: 'payload must be an object' };
  const source = value as Record<string, unknown>;
  for (const key of ['title', 'description', 'team']) {
    if (typeof source[key] !== 'string' || !source[key].trim()) {
      return { ok: false, error: `${key} must be a non-empty string` };
    }
  }
  const tags = Array.isArray(source.tags)
    ? source.tags.filter((tag): tag is string => typeof tag === 'string' && Boolean(tag.trim())).map((tag) => tag.trim())
    : [];
  return {
    ok: true,
    input: {
      title: String(source.title),
      description: String(source.description),
      team: String(source.team),
      tags,
    },
  };
}
