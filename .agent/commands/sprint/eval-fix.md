---
description: eval 지적 사항 처리 결과를 PR에 댓글로 등록한다. Sprint 6 형식 유지.
---

# /sprint:eval-fix 하네스

**인수:** $ARGUMENTS

---

## Step 0 — 인수 파싱

| 패턴 | 동작 |
|------|------|
| (없음) | 현재 브랜치에서 PR 번호 자동 탐지 |
| `--pr NUMBER` | 지정 PR 번호 사용 |

---

## Step 1 — PR 번호 탐지

인수 없으면:

```bash
git branch --show-current  # sprint/N 패턴에서 N 추출
gh pr list --repo [REPO] --head sprint/N --json number --jq '.[0].number'
```

PR 번호를 확정하지 못하면:

```
⛔ PR 번호를 확인할 수 없습니다.
   --pr NUMBER 인수를 사용하거나 sprint/N 브랜치로 전환 후 재실행하세요.
```

---

## Step 2 — eval 댓글 읽기

```bash
gh pr view [NUMBER] --repo [REPO] --comments --json comments
```

eval 댓글(`🏁 Sprint N 평가 — Nolan (EV)`)을 찾아 **Review Findings 테이블**을 추출한다.

각 항목의 등급(🔴 Blocker / 🟡 Major / 🟢 Minor)과 항목명을 목록화한다.

---

## Step 3 — 처리 결과 수집

각 finding 항목에 대해:

1. **처리 완료** — 관련 커밋 SHA 또는 파일명 확인
2. **미처리 (의도된 한계)** — 사유 명시
3. **미처리 (이월)** — 이월 스프린트 명시

최근 커밋 이력을 참고한다:

```bash
git log --oneline -10
```

---

## Step 4 — 댓글 본문 작성

아래 형식을 **반드시** 그대로 유지한다 (Sprint 6 표준):

```markdown
## 🔧 Review Findings — 처리 결과

---

### [등급아이콘] [항목명]: [✅ 완료 | ❌ 미처리]

[처리 내용 또는 사유. 완료 시 커밋 SHA 포함.]

### [등급아이콘] [항목명]: [✅ 완료 | ❌ 미처리]

**사유:** [미처리 사유 — 의도된 한계 / 이월 스프린트]

---

*🤖 /sprint:eval 후속 조치 — [오늘날짜]*
```

**규칙:**

- 각 finding 항목을 `### [등급아이콘] [항목명]: ✅/❌` 형식의 H3으로 작성
- 완료 항목: 무엇을 어떻게 했는지 + 커밋 SHA (있으면)
- 미처리 항목: `**사유:**` 라벨로 명확히 구분
- 등급 순서: 🔴 → 🟡 → 🟢
- 에이전트 실명(Jordan, Blake 등)은 역할명(PM, BE 등)으로 대체
- 마지막 줄: `*🤖 /sprint:eval 후속 조치 — YYYY-MM-DD*`

---

## Step 5 — 댓글 등록

```bash
gh pr comment [NUMBER] --repo [REPO] --body "[본문]"
```

GitHub MCP(`mcp__github__add_issue_comment`) 우선 시도, 미연결 시 `gh` CLI 폴백.

---

## Step 6 — 라벨 업데이트

처리 결과에 따라 라벨을 교체한다.

**모든 finding이 처리 완료된 경우:**
- `finding: major` / `finding: blocker` 제거
- `finding: clear` + `ready to merge` 추가

**미처리(이월) 항목이 남은 경우:**
- 라벨 변경 없음. 댓글에 이월 항목 명시로 대신함.

```bash
gh api repos/[REPO]/issues/[NUMBER]/labels --method DELETE ...
gh api repos/[REPO]/issues/[NUMBER]/labels --method POST ...
```

---

## Step 7 — 완료 보고

```
✅ eval 처리 결과 댓글 등록 완료

PR:       [URL]
댓글:     [댓글 URL]
처리:     [완료 N건 / 미처리 N건]
라벨:     [변경 내용 또는 "변경 없음"]
```
