---
description: 스프린트 현재 상태를 docs(PPT·MD)·git·PR에 한 번에 동기화한다. QA 완료, 결정 확정 등 중간 업데이트 시 사용.
---

# /sprint:sync 하네스

**인수:** $ARGUMENTS

---

## Step 0 — 인수 파싱

| 패턴 | 동작 |
|------|------|
| (없음) | 현재 브랜치에서 N 자동 추론, 미확정 변경 모두 커밋 |
| `--sprint N` | 지정 N 사용 |
| `--pr NUMBER` | PR 번호 직접 지정 (자동 탐지 생략) |
| `--message "msg"` | 커밋 메시지 오버라이드 |
| `--dry-run` | 커밋·push·PR 업데이트 없이 실행 계획만 출력 |

---

## Step 1 — 스프린트 N 탐지

```bash
git branch --show-current
```

브랜치가 `sprint/N` 패턴이면 N 추출.
아니면 `docs/meetings/`에서 가장 최신 `*-sprint-N-kickoff.md`로 N 추론.

N 확정 실패 시:

```
⛔ 스프린트 번호를 확인할 수 없습니다.
   --sprint N 인수를 사용하거나 sprint/N 브랜치에서 재실행하세요.
```

**커맨드를 종료한다.**

---

## Step 2 — 변경 파일 수집

```bash
git status --short
```

커밋 대상: `docs/` 하위 변경 파일 (PPT HTML, MD, 스크린샷 등).
`apps/`, `api/`, `src/` 등 **코드 파일이 섞여 있으면 커밋에서 제외**하고 사용자에게 알린다.

변경 파일이 없으면 커밋 단계를 건너뛰고 push·PR 동기화만 수행한다.

---

## Step 3 — 킥오프 파일 읽기

```bash
ls docs/meetings/ | sort | grep -E "sprint-N" | tail -1
```

추출 항목:
- 완료 항목 (`[x]`), 미완료 항목 (`[ ]`)
- 주요 결정 사항 테이블

완료율 = `완료 수 / 전체 수 × 100` (소수점 버림)

킥오프 파일이 없으면 git log로 대체하고 "킥오프 파일 미발견 — git log 기반 추정"을 명시한다.

---

## Step 4 — 커밋 (변경 있을 때만)

기본 커밋 메시지:

```
docs(sprint/N): 스프린트 문서 동기화 — PPT·QA·결정 사항 반영
```

`--message`가 있으면 해당 메시지 사용.

```bash
git add docs/
git commit -m "<메시지>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

`--dry-run`이면 커밋하지 않고 메시지·대상 파일만 출력한다.

---

## Step 5 — Push

```bash
git push origin sprint/N
# 원격 브랜치가 없으면:
git push -u origin sprint/N
```

`--dry-run`이면 `git push --dry-run origin sprint/N` 으로 대체한다.

---

## Step 6 — PR 탐지 및 본문 동기화

### 6-1. PR 탐지

`--pr NUMBER`가 있으면 사용.
없으면:

```bash
gh pr list --head sprint/N --json number,title,url,state
```

PR이 없으면:

```
⚠️ sprint/N PR이 존재하지 않습니다. /sprint:review 를 먼저 실행해 PR을 생성하세요.
```

Step 7로 이동한다.

### 6-2. PR 본문 재구성

Step 3 데이터로 PR 본문을 재구성한다.

```markdown
## Sprint N — {목표 한 줄}

> **{목표 전문}**

**완료율:** {완료}/{전체}개 ({완료율}%)

---

### 📋 주요 결정 사항

{결정 사항 테이블 — 없으면 섹션 생략}

### 📊 보고서

{docs/presentations/sprint-N-report-*.html 경로 — 없으면 "보고서 미생성"}

---

### ✅ 완료 항목

<details>
<summary>완료율: {완료}/{전체}개 ({완료율}%)</summary>

{[x] 항목 목록, 담당자 그룹 유지}

</details>

### ⏭️ 이월 항목

{[ ] 항목 목록 — 없으면 "이월 항목 없음 🎉"}

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### 6-3. PR 업데이트

> ⚠️ `gh pr edit` 는 Projects classic 경고로 exit code 1을 반환한다. 항상 **GitHub REST API**를 사용한다.

```bash
OWNER_REPO=$(git remote get-url origin | sed 's/.*github.com[:/]//' | sed 's/\.git$//')

gh api \
  --method PATCH \
  -H "Accept: application/vnd.github+json" \
  /repos/$OWNER_REPO/pulls/$PR_NUMBER \
  --field body="$NEW_BODY" \
  --jq '.number,.title,.state'
```

`--dry-run`이면 API 호출 대신 재구성된 본문을 stdout에 출력한다.

---

## Step 7 — 완료 보고

```
🔄 Sprint N 동기화 완료

커밋:     {해시} — {메시지}  (변경 없으면 "커밋 없음")
Push:     origin/sprint/N
PR:       #{NUMBER} 본문 갱신 — 완료율 {완료율}%
보고서:   {HTML 경로 또는 "미생성"}

이월:     {이월 항목 수}건
```

---

## 주의사항

- `apps/`, `api/` 등 코드 파일을 docs 커밋에 포함하지 않는다.
- `gh pr edit` 대신 `gh api PATCH` 를 항상 사용한다.
- `--dry-run`에서는 파일시스템·git·GitHub 어느 것도 변경하지 않는다.
