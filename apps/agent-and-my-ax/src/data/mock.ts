import type { AgentCategory, AgentComment, AgentItem, PersonRank, TeamRank, UserProfile } from '@/types';

export const categoryLabels: Record<AgentCategory, string> = {
  productivity: '생산성',
  development: '개발',
  planning: '기획',
  analytics: '분석',
  communication: '커뮤니케이션',
};

export const categoryColors: Record<AgentCategory, string> = {
  productivity: '#0C7A59',
  development: '#2563EB',
  planning: '#7C3AED',
  analytics: '#0E7490',
  communication: '#BE185D',
};

export const visibilityLabels = {
  company: '전체 공개',
  team: '팀 공개',
  private: '비공개',
} as const;

export const users: UserProfile[] = [
  {
    id: 'dusun',
    name: '김두선',
    team: 'R&D',
    role: 'Frontend',
    avatarBg: '#E7E9FD',
    avatarFg: '#4F46E5',
    bio: '반복 업무를 줄이는 사내 Agent를 만들고 공유합니다.',
    badge: 'Top Creator',
  },
  {
    id: 'minjun',
    name: '박민준',
    team: 'Data',
    role: 'Platform',
    avatarBg: '#E3EFFE',
    avatarFg: '#2563EB',
    bio: '데이터 분석과 리포팅 자동화를 담당합니다.',
    badge: 'Most Used',
  },
  {
    id: 'seoyeon',
    name: '이서연',
    team: 'Product',
    role: 'PM',
    avatarBg: '#F0E9FE',
    avatarFg: '#7C3AED',
    bio: '기획 문서와 회의 후속 작업을 자동화합니다.',
    badge: 'Rising',
  },
  {
    id: 'haneul',
    name: '정하늘',
    team: 'CX',
    role: 'Service',
    avatarBg: '#FCE8F1',
    avatarFg: '#BE185D',
    bio: '고객 문의를 빠르게 정리하는 Agent를 실험합니다.',
  },
];

