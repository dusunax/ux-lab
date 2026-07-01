---
description: 최신 main에서 새 브랜치 생성 → 커밋 → PR까지 한 번에 진행한다. "올려줘", "브랜치 만들고 PR", "new branch pr" 자연어로 트리거.
---

# /git:up 하네스

**인수:** $ARGUMENTS

| 패턴 | 동작 |
|------|------|
| (없음) | branch → commit → PR 전체 실행 |
| `--branch NAME` | 생성할 브랜치명 직접 지정 |
| `--type TYPE` | 커밋/브랜치 type 강제 지정 |
| `--message "msg"` | 커밋 메시지 직접 지정 |
| `--draft` | Draft PR로 생성 |
| `--base BRANCH` | PR 대상 브랜치 (기본: `main`) |
| `--branch-only` | 브랜치 생성까지만 실행 |
| `--no-pr` | 브랜치 + 커밋만 (PR 제외) |

**자연어 트리거:**

> "새 브랜치에 올려줘", "브랜치 만들고 PR", "여기서 브랜치 파서 PR 올려줘"
> → `/git:up` 실행

> **`git:ship`과의 차이:**
> - `git:up` = 새 브랜치 생성 + 커밋 + PR (merge 없음, 리뷰 대기)
> - `git:ship` = 커밋 + PR + merge (이미 브랜치가 있고 바로 merge까지)

**실행 전 필독:** `.agent/rules/git.md`

---

## 전체 흐름

```
main pull
    ↓
[git:branch] 브랜치명 결정 → 사용자 확인 → 생성
    ↓
[git:commit] 변경점 확인 → 커밋 메시지 → 사용자 확인 → 커밋
    ↓
[git:pr]     push → PR 본문 → 사용자 확인 → PR 생성
```

---

## Phase 1 — 브랜치 생성 (`git:branch` 절차 실행)

`.agent/commands/git/branch.md`를 읽고 절차를 따른다.

- `--branch`, `--type`, `--base` 인수를 그대로 전달한다.
- **브랜치명을 사용자에게 확인받은 뒤 생성한다.**
- `--branch-only` 플래그가 있으면 여기서 종료한다.

---

## Phase 2 — 커밋 (`git:commit` 절차 실행)

`.agent/commands/git/commit.md`를 읽고 절차를 따른다.

- `--type`, `--message` 인수를 그대로 전달한다.
- **커밋 메시지를 사용자에게 확인받은 뒤 커밋한다.**
- 변경점이 없으면 이 단계를 건너뛴다.
- `--no-pr` 플래그가 있으면 커밋 후 종료한다.

---

## Phase 3 — PR 생성 (`git:pr` 절차 실행)

`.agent/commands/git/pr.md`를 읽고 절차를 따른다.

- `--draft`, `--base` 인수를 그대로 전달한다.
- **PR 본문을 사용자에게 확인받은 뒤 생성한다.**

---

## 완료 보고

```
🆙 Up 완료

Phase 1 브랜치: {브랜치명} (from main)
Phase 2 커밋:   {SHA} — {제목}
Phase 3 PR:     {URL}

리뷰 후 merge:  /git:merge --pr {NUMBER}
전체 한번에:    /git:ship
```

건너뛴 단계가 있으면 명시한다.
