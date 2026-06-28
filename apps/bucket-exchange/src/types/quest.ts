// 도메인 타입 단일 소스 — data/quests.ts에서 이전
export type QuestStatus = 'recruiting' | 'closing' | 'completed' | 'in_progress';
export type QuestCategory = 'all' | 'travel' | 'challenge' | 'learn' | 'bonds';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Quest {
  id: string;
  title: string;
  subtitle: string;
  category: Exclude<QuestCategory, 'all'>;
  status: QuestStatus;
  reward: number;
  difficulty: Difficulty;
  applicantCount: number;
  maxApplicants: number;
  deadline: string;
  description: string;
  questioner: string;
  postedAt: string;
  tags: string[];
}

export interface Applicant {
  id: string;
  questId: string;
  nickname: string;
  reason: string;
  plan: string;
  schedule: string;
  desiredReward: number;
  appliedAt: string;
}

// Firestore 문서 형태 — postedAt은 Timestamp → string 변환 후, subtitle·tags 선택적
export type FirestoreQuest = Omit<Quest, 'subtitle' | 'tags'> & {
  subtitle?: string;
  tags?: string[];
};
