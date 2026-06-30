import {
  agents as seedAgents,
  commentsByAgent,
  findUser,
  interactionSeeds,
  requestSeeds,
  users,
} from '@/data/mock';
import { createDownloads } from '@/data/agentArtifacts';
import type {
  AgentComment,
  AgentItem,
  AgentInteractionKind,
  AgentRequest,
  CreateAgentInput,
  CreateAgentRequestInput,
  UserActivitySummary,
  UserProfile,
} from '@/types';

export interface AgentRepository {
  getCurrentUser(): UserProfile;
  listAgents(): AgentItem[];
  getAgent(id: string): AgentItem | null;
  createAgent(input: CreateAgentInput, creatorId: string): AgentItem;
  getComments(agentId: string): AgentComment[];
  addComment(agentId: string, content: string, authorId: string): AgentComment | null;
  setInteraction(agentId: string, userId: string, kind: AgentInteractionKind, active: boolean): AgentItem | null;
  listRequests(): AgentRequest[];
  createRequest(input: CreateAgentRequestInput, requesterId: string): AgentRequest;
  voteRequest(requestId: string): AgentRequest | null;
  getUserActivity(userId: string): UserActivitySummary | null;
}

interface MockRepositoryState {
  agents: AgentItem[];
  requests: AgentRequest[];
  comments: Record<string, AgentComment[]>;
  interactions: Record<AgentInteractionKind, Array<{ userId: string; agentId: string }>>;
}

const mockState = getMockRepositoryState();

