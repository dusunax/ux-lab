---
description: 스프린트 평가. Nolan(EV)이 운영/마케팅/비즈니스 관점에서 PR diff를 분석하고 코멘트를 작성한다.
---

# /sprint:eval 하네스

**인수:** $ARGUMENTS

**평가자:** Nolan (EV) — `product/EV/sprint-evaluator`
**사양 문서:** `docs/workflow/sprint-git-workflow.md`

---

## Step 0 — 인수 파싱

| 패턴 | 동작 |
|------|------|
| (없음) | 현재 브랜치 또는 최신 kickoff에서 APP·N 추론 |
| `--app APP` | 지정 앱 사용 |
| `--sprint N` | 지정 N 사용 |
| `--pr NUMBER` | 지정 PR 번호 사용 |
| `--focus ops\|marketing\|business\|all` | 평가 관점 한정 (기본: all) |

---

## Step 1 — 컨텍스트 수집

`.agent/skills/SPRINT-CONTEXT.md`를 읽고 그 절차를 따라 **APP·N**과 킥오프 파일(`docs/meetings/{APP}/`)을 확정한다.

```bash
git diff main...sprint/{APP}/{N} --stat
git log --oneline sprint/{APP}/{N} ^main
```

수집 항목:
- 변경 파일 목록 및 diff 요약
- 앱 / 스프린트 번호 / 목표 (kickoff 파일, 있으면)
- 완료 항목 / 이월 항목 (kickoff 파일, 있으면)
- 주요 결정 사항 (kickoff 파일, 있으면)
- GA4 / 피드백 데이터 (미연결 시 "데이터 미수집"으로 명시)

> kickoff 파일이 없거나 관련 없으면 PR diff만으로 평가한다. 추정하지 않는다.

---

## Step 2 — Nolan(EV) 소환

소환 직전 `echo 'EV' > .claude/.active-role`로 활성 역할을 기록하고, 소환 완료 직후 `rm -f .claude/.active-role`로 정리한다. (EV는 읽기 전용 — 평가 결과는 PR 코멘트로만 남긴다.)

`product/EV/sprint-evaluator` 에이전트를 소환한다.

전달 프롬프트:
```
Sprint [APP]/[N] PR을 평가해줘.

[컨텍스트: PR diff 요약]
[컨텍스트: 완료/이월 항목, 있으면]
[컨텍스트: 주요 결정 사항, 있으면]
[컨텍스트: GA4/피드백 데이터, 있으면]
평가 관점: [--focus 값]

에이전트 파일의 출력 형식을 그대로 따를 것.
```

---

## Step 3 — PR 코멘트 등록

Nolan의 평가 결과를 PR에 코멘트로 등록한다.

- GitHub MCP(`mcp__github__add_issue_comment`) 우선 시도
- 미연결 시: `gh pr comment [NUMBER] --body "..."` 로 폴백
- 둘 다 불가 시: 터미널에 출력하고 수동 등록 안내

---

## Step 3.2 — Lessons Learned Discussion 추가

PR 코멘트 등록 후, **Blocker 또는 Major** RF 항목이 하나라도 있으면 재발 방지 코멘트를 Discussion에 추가한다.

**대상 Discussion:** https://github.com/dusunax/ux-lab/discussions/42  
**Discussion ID:** `D_kwDOP7cpz84AnajL`

각 Blocker/Major RF 항목을 아래 형식으로 코멘트에 추가한다:

```
## [날짜] [앱/모듈] {RF 제목}

**원인**
{TOCTOU, 누락된 검증, 타입 혼재 등 — 구체적으로}

**대책**
{코드 수준 해결책 — 스니펫 포함 권장}

**규칙**
{동일 패턴 재발을 막을 한 줄 원칙}

**관련 PR:** {repo}#{PR_NUMBER} ({RF 등급})
```

**추가 방법:**

```bash
gh api graphql -f query='
mutation {
  addDiscussionComment(input: {
    discussionId: "D_kwDOP7cpz84AnajL"
    body: "[코멘트 본문]"
  }) {
    comment { url }
  }
}'
```

- Minor RF는 추가하지 않는다.
- 이미 같은 내용이 Discussion에 있으면 중복 추가하지 않는다.

---

## Step 3.5 — 라벨 자동 업데이트

PR 코멘트 등록 후 Review Findings 결과에 따라 라벨을 교체한다.

**제거:**
- `eval: pending`

**추가 — findings 등급 (심각도 표시, 평가 후 영구 유지):**

| 등급 | 의미 | 조건 | 라벨 |
|------|------|------|------|
| 🔴 critical | 치명적 결함 | Blocker 항목 존재 | `eval: done` + `findings: critical` |
| 🟡 major | 주요 개선사항 | Major만 존재 | `eval: done` + `findings: major` |
| 🟢 minor | 경미한 개선사항 (통과 가능) | Minor 이하 / 지적 없음 | `eval: done` + `findings: minor` |

**⚠️ 중요:** 
- `findings:` 라벨은 평가 이력을 기록하며 영구 유지
- `eval: done` = 머지 기준 (이 라벨이 있으면 머지 가능)

**라벨 업데이트 방법 (우선순위):**

- `mcp__github__update_pull_request` (labels 파라미터) 우선 시도
- 미연결 시: `gh pr edit [NUMBER] --remove-label "eval: pending" --add-label "eval: done,findings: [등급]" --repo [REPO]`

> `findings: critical` → `findings: major` → `findings: minor` 는 상호 배타적이다. 이전 findings 라벨이 있으면 먼저 제거 후 새 라벨 부착.

---

## Step 4 — 완료 보고

```
📊 Sprint {APP}/{N} 평가 완료

평가자:   Nolan (EV)
PR:       [URL]
관점:     [ops / marketing / business / all]
코멘트:   [URL]
라벨:     eval: done + findings: [critical | major | minor]
재발방지: https://github.com/dusunax/ux-lab/discussions/42  (Blocker/Major RF가 있을 때만)
```
