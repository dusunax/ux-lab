---
description: 스프린트 완료 후 PR을 생성하고 결과를 요약한다. 보고서 HTML 링크를 본문에 첨부. PM(Jordan)이 /sprint:report 이후 실행.
---

# /sprint:review 하네스

**인수:** $ARGUMENTS

**사양 문서:** `docs/process/sprint-git-workflow.md`

---

## Step 0 — 인수 파싱

`$ARGUMENTS`에서 추출:

| 패턴 | 동작 |
|------|------|
| (없음) | 현재 브랜치 또는 최신 kickoff 파일에서 N 자동 추론 |
| `--sprint N` | 지정 N 사용 |
| `--report-url URL` | 보고서 공개 URL 첨부 |
| `--draft` | Draft PR로 생성 |

---

## Step 1 — 스프린트 N 탐지

```bash
git branch --show-current
```

- 현재 브랜치가 `sprint/N` 패턴이면 N 추출.
- 아니면 `docs/meetings/`에서 가장 최신 `*-sprint-N-kickoff.md` 파일로 N 추론.

```bash
ls docs/meetings/ | sort | grep -E 'sprint-[0-9]+-kickoff' | tail -1
```

N을 확정하지 못하면:

```
⛔ 스프린트 번호를 확인할 수 없습니다.
   현재 브랜치: [브랜치명]
   --sprint N 인수를 사용하거나, sprint/N 브랜치로 전환 후 재실행하세요.
```

**여기서 커맨드를 종료한다.**

---

## Step 2 — 킥오프 파일 읽기

아래 우선순위로 파일을 찾는다:

1. `docs/meetings/*-sprint-N-kickoff.md`
2. `docs/meetings/*-sprint-N.md` (레거시)

파일에서 추출:

| 추출 항목 | 소스 |
|-----------|------|
| 스프린트 목표 | `## Sprint N 목표` |
| 완료 항목 | `[x]` 체크박스 전체 |
| 미완료/이월 항목 | `[ ]` 체크박스 전체 |
| 주요 결정 사항 | `## 결정 사항 요약` 테이블 |

완료율 계산:
```
완료율 = 완료 항목 수 / 전체 항목 수 × 100
```

---

## Step 3 — 보고서 경로 탐지

`--report-url`이 없으면 로컬 파일을 탐색한다:

```bash
ls docs/presentations/sprint-N-report-*.html 2>/dev/null | head -1
```

- 파일이 있으면 상대 경로를 PR 본문에 첨부.
- 없으면 `(보고서 미생성 — /sprint:report 실행 후 --report-url로 첨부하세요)` 표시 후 계속.

---

## Step 4 — 원격 브랜치 확인

```bash
git remote get-url origin
git ls-remote --heads origin sprint/N
```

- 원격에 `sprint/N`이 없으면:

```
⚠️ sprint/N 브랜치가 원격에 없습니다.
   아래 명령으로 먼저 push하세요:

   git push -u origin sprint/N

   push 완료 후 /sprint:review를 다시 실행하세요.
```

**여기서 커맨드를 종료한다.**

---

## Step 5 — PR 생성 (GitHub MCP)

`mcp__github__create_pull_request`를 호출한다.

**PR 제목:** `Sprint N — [목표 한 줄 요약]`

**PR 본문:**

```markdown
## Sprint N — [목표]

> [목표 한 줄 요약]

**완료율:** M/T개 ([완료율]%)

---

### ✅ 완료 항목

- [x] 항목 1
- [x] 항목 2

### ⏭️ 이월 항목

- [ ] 항목 (미완료)

_(이월 항목 없으면 이 섹션 생략)_

### 📋 주요 결정 사항

| 번호 | 결정 내용 |
|------|-----------|
| 1 | ... |

_(결정 사항 테이블 없으면 이 섹션 생략)_

### 📊 보고서

[보고서 링크 또는 로컬 경로 — 없으면 "(보고서 미생성)"]

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

**호출 파라미터:**

| 파라미터 | 값 |
|----------|----|
| `head` | `sprint/N` |
| `base` | `main` |
| `title` | `Sprint N — [목표]` |
| `body` | 위 본문 |
| `draft` | `--draft` 플래그 여부 |

**GitHub MCP 미연결 시:**

```
⚠️ GitHub MCP가 연결되어 있지 않습니다.
   아래 PR 본문을 복사해서 수동으로 PR을 생성하세요.

[PR 본문 출력]
```

---

## Step 6 — 완료 보고

```
🔀 Sprint N PR 생성 완료

PR:         [URL]
브랜치:     sprint/N → main
완료율:     M/T개 ([완료율]%)
보고서:     [URL 또는 로컬 경로]
```
