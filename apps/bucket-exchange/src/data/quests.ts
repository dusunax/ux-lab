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

export const QUESTS: Quest[] = [
  {
    id: 'q-001',
    title: '한달 동안 매일 새벽 러닝',
    subtitle: 'Dream Order · 의뢰 #001',
    category: 'challenge',
    status: 'recruiting',
    reward: 15000,
    difficulty: 'hard',
    applicantCount: 3,
    maxApplicants: 5,
    deadline: '2026-07-10',
    description:
      '저는 혼자서는 절대 못 일어나는 사람인데요... 누군가 저 대신 새벽 6시에 러닝을 해주고 인증샷을 보내주실 분을 찾습니다. 한달 동안 매일 아침 인증해주시면 됩니다.',
    questioner: 'MorningHater',
    postedAt: '2026-06-20',
    tags: ['러닝', '아침', '건강', '30일챌린지'],
  },
  {
    id: 'q-002',
    title: '제주도 올레길 완주 대리 여행',
    subtitle: 'Dream Order · 의뢰 #002',
    category: 'travel',
    status: 'recruiting',
    reward: 80000,
    difficulty: 'medium',
    applicantCount: 12,
    maxApplicants: 1,
    deadline: '2026-07-05',
    description:
      '몸이 불편해서 직접 갈 수 없지만 제주 올레길을 꼭 걷고 싶습니다. 대신 걸어주시면서 사진과 영상으로 생생하게 공유해주실 분을 찾습니다. 올레 1코스부터 5코스까지만이라도 부탁드려요.',
    questioner: 'DreamWalker88',
    postedAt: '2026-06-18',
    tags: ['제주', '올레길', '대리여행', '힐링'],
  },
  {
    id: 'q-003',
    title: '파이썬으로 가계부 자동화 스크립트 배우기',
    subtitle: 'Dream Order · 의뢰 #003',
    category: 'learn',
    status: 'closing',
    reward: 30000,
    difficulty: 'easy',
    applicantCount: 7,
    maxApplicants: 1,
    deadline: '2026-06-30',
    description:
      '비전공자인데 파이썬으로 엑셀 가계부 자동화를 배우고 싶습니다. 주 2회, 총 4회 온라인으로 기초부터 가르쳐주실 선생님을 찾습니다. 완전 기초입니다!',
    questioner: 'ExcelSurvivor',
    postedAt: '2026-06-15',
    tags: ['파이썬', '가계부', '자동화', '코딩교육'],
  },
  {
    id: 'q-004',
    title: '우리 할머니 생신 케이크 수령 대행',
    subtitle: 'Dream Order · 의뢰 #004',
    category: 'bonds',
    status: 'recruiting',
    reward: 20000,
    difficulty: 'easy',
    applicantCount: 2,
    maxApplicants: 1,
    deadline: '2026-07-03',
    description:
      '해외 출장 중이라 직접 못 가는데 할머니 생신 케이크를 홍대 O 케이크숍에서 수령해서 마포구 OO동으로 배달해주실 분을 찾아요. 케이크 값은 따로 드립니다.',
    questioner: 'LovingGrandkid',
    postedAt: '2026-06-22',
    tags: ['배달', '케이크', '생신', '심부름'],
  },
  {
    id: 'q-005',
    title: '유럽 배낭여행 경로 짜기 컨설팅',
    subtitle: 'Dream Order · 의뢰 #005',
    category: 'travel',
    status: 'recruiting',
    reward: 25000,
    difficulty: 'medium',
    applicantCount: 5,
    maxApplicants: 1,
    deadline: '2026-07-15',
    description:
      '8월에 2주간 유럽 여행 예정인데 처음 가는 거라 막막해요. 파리-바르셀로나-로마 루트로 일정 짜주실 분 구합니다. 예산 관리 팁도 함께 알려주시면 감사!',
    questioner: 'FirstTimeEurope',
    postedAt: '2026-06-21',
    tags: ['유럽', '배낭여행', '여행계획', '컨설팅'],
  },
  {
    id: 'q-006',
    title: '기타 코드 3개만 알려주세요',
    subtitle: 'Dream Order · 의뢰 #006',
    category: 'learn',
    status: 'recruiting',
    reward: 10000,
    difficulty: 'easy',
    applicantCount: 4,
    maxApplicants: 1,
    deadline: '2026-07-08',
    description:
      '좋아하는 노래 코드 3개(G, C, D)만 제대로 짚고 싶습니다. 1시간 레슨 한 번만 해주실 기타 치시는 분 구합니다. 강남역 근처 스터디카페에서 만날 수 있어요.',
    questioner: 'WannaBePicker',
    postedAt: '2026-06-23',
    tags: ['기타', '레슨', '입문', '악기'],
  },
];

export const APPLICANTS: Applicant[] = [
  {
    id: 'a-001',
    questId: 'q-002',
    nickname: 'MountainFox',
    reason: '올레길을 3번 완주한 경험이 있고, 7월에 마침 제주 방문 계획이 있습니다.',
    plan: '올레 1코스부터 5코스까지 이틀에 걸쳐 완주하며 매 코스마다 사진 30장 이상 촬영하겠습니다.',
    schedule: '7월 3일~4일 (2일)',
    desiredReward: 80000,
    appliedAt: '2026-06-19',
  },
  {
    id: 'a-002',
    questId: 'q-002',
    nickname: 'SunsetHiker',
    reason: '제주 올레 가이드 자격증이 있습니다. 생생한 현장감을 전달할 자신 있어요.',
    plan: '코스별 360도 영상과 함께 실시간 보이스 중계도 해드릴 수 있습니다.',
    schedule: '7월 5일~6일 (2일)',
    desiredReward: 75000,
    appliedAt: '2026-06-19',
  },
];

export function getQuestById(id: string): Quest | undefined {
  return QUESTS.find((q) => q.id === id);
}

export function getApplicantsByQuestId(questId: string): Applicant[] {
  return APPLICANTS.filter((a) => a.questId === questId);
}