export const agents: AgentItem[] = [
  {
    id: 'meeting-to-jira',
    title: '회의록 → Jira Agent',
    description: '회의록을 붙여넣으면 결정 사항, 담당자, Jira 티켓 초안을 자동으로 정리합니다.',
    category: 'productivity',
    tags: ['회의록', 'Jira', 'Action Item'],
    platform: 'Claude',
    usageGuide: '회의록 원문을 그대로 붙여넣고, 결정 사항과 담당자가 드러나는 문장을 지우지 않는 것이 가장 좋습니다.',
    visibility: 'company',
    creatorId: 'dusun',
    runLabel: '회의록 붙여넣기',
    runPlaceholder: '오늘 회의 내용을 붙여넣으세요...',
    sampleInput: 'Sprint 킥오프에서 Feed, Detail, Run, Ranking을 Sprint 1 범위로 결정했다.',
    sampleOutput: 'Jira 초안 4개 생성: Home Feed 구현, Agent Detail 구현, Run Agent 구현, Ranking QA.',
    usage: ['회의록 원문을 입력한다', 'Run을 누른다', '생성된 Jira 초안을 복사해 티켓으로 등록한다'],
    history: ['v1.3: 담당자 추출 정확도 개선', 'v1.2: Jira 제목 템플릿 추가', 'v1.0: 사내 회의록 포맷 대응'],
    likes: 231,
    triedCount: 82,
    forkCount: 12,
    commentCount: 19,
    createdAt: '2026-06-02',
    updatedAt: '2026-06-26',
    badge: 'Official',
  },
  {
    id: 'prd-reviewer',
    title: 'PRD 리뷰 Agent',
    description: '목표, 범위, 수용 기준의 빈틈을 찾아 PM 리뷰 코멘트로 변환합니다.',
    category: 'planning',
    tags: ['PRD', 'PM', 'Review'],
    platform: 'ChatGPT',
    usageGuide: '목표, 포함 범위, 제외 범위, 수용 기준을 한 번에 넣으면 누락된 의사결정을 더 잘 찾습니다.',
    visibility: 'company',
    creatorId: 'seoyeon',
    runLabel: 'PRD 초안',
    runPlaceholder: '검토할 PRD 내용을 붙여넣으세요...',
    sampleInput: '사용자가 Agent를 등록하고 실행할 수 있는 커뮤니티를 만든다.',
    sampleOutput: '누락 위험: 인증 소스, 실행 URL 보안 정책, 랭킹 산식, Fork 관계 정의.',
    usage: ['PRD 초안을 입력한다', '누락된 의사결정을 확인한다', 'Open Question으로 옮긴다'],
    history: ['v0.9: Acceptance Criteria 체크 추가', 'v0.7: Open Question 분류 추가'],
    likes: 188,
    triedCount: 64,
    forkCount: 7,
    commentCount: 14,
    createdAt: '2026-06-08',
    updatedAt: '2026-06-24',
    badge: 'Rising',
  },
  {
    id: 'sql-explain',
    title: 'SQL Explain Agent',
    description: '복잡한 쿼리를 사람이 읽기 쉬운 단계별 설명과 성능 리스크로 바꿉니다.',
    category: 'development',
    tags: ['SQL', 'Explain', '성능'],
    platform: 'Gen.AI',
    usageGuide: '쿼리와 함께 테이블 목적, 예상 데이터 규모, 느린 구간을 같이 적으면 성능 리스크 설명이 정확해집니다.',
    visibility: 'team',
    creatorId: 'minjun',
    runLabel: 'SQL 쿼리',
    runPlaceholder: 'SELECT ...',
    sampleInput: 'SELECT team, count(*) FROM agents GROUP BY team ORDER BY count(*) DESC;',
    sampleOutput: '팀별 Agent 수를 집계하고 많은 순서로 정렬합니다. 인덱스보다 전체 집계 비용을 확인하세요.',
    usage: ['SQL을 입력한다', '비즈니스 의미와 성능 리스크를 확인한다'],
    history: ['v1.1: BigQuery 문법 힌트 추가', 'v1.0: PostgreSQL 쿼리 설명 지원'],
    likes: 164,
    triedCount: 71,
    forkCount: 5,
    commentCount: 11,
    createdAt: '2026-06-10',
    updatedAt: '2026-06-23',
  },
  {
    id: 'voc-cluster',
    title: 'VOC 클러스터 Agent',
    description: '고객 문의를 주제별로 묶고 긴급도와 담당팀 후보를 제안합니다.',
    category: 'analytics',
    tags: ['VOC', '분석', 'CS'],
    platform: 'Document.AI',
    usageGuide: '문의 내용을 줄 단위로 나누고, 날짜나 채널 정보가 있으면 함께 붙여넣으세요.',
    visibility: 'team',
    creatorId: 'haneul',
    runLabel: 'VOC 목록',
    runPlaceholder: '고객 문의를 줄 단위로 붙여넣으세요...',
    sampleInput: '로그인이 안 됩니다 / 결제 영수증을 받고 싶어요 / 비밀번호 초기화가 안 됩니다',
    sampleOutput: '계정 접근 2건, 결제 1건. 계정 접근 이슈는 R&D 확인 권장.',
    usage: ['VOC 목록을 입력한다', '클러스터와 담당팀 후보를 확인한다'],
    history: ['v0.8: 긴급도 라벨 추가', 'v0.5: 한국어 문의 클러스터링 지원'],
    likes: 121,
    triedCount: 54,
    forkCount: 4,
    commentCount: 8,
    createdAt: '2026-06-11',
    updatedAt: '2026-06-21',
    badge: 'Most Used',
  },
  {
    id: 'chat-summary',
    title: 'Google Chat 요약 Agent',
    description: '긴 스레드에서 합의 사항과 미답변 질문만 뽑아 공유 가능한 요약으로 만듭니다.',
    category: 'communication',
    tags: ['Chat', '요약', '공유'],
    platform: 'Agent Builder',
    usageGuide: '스레드 전체를 시간순으로 붙여넣으면 결정/미결정 항목을 더 안정적으로 구분합니다.',
    visibility: 'private',
    creatorId: 'dusun',
    runLabel: '채팅 스레드',
    runPlaceholder: '요약할 채팅 내용을 붙여넣으세요...',
    sampleInput: 'A: 배포는 목요일이 좋겠습니다. B: QA 결과를 먼저 봐야 합니다.',
    sampleOutput: '합의 전: QA 결과 확인 후 목요일 배포 여부 결정. 미답변: QA 완료 예정 시각.',
    usage: ['채팅 스레드를 입력한다', '결정/미결정 항목을 확인한다'],
    history: ['v0.6: 미답변 질문 추출 추가', 'v0.4: 요약 톤 개선'],
    likes: 97,
    triedCount: 43,
    forkCount: 6,
    commentCount: 5,
    createdAt: '2026-06-13',
    updatedAt: '2026-06-20',
  },
];

export const commentsByAgent: Record<string, AgentComment[]> = {
  'meeting-to-jira': [
    {
      id: 'c1',
      author: '이서연',
      team: 'Product / PM',
      content: '결정 사항과 액션 아이템이 분리돼서 바로 티켓화하기 좋습니다.',
      createdAt: '2일 전',
    },
    {
      id: 'c2',
      author: '최우진',
      team: 'R&D / Backend',
      content: 'Jira 라벨 추천까지 붙으면 더 자주 쓸 것 같아요.',
      createdAt: '어제',
    },
  ],
};

export const personRanks: PersonRank[] = [
  { id: 'dusun', name: '김두선', team: 'R&D / Frontend', agents: 8, likes: 532, tried: 281, badge: 'Top Creator' },
  { id: 'minjun', name: '박민준', team: 'Data / Platform', agents: 6, likes: 410, tried: 233, badge: 'Most Used' },
  { id: 'seoyeon', name: '이서연', team: 'Product / PM', agents: 5, likes: 388, tried: 190, badge: 'Rising' },
  { id: 'haneul', name: '정하늘', team: 'CX / Service', agents: 4, likes: 274, tried: 156 },
  { id: 'woojin', name: '최우진', team: 'R&D / Backend', agents: 5, likes: 261, tried: 201 },
];

export const teamRanks: TeamRank[] = [
  { name: 'R&D', members: 18, agents: 21, likes: 1240 },
  { name: 'Platform', members: 12, agents: 16, likes: 980 },
  { name: 'Product', members: 9, agents: 12, likes: 760 },
  { name: 'PM', members: 6, agents: 8, likes: 540 },
];

export function findAgent(id: string) {
  return agents.find((agent) => agent.id === id);
}

export function findUser(id: string) {
  return users.find((user) => user.id === id) ?? users[0];
}
