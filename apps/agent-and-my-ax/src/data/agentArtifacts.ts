import type { AgentDownloadKind, AgentItem } from '@/types';

const downloadLabels: Record<AgentDownloadKind, string> = {
  cursor: 'Cursor',
  claude: 'Claude',
  codex: 'Codex',
  prompt: 'Prompt',
};

const visibilityLabels: Record<AgentItem['visibility'], string> = {
  company: '전체 공개',
  team: '팀 공개',
  private: '비공개',
};

export function createDownloads({
  id,
  title,
  platform,
  usageGuide,
  visibility,
  prompt,
}: {
  id: string;
  title: string;
  platform: AgentItem['platform'];
  usageGuide: string;
  visibility: AgentItem['visibility'];
  prompt: string;
}): AgentItem['downloads'] {
  const targetGuide: Record<AgentDownloadKind, string> = {
    cursor: '프로젝트의 .cursor/rules 디렉터리 또는 Cursor Chat 컨텍스트에 추가하고, 관련 코드/문서 파일을 함께 열어 실행하세요.',
    claude: 'Claude Project Instructions, Claude Code 지시문, 또는 프로젝트 CLAUDE.md에 추가하고 원본 입력을 마지막에 붙이세요.',
    codex: 'Codex 작업 지시, AGENTS.md, PR/이슈 작업 컨텍스트에 추가하고 수정 대상 파일이나 검증 명령을 함께 제공하세요.',
    prompt: 'ChatGPT, Claude, Gen.AI 등 일반 채팅 입력창에 그대로 붙여넣고 원본 입력을 이어서 넣으세요.',
  };

  const base = [
    `# ${title}`,
    '',
    `Platform: ${platform}`,
    `Visibility: ${visibilityLabels[visibility]}`,
    '',
    '## Usage Guide',
    usageGuide,
    '',
    '## Prompt',
    prompt,
  ].join('\n');

  return (['cursor', 'claude', 'codex', 'prompt'] as AgentDownloadKind[]).map((kind) => ({
    kind,
    label: downloadLabels[kind],
    filename: `${id}.${kind}.md`,
    content: [base, '', '## Target Usage', targetGuide[kind]].join('\n'),
  }));
}

