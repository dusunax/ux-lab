import { agents, categoryLabels, commentsByAgent, findAgent, findUser, teamRanks, personRanks } from '@/data/mock';
import type { AgentCategory, RunAgentResult, RunTicket } from '@/types';

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
    const haystack = [agent.title, agent.description, categoryLabels[agent.category], ...agent.tags]
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
  const tickets = createTickets(agent.id, agent.title, findUser(agent.creatorId).name);
  const copyText = tickets
    .map((ticket) => `[${ticket.priority}] ${ticket.title} / 담당 ${ticket.assignee} / 마감 ${ticket.due}`)
    .join('\n');

  return {
    agentId,
    inputSummary,
    steps: [
      { title: '핵심 결정 추출', detail: '스코프와 담당자 후보를 분리했습니다.' },
      { title: '담당자 자동 추정', detail: '문맥상 담당자와 우선순위를 제안했습니다.' },
      { title: 'Jira 초안 생성', detail: `${tickets.length}개 티켓으로 나눴습니다.` },
    ],
    tickets,
    copyText,
    createdAt: new Date().toISOString(),
  };
}

function createTickets(agentId: string, agentTitle: string, creatorName: string): RunTicket[] {
  if (agentId === 'meeting-to-jira') {
    return [
      { title: 'Home Feed 검색/카테고리/정렬 UI 구현', priority: 'P0', assignee: 'Avery', due: '이번 주' },
      { title: 'Run Agent 결과 화면을 Jira 초안 카드로 정리', priority: 'P0', assignee: 'Avery', due: '오늘' },
      { title: 'OQ 결정 사항을 Sprint 문서에 반영', priority: 'P1', assignee: 'Jordan', due: '리뷰 전' },
    ];
  }

  return [
    { title: `${agentTitle} 입력 검증 규칙 정리`, priority: 'P0', assignee: creatorName, due: '이번 주' },
    { title: `${agentTitle} 결과 템플릿 개선`, priority: 'P1', assignee: creatorName, due: '리뷰 전' },
    { title: '사용자 피드백을 다음 버전에 반영', priority: 'P2', assignee: 'Maintainer', due: '다음 스프린트' },
  ];
}
