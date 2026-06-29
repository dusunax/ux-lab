import { agents, categoryLabels, commentsByAgent, findAgent, findUser, teamRanks, personRanks } from '@/data/mock';
import type { AgentCategory, RunAgentResult } from '@/types';

export type AgentSort = 'popular' | 'recent' | 'tried';

export function listAgents({
  category,
  query,
  sort = 'popular',
}: {
  category?: AgentCategory;
  query?: string;
  sort?: AgentSort;
}) {
  const normalized = query?.trim().toLowerCase() ?? '';
  const filtered = agents.filter((agent) => {
    const matchesCategory = !category || agent.category === category;
    const haystack = [agent.title, agent.description, categoryLabels[agent.category], agent.platform, agent.visibility, ...agent.tags]
      .join(' ')
      .toLowerCase();
    return matchesCategory && (!normalized || haystack.includes(normalized));
  });

  return [...filtered].sort((a, b) => {
    if (sort === 'recent') return b.updatedAt.localeCompare(a.updatedAt);
    if (sort === 'tried') return b.triedCount - a.triedCount;
    return b.likes - a.likes;
  });
}

export function getAgentDetail(id: string) {
  const agent = findAgent(id);
  if (!agent) return null;
  return {
    agent,
    creator: findUser(agent.creatorId),
    comments: commentsByAgent[id] ?? [],
  };
}

export function getRankings() {
  return {
    people: personRanks,
    teams: teamRanks,
  };
}

export function runAgent({ agentId, input }: { agentId: string; input: string }): RunAgentResult | null {
  const agent = findAgent(agentId);
  if (!agent) return null;

  const normalizedInput = input.trim().replace(/\s+/g, ' ');
  const inputSummary = `${normalizedInput.slice(0, 130) || '입력 없음'}${normalizedInput.length > 130 ? '...' : ''}`;
  const artifacts = agent.resultPreset.artifacts;
  const copyText = artifacts
    .map((artifact) => {
      const meta = artifact.meta.map((item) => `${item.label} ${item.value}`).join(' / ');
      return `[${artifact.badge}] ${artifact.title} / ${meta}\n${artifact.description}`;
    })
    .join('\n');

  return {
    agentId,
    inputSummary,
    resultTitle: agent.resultPreset.resultTitle,
    resultCountLabel: `${artifacts.length}개`,
    primaryActionLabel: agent.resultPreset.primaryActionLabel,
    steps: [
      { title: '입력 요약', detail: '긴 입력을 실행 목적에 맞는 핵심 문맥으로 압축했습니다.' },
      { title: '결과 구조화', detail: 'Agent 유형에 맞는 재사용 가능한 결과 카드로 정리했습니다.' },
      { title: '후속 액션 제안', detail: `${artifacts.length}개 결과와 다음 행동을 함께 제안했습니다.` },
    ],
    artifacts,
    copyText,
    createdAt: new Date().toISOString(),
  };
}
