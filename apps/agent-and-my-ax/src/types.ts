export type AgentCategory = 'productivity' | 'development' | 'planning' | 'analytics' | 'communication';

export type AgentBadge = 'Official' | 'Rising' | 'Top Creator' | 'Most Used';

export type AgentPlatform = 'ChatGPT' | 'Claude' | 'Gen.AI' | 'Document.AI' | 'Agent Builder';

export type AgentVisibility = 'company' | 'team' | 'private';

export type AgentDownloadKind = 'cursor' | 'claude' | 'codex' | 'prompt';

export interface UserProfile {
  id: string;
  name: string;
  team: string;
  role: string;
  avatarBg: string;
  avatarFg: string;
  bio: string;
  badge?: AgentBadge;
}

export interface AgentComment {
  id: string;
  author: string;
  team: string;
  content: string;
  createdAt: string;
}

export interface AgentItem {
  id: string;
  title: string;
  description: string;
  category: AgentCategory;
  tags: string[];
  platform: AgentPlatform;
  usageGuide: string;
  visibility: AgentVisibility;
  creatorId: string;
  runLabel: string;
  runPlaceholder: string;
  sampleInput: string;
  sampleOutput: string;
  resultPreset: AgentResultPreset;
  downloads: AgentDownloadAsset[];
  usage: string[];
  history: string[];
  likes: number;
  triedCount: number;
  forkCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  badge?: AgentBadge;
}

export interface AgentDownloadAsset {
  kind: AgentDownloadKind;
  label: string;
  filename: string;
  content: string;
}

export interface PersonRank {
  id: string;
  name: string;
  team: string;
  agents: number;
  likes: number;
  tried: number;
  badge?: AgentBadge;
}

export interface TeamRank {
  name: string;
  members: number;
  agents: number;
  likes: number;
}

export interface RunArtifact {
  title: string;
  kind: 'task' | 'finding' | 'summary' | 'recommendation';
  badge: string;
  description: string;
  meta: Array<{
    label: string;
    value: string;
  }>;
}

export interface AgentResultPreset {
  resultTitle: string;
  primaryActionLabel: string;
  artifacts: RunArtifact[];
}

export interface RunAgentResult {
  agentId: string;
  inputSummary: string;
  resultTitle: string;
  resultCountLabel: string;
  primaryActionLabel: string;
  steps: Array<{
    title: string;
    detail: string;
  }>;
  artifacts: RunArtifact[];
  copyText: string;
  createdAt: string;
}
