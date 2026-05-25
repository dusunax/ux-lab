---
description: 스프린트 시작 의식. 이전 스프린트 완료 여부를 검증한 뒤, Jordan(PM)이 플랜을 작성하고 Alex(TS)가 docs/meetings/에 킥오프 MD를 생성한다. 인수 없음 — 모든 컨텍스트를 자동 수집한다.
---

# /sprint:start 하네스

인수 없음. 모든 컨텍스트는 `docs/meetings/`와 git에서 자동 수집한다.

---

## Step 0 — 컨텍스트 자동 수집

### 0-1. 스프린트 번호 추론

```bash
ls docs/meetings/ | sort
```

**스프린트 파일 판별 규칙:**
- 포함: `YYYY-MM-DD-sprint-N.md`, `YYYY-MM-DD-sprint-N-kickoff.md`, `YYYY-MM-DD-sprint-N-pre.md`
- 제외: `-pre` 단독, `sprint-workflow`, 숫자 N이 없는 파일 (예: `sprint-workflow.md`)

유효한 파일에서 가장 큰 N을 `PREV_SPRINT`로 확정한다.
`NEXT_SPRINT = PREV_SPRINT + 1`.

파일이 하나도 없으면 **즉시 중단**한다:

```
⛔ docs/meetings/에 이전 스프린트 기록이 없습니다.
첫 스프린트는 수동으로 킥오프 파일을 작성해 주세요.
```

### 0-2. 검사 대상 파일 결정

`PREV_SPRINT`에 해당하는 파일을 아래 우선순위로 찾는다:

1. `*-sprint-[PREV_SPRINT]-kickoff.md` → **현대 포맷** (수용 기준 + 액션 아이템 검사)
2. `*-sprint-[PREV_SPRINT].md` (`-pre` `-kickoff` 없는 것) → **레거시 포맷** (액션 아이템만 검사)

파일을 찾지 못하면:

```
⚠️ Sprint [PREV_SPRINT] 회의록을 찾지 못했습니다.
완료 검증을 건너뜁니다. 계속 진행합니다.
```

---

## Step 1 — 이전 스프린트 완료 검증 (게이트)

Step 0-2에서 찾은 파일을 읽는다.

**검사 범위 (포맷에 따라 다름):**

| 포맷 | 검사 섹션 |
|------|-----------|
| 현대 (kickoff) | `## 수용 기준` + `## 액션 아이템` |
| 레거시 (sprint-N.md) | `## 액션 아이템` 만 |

**체크박스가 하나도 없는 경우 (극초기 레거시):**

```
⚠️ Sprint [PREV_SPRINT] 완료 여부를 자동으로 확인할 수 없습니다.
   (회의록에 체크리스트 항목이 없는 구형 포맷입니다.)

이전 스프린트가 완료됐음을 직접 확인했다면 계속 진행합니다.
```
→ 계속 진행한다 (하드 블록하지 않음).

---

**미완료 항목이 있는 경우 — 90% 룰 적용:**

전체 체크박스 수 대비 미완료 비율을 계산한다.

```
전체: N개  완료: M개  미완료: K개  완료율: (M/N × 100)%
```

| 완료율 | 처리 |
|--------|------|
| 100% | ✅ 자동 통과 |
| 90% 이상 | ⚠️ 경고 출력 후 계속 진행 (90% 룰 적용) |
| 90% 미만 | ⛔ 중단 |

**90% 이상 미완료 (경고):**

```
⚠️ Sprint [PREV_SPRINT] — 90% 룰 적용
   완료율: [완료율]% ([M]/[N]개)

미완료 항목 (이월 처리됩니다):
- [ ] [항목]

Sprint [NEXT_SPRINT] 킥오프에 이월 항목을 포함합니다.
```
→ 이월 항목 목록을 저장하고 Step 3(Jordan)에게 전달한다. 진행은 계속한다.

**90% 미만 (중단):**

```
⛔ Sprint [PREV_SPRINT]이 완료되지 않았습니다. (완료율: [완료율]%)
   Sprint [NEXT_SPRINT]을 시작할 수 없습니다.

미완료 항목 ([파일명]):
- [ ] [항목 1]
- [ ] [항목 2]
...

해결 방법:
1. 해당 항목을 완료한 뒤 파일에서 [x]로 변경하고 다시 실행하세요.
2. 다음 스프린트로 이월할 항목은 파일에서 삭제하고 다시 실행하세요.
   (이월 시 완료율이 90% 이상이 되면 진행 가능합니다.)
```

**여기서 커맨드를 종료한다.**

### 통과 시

```
✅ Sprint [PREV_SPRINT] 완료 확인. Sprint [NEXT_SPRINT] 시작을 진행합니다.
```

---

## Step 1.5 — 스프린트 브랜치 생성

게이트 통과 후, `sprint/[NEXT_SPRINT]` 브랜치를 생성하고 체크아웃한다.

```bash
git branch --list sprint/[NEXT_SPRINT]
```

