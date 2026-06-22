---
description: 작업 시작/종료 전 git worktree 상태를 점검하고 정리 후보를 분류한다. 삭제는 사용자 승인 없이는 하지 않는다.
---

# Worktree Check

작업 전환 시 Source Control에 남은 격리 worktree가 혼선을 만들지 않도록 점검한다.

## Step 1 — 전체 worktree 목록 확인

```bash
git worktree list
```

각 항목에서 아래 정보를 수집한다.

- 경로
- HEAD 커밋
- 브랜치명

## Step 2 — 각 worktree dirty 상태 확인

현재 작업과 관련 있어 보이는 worktree부터 확인한다.

```bash
git -C <worktree-path> status --short --branch
```

`.claude/worktrees/`, `/private/tmp/`, `/tmp/` 아래 worktree는 임시 작업 후보로 표시한다.

## Step 3 — PR 상태 확인

브랜치가 원격에 있거나 PR용으로 보이면 확인한다.

```bash
gh pr list --head <branch> --json number,title,state,url
```

GitHub CLI 또는 네트워크가 불가하면 "PR 상태 미확인"으로 표시하고 삭제 후보에서 제외한다.

## Step 4 — 분류

| 상태 | 기준 | 처리 |
|------|------|------|
| Active | 현재 요청을 수행 중이거나 아직 PR/커밋이 필요한 worktree | 유지 |
| Pending Review | PR이 열려 있고 리뷰/머지를 기다리는 worktree | 유지, PR URL 보고 |
| Candidate Cleanup | PR이 머지됐거나 작업이 중단됐고 변경이 없는 worktree | 사용자 승인 후 제거 |
| Dirty Unknown | 변경 파일이 있고 현재 요청과 관련이 불명확한 worktree | 제거 금지, 사용자에게 보고 |

## Step 5 — 보고

아래 형식으로 출력한다.

```text
Worktree 점검 결과
- Active: [N]개
- Pending Review: [N]개
- Candidate Cleanup: [N]개
- Dirty Unknown: [N]개

정리 후보:
- [경로] ([브랜치]) — 이유: [PR merged / clean stale / 중단 작업 등]

주의:
- dirty worktree는 삭제하지 않았습니다.
- 삭제가 필요하면 승인 후 `git worktree remove <path>`를 실행합니다.
```

## Rules

- 사용자 승인 없이 `git worktree remove`를 실행하지 않는다.
- dirty worktree를 삭제하지 않는다.
- 메인 worktree의 사용자 변경은 정리하지 않는다.
- 삭제 전에는 경로, 브랜치, HEAD, dirty 여부를 다시 확인한다.
