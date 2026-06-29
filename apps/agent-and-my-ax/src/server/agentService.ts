import { agents, categoryLabels, commentsByAgent, findAgent, findUser, teamRanks, personRanks } from '@/data/mock';
import type { AgentCategory, RunAgentResult, RunArtifact } from '@/types';

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
  const artifacts = createArtifacts(agent.id, agent.title, findUser(agent.creatorId).name);
  const copyText = artifacts
    .map((artifact) => {
      const meta = artifact.meta.map((item) => `${item.label} ${item.value}`).join(' / ');
      return `[${artifact.badge}] ${artifact.title} / ${meta}\n${artifact.description}`;
    })
    .join('\n');

  return {
    agentId,
    inputSummary,
    resultTitle: getResultTitle(agent.id),
    resultCountLabel: `${artifacts.length}개`,
    primaryActionLabel: getPrimaryActionLabel(agent.id),
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

function createArtifacts(agentId: string, agentTitle: string, creatorName: string): RunArtifact[] {
  if (agentId === 'meeting-to-jira') {
    return [
      {
        title: 'Home Feed 검색/카테고리/정렬 UI 구현',
        kind: 'task',
        badge: 'P0',
        description: 'Agent 발견성을 검증하기 위한 목록, 검색, 정렬 인터랙션을 구현합니다.',
        meta: [{ label: '담당', value: 'Avery' }, { label: '마감', value: '이번 주' }],
      },
      {
        title: 'Run Agent 결과 화면을 공통 결과 카드로 정리',
        kind: 'task',
        badge: 'P0',
        description: '특정 도구명에 묶이지 않는 결과 패키지 레이아웃으로 전환합니다.',
        meta: [{ label: '담당', value: 'Avery' }, { label: '마감', value: '오늘' }],
      },
      {
        title: 'OQ 결정 사항을 Sprint 문서에 반영',
        kind: 'task',
        badge: 'P1',
        description: '인증, 실행 방식, 랭킹, Fork 정책을 문서화합니다.',
        meta: [{ label: '담당', value: 'Jordan' }, { label: '마감', value: '리뷰 전' }],
      },
    ];
  }

  return [
    {
      title: `${agentTitle} 핵심 결과`,
      kind: 'summary',
      badge: '요약',
      description: '입력에서 가장 중요한 결론과 판단 근거를 먼저 보여줍니다.',
      meta: [{ label: '작성', value: creatorName }, { label: '형식', value: 'Summary' }],
    },
    {
      title: `${agentTitle} 개선 포인트`,
      kind: 'finding',
      badge: 'Insight',
      description: '사용자가 바로 확인해야 할 위험, 누락, 기회를 결과 카드로 분리합니다.',
      meta: [{ label: '우선순위', value: '높음' }, { label: '검토', value: '리뷰 전' }],
    },
    {
      title: '다음 행동 제안',
      kind: 'recommendation',
      badge: 'Next',
      description: '결과를 실제 업무로 옮기기 위한 다음 단계와 담당 후보를 제안합니다.',
      meta: [{ label: '담당', value: 'Maintainer' }, { label: '시점', value: '다음 스프린트' }],
    },
  ];
}

function getResultTitle(agentId: string) {
  if (agentId === 'meeting-to-jira') return '작업 초안';
  return '실행 결과';
}

function getPrimaryActionLabel(agentId: string) {
  if (agentId === 'meeting-to-jira') return '업무 도구로 보내기';
  return '결과 내보내기';
}