- 브랜치가 **없으면**: `git checkout -b sprint/[NEXT_SPRINT]`
- 브랜치가 **이미 있으면**: `git checkout sprint/[NEXT_SPRINT]` 후 아래 경고 출력

```
⚠️ sprint/[NEXT_SPRINT] 브랜치가 이미 존재합니다. 해당 브랜치로 전환합니다.
```

정상 생성 시 출력:

```
🌿 브랜치 생성: sprint/[NEXT_SPRINT]
   이후 모든 커밋은 이 브랜치에서 진행합니다.
```

---

## Step 2 — 컨텍스트 보강

Jordan에게 전달할 배경 정보를 수집한다.

```bash
# 이전 스프린트 이후 커밋 이력
git log --oneline --since="7 days ago"

# 현재 날짜
date +"%Y-%m-%d"
```

이전 스프린트 킥오프 파일에서 아래 섹션을 추출한다:
- `## Sprint N 목표`
- `## 결정 사항 요약`
- `## Open Questions` (상태가 ⚠️ Open인 항목)

---

## Step 3 — Jordan(PM) 소환: 스프린트 플랜 작성

`product/PM/prd-product-manager` 에이전트를 소환한다.

Jordan에게 전달할 프롬프트:

```
Sprint [NEXT_SPRINT] 플랜을 작성해줘.

PRD 전체가 아닌 스프린트 범위 요약만 작성할 것.
아래 컨텍스트를 참고해서 이번 스프린트의 목표와 작업을 추론해.

[컨텍스트: 이전 스프린트 목표]
[컨텍스트: 이전 스프린트 결정 사항 요약]
[컨텍스트: 이월된 Open Questions]
[컨텍스트: 최근 git log]

출력 형식 (이 형식 그대로):

## Sprint [NEXT_SPRINT] 플랜

### 목표
> [한 줄 핵심 목표 — 굵게 쓸 것]

### 주요 작업 (백로그)
| # | 항목 |
|---|------|
| 1 | [작업 1] |
| 2 | [작업 2] |

### 수용 기준 (Acceptance Criteria)
- [ ] [기준 1]
- [ ] [기준 2]

### 제외 범위 (Out of Scope)
| 항목 | 이연 사유 |
|------|-----------|
| [항목] | [사유] |

### Open Questions
| 질문 | 담당 | 기한 | 상태 |
|------|------|------|------|
| [이월된 OQ] | [담당] | Sprint [NEXT_SPRINT] 킥오프 | ⚠️ Open |

### 리스크
- [알려진 불확실성 또는 의존성]
```

Jordan의 결과물을 저장한다.

---

## Step 4 — Alex(TS) 소환: 킥오프 MD 생성

`product/TS/secretary` 에이전트를 소환한다.

Alex에게 전달할 프롬프트:

```
Sprint [NEXT_SPRINT] 킥오프 회의록 MD 파일을 생성해줘.

파일 경로: docs/meetings/[오늘날짜]-sprint-[NEXT_SPRINT]-kickoff.md
오늘 날짜: [Step 2에서 수집한 날짜]

아래 템플릿에 Jordan의 스프린트 플랜을 채워서 작성해줘.
기존 회의록 형식(2026-05-21-sprint-6-kickoff.md)을 그대로 따를 것.

---
# Sprint [NEXT_SPRINT] 킥오프 회의록

**날짜:** [오늘날짜]
**참석자:** PM Jordan, FE Avery, BE Blake, QA Morgan, QA Quinn, TS Alex, AI Sage
**진행자:** PM Jordan

---

## Sprint [NEXT_SPRINT] 목표

> **[Jordan의 한 줄 목표]**

---

## Sprint [NEXT_SPRINT] 확정 스코프

[Jordan의 주요 작업 테이블]

---

## 수용 기준 (Acceptance Criteria)

[Jordan의 수용 기준 체크리스트]

---

## 액션 아이템

(킥오프 후 역할별 담당자와 함께 채울 것)

---

## Open Questions

[Jordan의 Open Questions 테이블]

---

## 비고

### 리스크
[Jordan의 리스크]

### 제외 범위
[Jordan의 제외 범위]

---

*회의록 작성: TS Alex | 다음 회의: Sprint [NEXT_SPRINT] 리뷰*
---

파일 생성 후 docs/meetings/README.md 인덱스 테이블에도 한 줄 추가해줘:
| [파일명] | Sprint [NEXT_SPRINT] 킥오프 | [오늘날짜] | [목표 한 줄 요약] |
```

---

## Step 5 — 완료 보고

```
🚀 Sprint [NEXT_SPRINT] 시작

✅ Sprint [PREV_SPRINT] 완료 검증 통과
🌿 브랜치:  sprint/[NEXT_SPRINT]
Jordan(PM): 스프린트 플랜 작성 완료
Alex(TS):   docs/meetings/[파일명] 생성 완료
            README.md 인덱스 업데이트 완료

목표: [Jordan의 한 줄 목표]

참고: docs/workflow/sprint-git-workflow.md
```
