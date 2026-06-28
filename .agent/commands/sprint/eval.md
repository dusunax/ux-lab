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
| (없음) | 현재 브랜치 또는 최신 kickoff에서 N 추론 |
| `--sprint N` | 지정 N 사용 |
| `--pr NUMBER` | 지정 PR 번호 사용 |
| `--focus ops\|marketing\|business\|all` | 평가 관점 한정 (기본: all) |

---

## Step 1 — 컨텍스트 수집

```bash
git diff main...sprint/N --stat
git log --oneline sprint/N ^main
```

수집 항목:
- 변경 파일 목록 및 diff 요약
- 스프린트 번호 / 목표 (kickoff 파일, 있으면)
- 완료 항목 / 이월 항목 (kickoff 파일, 있으면)
- 주요 결정 사항 (kickoff 파일, 있으면)
- GA4 / 피드백 데이터 (미연결 시 "데이터 미수집"으로 명시)

> kickoff 파일이 없거나 관련 없으면 PR diff만으로 평가한다. 추정하지 않는다.

---

## Step 2 — Nolan(EV) 소환

`product/EV/sprint-evaluator` 에이전트를 소환한다.

전달 프롬프트:
```
Sprint [N] PR을 평가해줘.

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

**추가 — finding 등급 (Nolan 평가 결과 기준):**

| 조건 | 추가 라벨 |
|------|-----------|
| 🔴 Blocker 항목 존재 | `eval: done` + `finding: blocker` |
| 🟡 Major만 존재 (Blocker 없음) | `eval: done` + `finding: major` |
| 🟢 Minor 이하만 / 지적 없음 | `eval: done` + `finding: clear` + `ready to merge` |

**라벨 업데이트 방법 (우선순위):**

- `mcp__github__update_pull_request` (labels 파라미터) 우선 시도
- 미연결 시: `gh pr edit [NUMBER] --remove-label "eval: pending" --add-label "eval: done,finding: [등급]" --repo [REPO]`

> `finding: blocker` → `finding: major` → `finding: clear` 는 상호 배타적이다. 이전 finding 라벨이 있으면 먼저 제거 후 새 라벨 부착.

---

## Step 4 — 완료 보고

```
📊 Sprint N 평가 완료

평가자:   Nolan (EV)
PR:       [URL]
관점:     [ops / marketing / business / all]
코멘트:   [URL]
라벨:     eval: done + finding: [blocker | major | clear]
재발방지: https://github.com/dusunax/ux-lab/discussions/42  (Blocker/Major RF가 있을 때만)
```
