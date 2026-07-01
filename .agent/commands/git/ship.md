---
description: 이미 브랜치에 있을 때 commit → PR 생성까지 실행한다. "ship", "올려줘", "PR 올려줘", "커밋하고 올려줘" 자연어로 트리거.
---

# /git:ship 하네스

**인수:** $ARGUMENTS

| 패턴 | 동작 |
|------|------|
| (없음) | commit → PR 실행 |
| `--commit-only` | 커밋까지만 실행 |
| `--pr-only` | PR 생성만 (커밋 완료 가정) |
| `--draft` | Draft PR로 생성 |
| `--base BRANCH` | PR 대상 브랜치 (기본: `main`) |
| `--type TYPE` | 커밋 type 강제 지정 |
| `--message "msg"` | 커밋 메시지 직접 지정 |

**자연어 트리거:**

> "ship", "올려줘", "PR 올려줘", "커밋하고 올려줘", "PR 만들어줘"
> → `/git:ship` 실행

> **다른 커맨드와의 관계:**
> - `git:up` = 새 브랜치 생성 + 커밋 + PR (main에서 새로 시작)
> - `git:ship` = 커밋 + PR (이미 브랜치에 있을 때)
> - `git:merge` = PR merge (별도 실행)

**실행 전 필독:** `.agent/rules/git.md`

---

## 전체 흐름

```
변경점 확인
     ↓
[git:commit] 브랜치 분기 판단 → 커밋 메시지 → 사용자 확인 → 커밋
     ↓
[git:pr]     push → PR 본문 구성 → 사용자 확인 → PR 생성
```

---

## Step 1 — 인수 파싱 및 실행 범위 결정

```
--commit-only  → Phase 1만
--pr-only      → Phase 2만 (Phase 1 건너뜀)
(없음)         → Phase 1 + Phase 2
```

---

## Phase 1 — 커밋 (`git:commit` 절차 실행)

`.agent/commands/git/commit.md`를 읽고 절차를 따른다.

- `--type`, `--message` 인수를 그대로 전달한다.
- **커밋 메시지를 사용자에게 확인받은 뒤 커밋한다.**
- 변경점이 없으면 Phase 2로 건너뛴다.

---

## Phase 2 — PR 생성 (`git:pr` 절차 실행)

`.agent/commands/git/pr.md`를 읽고 절차를 따른다.

- `--draft`, `--base`, `--label` 인수를 그대로 전달한다.
- **PR 본문을 사용자에게 확인받은 뒤 생성한다.**

---

## 완료 보고

```
🚢 Ship 완료

Phase 1 커밋:  {SHA} — {제목}
Phase 2 PR:    {URL}

merge 준비되면:  /git:merge --pr {NUMBER}
```

단계별 건너뜀이 있으면 명시한다.

---

## 주의사항

- 각 Phase 사이에 사용자 확인 게이트가 있다. 임의로 건너뛰지 않는다.
- 현재 브랜치가 `main`이면 먼저 `/git:branch`로 분기하거나 `/git:up`을 사용한다.
- 스프린트 작업은 `/sprint:review` → `/sprint:merge`를 사용한다.
- `--pr-only` 사용 시 현재 브랜치에 커밋이 하나 이상 있어야 한다.
