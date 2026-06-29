export type AgentCategory = 'productivity' | 'development' | 'planning' | 'analytics' | 'communication';

export type AgentBadge = 'Official' | 'Rising' | 'Top Creator' | 'Most Used';

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
  creatorId: string;
  runLabel: string;
  runPlaceholder: string;
  sampleInput: string;
  sampleOutput: string;
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
