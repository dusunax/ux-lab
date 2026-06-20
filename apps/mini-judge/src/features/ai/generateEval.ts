import type { EvalResult, JudgeLevel, ParseResult, TeamInput } from '../../types'

const PROXY_URL = 'http://localhost:3035/api/chat'

const LEVEL_GUIDE: Record<JudgeLevel, string> = {
  junior:
    '주니어 심사위원 관점: 구현 경험 중심 질문. "어떻게 만들었나요?", "가장 어려웠던 부분은?", "이 기능을 구현할 때 어떤 방법을 선택했나요?" 수준.',
  mid: '미드 심사위원 관점: 구현 + 설계 판단 질문. "왜 이 구조를 선택했나요?", "다른 방법도 고려했나요?" 수준.',
  senior:
    '시니어 심사위원 관점: 설계 의도·트레이드오프 중심 질문. "이 아키텍처의 한계는?", "확장 시 어떤 문제가 생길 수 있나요?" 수준.',
}

function buildPrompt(team: TeamInput, parse: ParseResult, level: JudgeLevel): string {
  const context = [
    `팀/프로젝트명: ${team.title}`,
    team.description ? `팀 소개: ${team.description}` : '',
    parse.githubContent
      ? `GitHub README:\n${parse.githubContent.slice(0, 3000)}`
      : team.manualReadme
        ? `README (수동 입력):\n${team.manualReadme.slice(0, 3000)}`
        : '',
    parse.notionContent
      ? `Notion 페이지:\n${parse.notionContent.slice(0, 2000)}`
      : team.manualNotion
        ? `Notion (수동 입력):\n${team.manualNotion.slice(0, 2000)}`
        : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  return `당신은 부트캠프 수료 발표회의 미니 심사위원입니다.
피심사자는 취업을 희망하는 예비 개발자입니다. 목표는 평가가 아니라 이해 지원과 건설적 피드백입니다.

${LEVEL_GUIDE[level]}

아래 팀 정보를 바탕으로 평가 시트를 JSON으로 작성하세요.
질문은 반드시 이 팀의 프로젝트 내용을 기반으로 해야 합니다 (Generic 질문 금지).
질문 난이도: 예비 개발자가 자신이 만든 것을 설명하고 회고할 수 있는 수준.

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
  "questions": [
    {"type": "tech", "question": "기술 관련 질문 1 (이 프로젝트 고유 내용 포함)"},
    {"type": "tech", "question": "기술 관련 질문 2"},
    {"type": "tech", "question": "기술 관련 질문 3"},
    {"type": "general", "question": "포괄 질문 1 (어려웠던 점·배운 점 등)"},
    {"type": "general", "question": "포괄 질문 2"}
  ]
}`
}

export async function generateEval(
  team: TeamInput,
  parse: ParseResult,
  level: JudgeLevel,
): Promise<EvalResult> {
  const prompt = buildPrompt(team, parse, level)

  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'auto',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1200,
    }),
  })

  if (!res.ok) throw new Error(`AI API 오류 (${res.status})`)

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }

  const raw = data.choices?.[0]?.message?.content?.trim() ?? ''

  // strip possible code fences
  const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  const parsed = JSON.parse(jsonStr) as EvalResult
  return parsed
}
