import type { EvalResult, ParseResult, TeamInput } from '../../types'

const PROXY_URL = 'http://localhost:3035/api/chat'

function buildPrompt(team: TeamInput, parse: ParseResult): string {
  const context = [
    `팀/프로젝트명: ${team.teamNumber ? `[${team.teamNumber}] ` : ''}${team.title}`,
    team.description ? `팀 소개: ${team.description}` : '',
    parse.githubContent
      ? `GitHub README:\n${parse.githubContent.slice(0, 3000)}`
      : team.manualReadme
        ? `README (수동 입력):\n${team.manualReadme.slice(0, 3000)}`
        : '',
    team.notionImage ? 'Notion 페이지 스크린샷이 첨부되어 있습니다. 이미지에서 프로젝트 내용을 파악하세요.' : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  return `당신은 부트캠프 수료 발표회의 미니 심사위원입니다.
피심사자는 취업을 희망하는 예비 개발자입니다. 목표는 평가가 아니라 이해 지원과 건설적 피드백입니다.

아래 팀 정보를 바탕으로 평가 시트를 JSON으로 작성하세요.
질문은 반드시 이 팀의 프로젝트 내용을 기반으로 해야 합니다 (Generic 질문 금지).
질문 난이도: 예비 개발자가 자신이 만든 것을 설명하고 회고할 수 있는 수준.

관점별 기준:
- junior: 구현 경험 중심. "어떻게 만들었나요?", "가장 어려웠던 부분은?" 수준
- mid: 구현 + 설계 판단. "왜 이 구조를 선택했나요?", "다른 방법도 고려했나요?" 수준
- senior: 트레이드오프 중심. "이 아키텍처의 한계는?", "확장 시 어떤 문제가 생길 수 있나요?" 수준

---
${context}
---

아래 JSON 형식으로만 응답하세요 (코드블록, 설명 없이):
{
  "projectSummary": "프로젝트를 2-3문장으로 요약",
  "techStack": ["기술1", "기술2", "기술3"],
  "checklist": [
    "완성도 체크 항목 1",
    "완성도 체크 항목 2",
    "완성도 체크 항목 3",
    "완성도 체크 항목 4",
    "완성도 체크 항목 5"
  ],
  "questions": {
    "junior": [
      {"type": "tech", "question": "이 프로젝트 고유 내용 포함한 구현 경험 질문"},
      {"type": "tech", "question": "구현 경험 질문 2"},
      {"type": "tech", "question": "구현 경험 질문 3"},
      {"type": "general", "question": "어려웠던 점·배운 점 질문"},
      {"type": "general", "question": "회고·성장 관련 질문"}
    ],
    "mid": [
      {"type": "tech", "question": "설계 판단 질문 1"},
      {"type": "tech", "question": "설계 판단 질문 2"},
      {"type": "tech", "question": "설계 판단 질문 3"},
      {"type": "general", "question": "협업·의사결정 질문"},
      {"type": "general", "question": "개선 방향 질문"}
    ],
    "senior": [
      {"type": "tech", "question": "트레이드오프 질문 1"},
      {"type": "tech", "question": "트레이드오프 질문 2"},
      {"type": "tech", "question": "확장성·한계 질문"},
      {"type": "general", "question": "아키텍처 의도 질문"},
      {"type": "general", "question": "다음 단계 설계 질문"}
    ]
  }
}`
}

export async function generateEval(
  team: TeamInput,
  parse: ParseResult,
): Promise<EvalResult> {
  const prompt = buildPrompt(team, parse)

  const messages = team.notionImage
    ? [{ role: 'user', content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: team.notionImage } },
      ]}]
    : [{ role: 'user', content: prompt }]

  let res: Response
  try {
    res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'auto',
        messages,
        max_tokens: 2500,
      }),
    })
  } catch {
    throw new Error(`openrouter-proxy에 연결할 수 없습니다 — 터미널에서 pnpm dev:openrouter 를 먼저 실행하세요 (${PROXY_URL})`)
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `AI API 오류 (${res.status})`)
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }

  const raw = data.choices?.[0]?.message?.content?.trim() ?? ''

  // strip possible code fences
  const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  const parsed = JSON.parse(jsonStr) as EvalResult
  return parsed
}