export const mockRepository: AgentRepository = {
  getCurrentUser() {
    return users[0];
  },

  listAgents() {
    return [...mockState.agents];
  },

  getAgent(id) {
    return mockState.agents.find((agent) => agent.id === id) ?? null;
  },

  createAgent(input, creatorId) {
    const now = new Date().toISOString().slice(0, 10);
    const slug = slugify(input.title);
    const id = uniqueId(slug, (candidate) => mockState.agents.some((agent) => agent.id === candidate));
    const creator = findUser(creatorId);
    const agent: AgentItem = {
      id,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      tags: input.tags,
      platform: input.platform,
      usageGuide: input.usageGuide.trim(),
      visibility: input.visibility,
      creatorId,
      runLabel: input.runLabel.trim(),
      runPlaceholder: input.runPlaceholder.trim(),
      sampleInput: input.sampleInput.trim(),
      sampleOutput: input.sampleOutput.trim(),
      resultPreset: {
        resultTitle: input.resultTitle.trim(),
        primaryActionLabel: input.primaryActionLabel.trim(),
        artifacts: [
          {
            title: `${input.title.trim()} 핵심 결과`,
            kind: 'summary',
            badge: 'Preview',
            description: input.sampleOutput.trim(),
            meta: [
              { label: '작성', value: creator.name },
              { label: '형식', value: input.platform },
            ],
          },
          {
            title: '다음 행동 제안',
            kind: 'recommendation',
            badge: 'Next',
            description: '입력 내용을 업무 결과로 옮기기 위한 다음 단계를 확인하세요.',
            meta: [
              { label: '공개', value: input.visibility },
              { label: '상태', value: '초안' },
            ],
          },
        ],
      },
      downloads: createDownloads({
        id,
        title: input.title.trim(),
        platform: input.platform,
        usageGuide: input.usageGuide.trim(),
        visibility: input.visibility,
        prompt: input.prompt.trim(),
      }),
      usage: ['입력 예시를 참고해 원문을 붙여넣는다', 'Run을 눌러 결과 카드를 확인한다', '필요한 형식으로 복사하거나 다운로드한다'],
      history: [`v0.1: ${creator.name} 등록 초안`, 'Sprint 2: Create Agent flow에서 생성'],
      likes: 0,
      triedCount: 0,
      forkCount: 0,
      commentCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    mockState.agents.unshift(agent);
    return agent;
  },

  getComments(agentId) {
    return mockState.comments[agentId] ?? [];
  },

  addComment(agentId, content, authorId) {
    const agent = mockState.agents.find((item) => item.id === agentId);
    const author = findUser(authorId);
    if (!agent || !content.trim()) return null;
    const comment: AgentComment = {
      id: uniqueId(`comment-${Date.now()}`, (candidate) => (mockState.comments[agentId] ?? []).some((item) => item.id === candidate)),
      author: author.name,
      team: `${author.team} / ${author.role}`,
      content: content.trim(),
      createdAt: '방금 전',
    };
    mockState.comments[agentId] = [comment, ...(mockState.comments[agentId] ?? [])];
    agent.commentCount = mockState.comments[agentId].length;
    agent.updatedAt = new Date().toISOString().slice(0, 10);
    return comment;
  },

  setInteraction(agentId, userId, kind, active) {
    const agent = mockState.agents.find((item) => item.id === agentId);
    if (!agent) return null;
    const records = mockState.interactions[kind];
    const recordIndex = records.findIndex((item) => item.agentId === agentId && item.userId === userId);
    const hasRecord = recordIndex >= 0;
    if (active && !hasRecord) {
      records.push({ agentId, userId });
      updateInteractionCount(agent, kind, 1);
    }
    if (!active && hasRecord) {
      records.splice(recordIndex, 1);
      updateInteractionCount(agent, kind, -1);
    }
    agent.updatedAt = new Date().toISOString().slice(0, 10);
    return agent;
  },

  listRequests() {
    return [...mockState.requests].sort((a, b) => b.votes - a.votes || b.createdAt.localeCompare(a.createdAt));
  },

  createRequest(input, requesterId) {
    const id = uniqueId(slugify(input.title), (candidate) => mockState.requests.some((request) => request.id === candidate));
    const request: AgentRequest = {
      id,
      title: input.title.trim(),
      description: input.description.trim(),
      requesterId,
      team: input.team.trim(),
      status: 'open',
      votes: 1,
      tags: input.tags,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    mockState.requests.unshift(request);
    return request;
  },

  voteRequest(requestId) {
    const request = mockState.requests.find((item) => item.id === requestId);
    if (!request) return null;
    request.votes += 1;
    return request;
  },

  getUserActivity(userId) {
    const user = users.find((item) => item.id === userId);
    if (!user) return null;
    const authoredAgents = mockState.agents.filter((agent) => agent.creatorId === userId);
    const triedAgents = mockState.interactions.tried
      .filter((item) => item.userId === userId)
      .map((item) => mockState.agents.find((agent) => agent.id === item.agentId))
      .filter((agent): agent is AgentItem => Boolean(agent));
    const likedAgents = mockState.interactions.likes
      .filter((item) => item.userId === userId)
      .map((item) => mockState.agents.find((agent) => agent.id === item.agentId))
      .filter((agent): agent is AgentItem => Boolean(agent));
    const forkedAgents = mockState.interactions.forks
      .filter((item) => item.userId === userId)
      .map((item) => mockState.agents.find((agent) => agent.id === item.agentId))
      .filter((agent): agent is AgentItem => Boolean(agent));
    const requests = mockState.requests.filter((request) => request.requesterId === userId);

    return { user, authoredAgents, triedAgents, likedAgents, forkedAgents, requests };
  },
};

export function getRepository(): AgentRepository {
  return mockRepository;
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `agent-${Date.now()}`;
}

function uniqueId(base: string, exists: (candidate: string) => boolean) {
  let candidate = base;
  let index = 2;
  while (exists(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  return candidate;
}

function getMockRepositoryState(): MockRepositoryState {
  const globalStore = globalThis as typeof globalThis & {
    __agentAndMyAxMockState?: Partial<MockRepositoryState>;
  };
  globalStore.__agentAndMyAxMockState ??= {
    agents: [...seedAgents],
    requests: [...requestSeeds],
  };
  const state = globalStore.__agentAndMyAxMockState;
  state.agents ??= [...seedAgents];
  state.requests ??= [...requestSeeds];
  state.comments ??= Object.fromEntries(Object.entries(commentsByAgent).map(([agentId, comments]) => [agentId, [...comments]]));
  state.interactions ??= {
    likes: [...interactionSeeds.likes],
    tried: [...interactionSeeds.tried],
    forks: [...interactionSeeds.forks],
  };
  state.interactions.likes ??= [...interactionSeeds.likes];
  state.interactions.tried ??= [...interactionSeeds.tried];
  state.interactions.forks ??= [...interactionSeeds.forks];
  return state as MockRepositoryState;
}

function updateInteractionCount(agent: AgentItem, kind: AgentInteractionKind, delta: 1 | -1) {
  if (kind === 'likes') agent.likes = Math.max(0, agent.likes + delta);
  if (kind === 'tried') agent.triedCount = Math.max(0, agent.triedCount + delta);
  if (kind === 'forks') agent.forkCount = Math.max(0, agent.forkCount + delta);
}
