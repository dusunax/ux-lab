import { NextRequest, NextResponse } from 'next/server';
import { listAgents } from '@/server/agentService';
import type { AgentCategory } from '@/types';

const categories: AgentCategory[] = ['productivity', 'development', 'planning', 'analytics', 'communication'];
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