export function createResultPreset(agentId: string, agentTitle: string, creatorName: string): AgentItem['resultPreset'] {
  if (agentId === 'meeting-to-jira') {
    return {
      resultTitle: '작업 초안',
      primaryActionLabel: '업무 도구로 보내기',
      artifacts: [
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
      ],
    };
  }

  const presets: Record<string, AgentItem['resultPreset']> = {
    'prd-reviewer': {
      resultTitle: '리뷰 코멘트',
      primaryActionLabel: '리뷰 문서로 내보내기',
      artifacts: [
        {
          title: '인증 소스 결정 누락',
          kind: 'finding',
          badge: 'OQ',
          description: '실명제 서비스라면 SSO, Workspace, 수동 프로필 중 기준 계정 소스를 먼저 결정해야 합니다.',
          meta: [{ label: '영향', value: 'High' }, { label: '담당', value: 'PM/BE' }],
        },
        {
          title: 'Run 실행 경로 보안 정책 필요',
          kind: 'finding',
          badge: 'Risk',
          description: '외부 Agent URL을 iframe, 새 탭, API proxy 중 무엇으로 열지 정책화해야 합니다.',
          meta: [{ label: '영향', value: 'High' }, { label: '검토', value: 'Security' }],
        },
        {
          title: 'Acceptance Criteria 보강',
          kind: 'recommendation',
          badge: 'Next',
          description: 'Feed, Detail, Run, Ranking별 성공 기준을 사용자 행동 단위로 분리하세요.',
          meta: [{ label: '우선순위', value: 'P0' }, { label: '형식', value: 'Checklist' }],
        },
      ],
    },
    'sql-explain': {
      resultTitle: '쿼리 설명',
      primaryActionLabel: '분석 노트로 내보내기',
      artifacts: [
        {
          title: '집계 기준',
          kind: 'summary',
          badge: 'Logic',
          description: 'team 컬럼으로 그룹화한 뒤 각 그룹의 Agent 수를 계산합니다.',
          meta: [{ label: '절', value: 'GROUP BY' }, { label: '출력', value: 'team/count' }],
        },
        {
          title: '정렬 비용 확인',
          kind: 'finding',
          badge: 'Perf',
          description: '집계 결과를 count 기준으로 정렬하므로 데이터 규모가 커지면 sort 비용을 확인해야 합니다.',
          meta: [{ label: '위험', value: 'Medium' }, { label: '검토', value: 'EXPLAIN' }],
        },
        {
          title: '대시보드용 별칭 추천',
          kind: 'recommendation',
          badge: 'Tip',
          description: 'count(*)에 agent_count 별칭을 붙이면 리포트와 BI 도구에서 의미가 명확해집니다.',
          meta: [{ label: '수정', value: 'Alias' }, { label: '난이도', value: 'Low' }],
        },
      ],
    },
    'voc-cluster': {
      resultTitle: 'VOC 클러스터',
      primaryActionLabel: 'CS 리포트로 내보내기',
      artifacts: [
        {
          title: '계정 접근 이슈',
          kind: 'summary',
          badge: '2건',
          description: '로그인 실패와 비밀번호 초기화 실패가 같은 계정 접근 문제로 묶입니다.',
          meta: [{ label: '긴급도', value: '높음' }, { label: '담당', value: 'R&D' }],
        },
        {
          title: '결제 영수증 요청',
          kind: 'summary',
          badge: '1건',
          description: '영수증 발급 경로 안내 또는 자동 발송 상태 확인이 필요합니다.',
          meta: [{ label: '긴급도', value: '보통' }, { label: '담당', value: 'CX' }],
        },
        {
          title: '추가 확인 질문',
          kind: 'recommendation',
          badge: 'Next',
          description: '계정 이슈는 발생 시간, 브라우저, 오류 문구를 함께 수집하면 재현성이 높아집니다.',
          meta: [{ label: '채널', value: 'Support' }, { label: '시점', value: '즉시' }],
        },
      ],
    },
    'chat-summary': {
      resultTitle: '스레드 요약',
      primaryActionLabel: '공유 메시지로 내보내기',
      artifacts: [
        {
          title: '합의된 내용',
          kind: 'summary',
          badge: 'Done',
          description: '배포 후보일은 목요일이며, 최종 확정은 QA 결과 확인 이후로 정리됩니다.',
          meta: [{ label: '상태', value: '조건부 합의' }, { label: '공유', value: '가능' }],
        },
        {
          title: '미답변 질문',
          kind: 'finding',
          badge: 'Open',
          description: 'QA 완료 예정 시각과 배포 승인자가 아직 명확하지 않습니다.',
          meta: [{ label: '필요', value: '답변' }, { label: '담당', value: 'QA/PM' }],
        },
        {
          title: '공유용 문장',
          kind: 'recommendation',
          badge: 'Copy',
          description: 'QA 결과 확인 후 목요일 배포 여부를 확정합니다. QA 완료 시간과 승인자를 업데이트해주세요.',
          meta: [{ label: '톤', value: '간결' }, { label: '채널', value: 'Chat' }],
        },
      ],
    },
  };

  return presets[agentId] ?? {
    resultTitle: '실행 결과',
    primaryActionLabel: '결과 내보내기',
    artifacts: [
      {
        title: `${agentTitle} 핵심 결과`,
        kind: 'summary',
        badge: '요약',
        description: '입력에서 가장 중요한 결론과 판단 근거를 먼저 보여줍니다.',
        meta: [{ label: '작성', value: creatorName }, { label: '형식', value: 'Summary' }],
      },
    ],
  };
}
