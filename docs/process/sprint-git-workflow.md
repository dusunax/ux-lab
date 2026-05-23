# 수산시장 스프린트 Git 워크플로우

**확정일:** 2026-05-23
**작성:** TS (Alex)
**근거 회의:** PM Jordan 컨설팅 (2026-05-23)
**관련 문서:** `docs/process/sprint-process.md`

---

## 개요

이 문서는 스프린트 단위 Git 브랜치 전략과 PR 기반 병합 절차를 정의한다.
`sprint-process.md`의 7대 운영 규칙을 기술 실행 레벨에서 보완한다.

---

## 브랜치 전략

### 브랜치 명명 규칙

| 구분 | 패턴 | 예시 |
|------|------|------|
| 스프린트 작업 브랜치 | `sprint/N` | `sprint/7` |
| 기본 브랜치 | `main` | — |

### 생명주기

```
main
  └─ sprint/N  ← /sprint:start 실행 시 자동 생성
       │
       │  (스프린트 기간 동안 커밋 누적)
       │
       └─ PR (sprint/N → main)  ← /sprint:review 실행 시 자동 생성
            │
            └─ 병합 완료 후 sprint/N 브랜치 삭제 (수동)
```

### 규칙

1. 스프린트 작업 커밋은 **전량 `sprint/N` 브랜치에서 진행**한다.
2. `main`에 직접 커밋하지 않는다.
3. 브랜치는 `/sprint:start` 가 자동 생성한다 — 수동 생성 불필요.
4. PR 병합 후 `sprint/N` 브랜치는 수동으로 삭제한다.

---

## 커맨드 연계

### `/sprint:start`

> 상세 사양: `.claude/commands/sprint/start.md`

- 이전 스프린트 완료 게이트(90% 룰) 통과 후 **자동으로 `sprint/N` 브랜치를 생성**하고 체크아웃한다.
- Jordan(PM)의 스프린트 플랜 작성, Alex(TS)의 킥오프 MD 생성까지 일괄 처리한다.

```
실행 흐름:
  게이트 통과
    → git checkout -b sprint/N
    → Jordan: 스프린트 플랜 작성
    → Alex: kickoff MD 생성 + README 업데이트
```

### `/sprint:review`

> 상세 사양: `.claude/commands/sprint/review.md`

- 스프린트 완료(90% 룰) 후 PM이 실행한다.
- `sprint/N → main` PR을 생성하고 본문에 스프린트 결과를 자동 요약한다.

**인수:**

| 인수 | 동작 |
|------|------|
| (없음) | 현재 브랜치 또는 최신 kickoff 파일에서 N 추론 |
| `--sprint N` | 지정 N 사용 |
| `--report-url URL` | 보고서 공개 URL 첨부 (없으면 로컬 경로로 대체) |
| `--draft` | Draft PR로 생성 |

**PR 본문 구성:**

```markdown
## Sprint N — [목표]
> [목표 한 줄 요약]

### ✅ 완료 항목
### ⏭️ 이월 항목
### 📋 주요 결정 사항
### 📊 보고서
```

**오류 처리:**
- `sprint/N`이 원격에 없으면: push 안내 메시지 출력 후 중단
- GitHub MCP 미연결: PR 본문을 터미널에 출력하고 수동 생성 안내

### `/sprint:eval` (Sprint 7+ 예정)

> 전제 조건 미충족으로 이연. 현재는 `/sprint:review` 사용.

- **전제 조건:** GA4 데이터 연동, 사용자 피드백 데이터
- **예정 기능:** 운영/마케팅/비즈니스 관점 스프린트 평가 + PR 코멘트 작성

---

## 스프린트 전체 흐름 (통합)

```
/sprint:start
  ├─ 게이트: 이전 스프린트 90% 완료 확인
  ├─ git checkout -b sprint/N
  ├─ Jordan: 스프린트 플랜 작성
  └─ Alex: kickoff MD 생성

  [스프린트 진행 — 커밋은 sprint/N 브랜치에]

/sprint:report        ← PM이 실행, 보고서 HTML 생성
/sprint:review        ← PM이 실행, PR 생성 및 스프린트 결과 요약
  ├─ kickoff MD에서 완료/미완료/결정 사항 추출
  ├─ 보고서 경로 탐지 또는 --report-url 사용
  └─ mcp__github__create_pull_request 호출

  [PR 리뷰 및 병합 — main]

/sprint:start (다음 스프린트)
```

---

## 파일 경로 요약

| 구분 | 경로 |
|------|------|
| 스프린트 커맨드 | `.claude/commands/sprint/` |
| 킥오프 회의록 | `docs/meetings/YYYY-MM-DD-sprint-N-kickoff.md` |
| 보고서 HTML | `docs/presentations/sprint-N-report-YYMMDD.html` |
| 운영 규칙 원문 | `docs/process/sprint-process.md` |
| Git 워크플로우 (이 문서) | `docs/process/sprint-git-workflow.md` |

---

*이 문서는 스프린트 Git 워크플로우 추가 시 신규 작성됐다. 규칙 변경 시 관련 커맨드 파일과 함께 업데이트한다.*
