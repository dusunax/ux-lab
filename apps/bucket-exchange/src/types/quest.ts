import type { Quest } from '@/data/quests';

// Firestore에서 읽어온 퀘스트 (postedAt이 타임스탬프 → string 변환 후)
export type FirestoreQuest = Omit<Quest, 'subtitle' | 'tags'> & {
  subtitle?: string;
  tags?: string[];
  postedAt: string;
};
