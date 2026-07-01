---
description: 최신 main을 기준으로 규칙에 맞는 새 브랜치를 생성한다. 항상 main을 pull한 뒤 분기한다.
---

# /git:branch 하네스

**인수:** $ARGUMENTS

| 패턴 | 동작 |
|------|------|
| (없음) | 변경점·컨텍스트에서 브랜치명 추론 후 제안 |
| `NAME` | 브랜치명 직접 지정 (type prefix 없으면 자동 추론) |
| `--type TYPE` | type 강제 지정 (`feat`/`fix`/`chore`/`refactor`/`docs`/`design`) |
| `--base BRANCH` | 분기 기준 브랜치 (기본: `main`) |

**실행 전 필독:** `.agent/rules/git.md`

---

## Step 1 — main 최신화

```bash
git fetch origin main
git checkout main
git pull origin main
```

pull 실패(미커밋 변경 등)시 사용자에게 알리고 중단한다.

---

## Step 2 — 브랜치명 결정

### 2-1. 형식 규칙

```
{type}/{kebab-case-description}
```

| type | 사용 상황 |
|------|-----------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `chore` | 설정·도구·하네스·문서 외 잡무 |
| `refactor` | 동작 변경 없는 구조 개선 |
| `docs` | 문서만 변경 |
| `design` | UI·스타일 변경 |
| `sprint` | 스프린트 작업 (`sprint/{app}/{N}` 형식) |

### 2-2. 브랜치명 추론

인수가 없으면 현재 작업 컨텍스트(변경 파일·사용자 요청)에서 type과 설명을 추론해 제안한다.

인수로 NAME만 주어지고 `/`가 없으면 type을 추론해 `{type}/{NAME}` 형식으로 변환한다.

### 2-3. 사용자 확인

**제안된 브랜치명을 사용자에게 보여주고 확인받는다.** 확인 전 브랜치를 생성하지 않는다.

```
제안 브랜치명: feat/user-profile-card
생성할까요?
```

---

## Step 3 — 브랜치 생성

```bash
git checkout -b {브랜치명}
```

이미 존재하는 브랜치명이면 사용자에게 알리고 다른 이름을 제안한다.

---

## Step 4 — 완료 보고

```
🌿 브랜치 생성 완료

브랜치:  {브랜치명}
기준:    main ({latest commit SHA})

다음 단계:
  커밋:      /git:commit
  커밋+PR:   /git:up
```
