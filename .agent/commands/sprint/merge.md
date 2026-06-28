---
description: 스프린트 머지 전체 프로세스. 충돌 해결 → push → PR merge → 이미지 URL main 교체 → 메모리 정리 커밋 → 워크트리 정리. /sprint:review 이후에 실행한다.
---

# /sprint:merge 하네스

**인수:** $ARGUMENTS

| 패턴 | 동작 |
|------|------|
| (없음) | 현재 브랜치에서 스프린트 N 자동 추론 |
| `--sprint N` | 지정 N 사용 |
| `--pr NUMBER` | PR 번호 직접 지정 |

---

## Step 1 — 브랜치 및 PR 확인

```bash
git branch --show-current
gh pr list --head {BRANCH} --repo dusunax/ux-lab --json number,url,state,mergedAt --jq '.[0]'
```

- `mergedAt`이 null이 아니면 이미 merge 완료 → Step 3(URL 교체)부터 실행한다.
- PR 번호를 모르면 현재 브랜치로 탐색:

```bash
gh pr list --head {BRANCH} --repo dusunax/ux-lab --json number,url --jq '.[0]'
```

---

## Step 2 — 충돌 해결 및 push

```bash
git fetch origin main
git merge origin/main --no-commit --no-ff
```

충돌 파일이 있으면:

1. `git status`로 충돌 파일 목록 확인
2. 각 파일의 충돌 마커(`<<<<<<<`, `=======`, `>>>>>>>`)를 확인해 의도에 맞게 해결
3. 해결 원칙:
   - `docs/presentations/.last-report` — 현재 스프린트(HEAD) 보고서 경로 유지
   - 코드 파일 — 양쪽 변경이 모두 유효하면 병합, 한쪽이 이전 버전이면 최신 유지
   - 판단이 어려우면 **사용자에게 확인** 후 진행

4. 해결 후 커밋:

```bash
git add {해결된 파일들}
git commit -m "chore: merge origin/main — 충돌 해결"
```

충돌이 없으면 merge 취소(`git merge --abort` 불필요, `Already up to date`이면 그대로 진행).

### 최종 push

```bash
git push origin {BRANCH}
```

---

## Step 2.5 — PR merge

```bash
gh pr merge {PR_NUMBER} --repo dusunax/ux-lab --merge --delete-branch
```

merge 완료 확인:

```bash
gh api /repos/dusunax/ux-lab/pulls/{PR_NUMBER} --jq '{merged: .merged, merged_at: .merged_at, state: .state}'
```

`merged: true`가 아니면 오류를 보고하고 중단한다.

---

## Step 3 — PR 이미지 URL → main 교체

### 3-1. PR 본문 읽기 및 URL 치환

```bash
gh api /repos/dusunax/ux-lab/pulls/{PR_NUMBER} --jq '.body' > /tmp/pr_body.txt
sed 's|raw/sprint/{branch}/|raw/main/|g' /tmp/pr_body.txt > /tmp/pr_body_new.txt
```

교체할 URL이 없으면 이 단계를 건너뛴다.

### 3-2. PR 본문 업데이트

```bash
gh api --method PATCH /repos/dusunax/ux-lab/pulls/{PR_NUMBER} \
  --field body="$(cat /tmp/pr_body_new.txt)"
```

---

## Step 4 — 메모리 정리 커밋 (선택)

리포지토리 내 `.claude/agent-memory/`에 변경된 파일이 있으면 커밋한다.

```bash
git status --short .claude/agent-memory/
```

변경 파일이 있으면:

```bash
git add .claude/agent-memory/
git commit -m "chore(agent-memory): 스프린트 마무리 메모리 정리"
```

없으면 건너뛴다.

---

## Step 4.5 — 워크트리 정리

### prunable 먼저 정리

```bash
git worktree prune
```

### 현재 worktree 목록 확인

```bash
git worktree list
```

### 삭제 대상 판별

아래 조건을 **모두** 만족하는 worktree만 제거한다:

| 조건 | 확인 방법 |
|------|-----------|
| main 브랜치가 아닌 worktree | `git worktree list`에서 HEAD 브랜치 확인 |
| 이미 merge된 브랜치 | `git branch --merged main` |
| 미커밋 변경 없음 | `git -C {worktree_path} status --porcelain` 결과 비어있음 |

조건을 하나라도 충족하지 못하면 **건너뛰고 사용자에게 알린다**.

### 제거

```bash
git worktree remove {worktree_path} --force
git branch -d {branch_name}
```

- `--force`는 worktree 디렉토리가 남아있을 때만 사용한다.
- 브랜치 삭제는 로컬만 제거한다 (원격은 GitHub merge 시 자동 삭제).

---

## Step 5 — 완료 보고

```
✅ Sprint N 머지 완료

PR:           https://github.com/dusunax/ux-lab/pull/{NUMBER}
브랜치:       sprint/N → main (삭제됨)
충돌 해결:   [해결 파일 수] 개 / 없음
이미지 URL:  main으로 교체 완료 / 교체 대상 없음
메모리:      커밋 완료 / 변경 없음
워크트리:    [정리된 수] 개 제거 / 조건 미충족으로 보존
```
