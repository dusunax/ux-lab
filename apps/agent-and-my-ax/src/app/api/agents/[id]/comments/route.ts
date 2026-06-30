import { NextResponse } from 'next/server';
import { addComment } from '@/server/agentService';

interface CommentApiContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: CommentApiContext) {
  const { id } = await params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!isCommentBody(body)) {
    return NextResponse.json({ error: 'content must be a non-empty string up to 2000 chars' }, { status: 400 });
  }

  const comment = addComment(id, body.content);
  if (!comment) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  return NextResponse.json({ comment }, { status: 201 });
}

function isCommentBody(value: unknown): value is { content: string } {
  if (!value || typeof value !== 'object') return false;
  const content = (value as { content?: unknown }).content;
  return typeof content === 'string' && content.trim().length > 0 && content.length <= 2000;
}
