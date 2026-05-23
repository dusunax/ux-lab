# PR 템플릿

**작성:** TS (Alex)
**확정일:** 2026-05-23
**사용처:** `/sprint:review` 커맨드

이 문서는 스프린트 리뷰 PR의 제목과 본문 구조를 정의한다.
플레이스홀더는 `{{VAR}}` 형식이며, `/sprint:review` 실행 시 킥오프 파일과 git 정보로 채워진다.

---

## PR 제목

```
Sprint {{N}} — {{GOAL_ONE_LINE}}
```

---

## PR 본문

```markdown
## Sprint {{N}} — {{GOAL_ONE_LINE}}

> **{{GOAL_FULL}}**

**완료율:** {{DONE_COUNT}}/{{TOTAL_COUNT}}개 ({{COMPLETION_RATE}}%)

---

### 📋 주요 결정 사항

{{DECISIONS_TABLE}}

_(결정 사항 테이블이 없으면 이 섹션 생략)_

---

### ⏭️ 이월 항목

{{ROLLOVER_ITEMS}}

_(이월 항목 없으면 "없음 (Sprint {{N}} {{COMPLETION_RATE}}% 완료)"으로 대체)_

### ✅ 완료 항목

{{COMPLETED_ITEMS}}

### 📊 보고서

{{REPORT_LINK}}

_(보고서 미생성 시: "보고서 미생성 — `/sprint:report` 실행 후 `--report-url`로 첨부 예정")_

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## 플레이스홀더 정의

| 플레이스홀더 | 소스 | 비고 |
|-------------|------|------|
| `{{N}}` | 스프린트 번호 | Step 1에서 탐지 |
| `{{GOAL_ONE_LINE}}` | `## Sprint N 목표` 첫 줄 | `>` 마커 제거 후 사용 |
| `{{GOAL_FULL}}` | `## Sprint N 목표` 전체 | 여러 줄이면 그대로 유지 |
| `{{DONE_COUNT}}` | `[x]` 체크박스 수 | `## 액션 아이템` 섹션 |
| `{{TOTAL_COUNT}}` | 전체 체크박스 수 | `## 액션 아이템` 섹션 |
| `{{COMPLETION_RATE}}` | `DONE / TOTAL × 100` | 소수점 버림 |
| `{{COMPLETED_ITEMS}}` | `[x]` 항목 목록 | 담당자 그룹별로 유지 |
| `{{ROLLOVER_ITEMS}}` | `[ ]` 항목 목록 | 없으면 대체 문구 |
| `{{DECISIONS_TABLE}}` | `## 결정 사항 요약` 테이블 | 없으면 섹션 생략 |
| `{{REPORT_LINK}}` | `--report-url` 또는 로컬 경로 | Step 3 탐지 결과 |

---

## 규칙

- 에이전트 실명(Jordan, Avery 등)은 역할명(PM, FE 등)으로 대체한다.
- 민감 정보(API 키, 토큰, 개인 이메일)는 포함하지 않는다.
- 이월 항목이 없으면 해당 섹션 내용을 `없음 (Sprint N 100% 완료)`으로 대체한다.
- 결정 사항 테이블이 없으면 `### 📋 주요 결정 사항` 섹션 전체를 생략한다.
