import { NextRequest, NextResponse } from 'next/server';
import { createAgent, listAgents } from '@/server/agentService';
import type { AgentCategory, AgentPlatform, AgentVisibility, CreateAgentInput } from '@/types';

const categories: AgentCategory[] = ['productivity', 'development', 'planning', 'analytics', 'communication'];
const platforms: AgentPlatform[] = ['ChatGPT', 'Claude', 'Gen.AI', 'Document.AI', 'Agent Builder'];
const visibilities: AgentVisibility[] = ['company', 'team', 'private'];
const sorts = ['popular', 'recent', 'tried'] as const;

export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const categoryParam = params.get('category');
  const sortParam = params.get('sort');
  const category = categories.find((item) => item === categoryParam);
  const sort = sorts.find((item) => item === sortParam) ?? 'popular';

  return NextResponse.json({
    agents: listAgents({
      category,
      query: params.get('q') ?? undefined,
      sort,
    }),
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = validateCreateAgent(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  return NextResponse.json({ agent: createAgent(validation.input) }, { status: 201 });
}

function validateCreateAgent(value: unknown): { ok: true; input: CreateAgentInput } | { ok: false; error: string } {
  if (!value || typeof value !== 'object') return { ok: false, error: 'payload must be an object' };
  const source = value as Record<string, unknown>;
  const required = [
    'title',
    'description',
    'usageGuide',
    'runLabel',
    'runPlaceholder',
    'sampleInput',
    'sampleOutput',
    'prompt',
    'resultTitle',
    'primaryActionLabel',
  ];
  for (const key of required) {
    if (typeof source[key] !== 'string' || !source[key].trim()) {
      return { ok: false, error: `${key} must be a non-empty string` };
    }
  }
  if (!categories.includes(source.category as AgentCategory)) return { ok: false, error: 'category is invalid' };
  if (!platforms.includes(source.platform as AgentPlatform)) return { ok: false, error: 'platform is invalid' };
  if (!visibilities.includes(source.visibility as AgentVisibility)) return { ok: false, error: 'visibility is invalid' };
  const tags = Array.isArray(source.tags)
    ? source.tags.filter((tag): tag is string => typeof tag === 'string' && Boolean(tag.trim())).map((tag) => tag.trim())
    : [];
  if (tags.length === 0) return { ok: false, error: 'tags must include at least one item' };

  return {
    ok: true,
    input: {
      title: String(source.title),
      description: String(source.description),
      category: source.category as AgentCategory,
      tags,
      platform: source.platform as AgentPlatform,
      usageGuide: String(source.usageGuide),
      visibility: source.visibility as AgentVisibility,
      runLabel: String(source.runLabel),
      runPlaceholder: String(source.runPlaceholder),
      sampleInput: String(source.sampleInput),
      sampleOutput: String(source.sampleOutput),
      prompt: String(source.prompt),
      resultTitle: String(source.resultTitle),
      primaryActionLabel: String(source.primaryActionLabel),
    },
  };
}
