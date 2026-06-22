# Worktree Hygiene Rules

수산시장 팀은 작업 전환 시 남은 worktree가 Source Control에 노출되어 혼선을 만들지 않도록,
각 작업의 시작 전과 종료 후에 worktree 상태를 확인한다.

## Required Checkpoints

아래 시점마다 반드시 worktree를 점검한다.

1. 새 작업을 시작하기 전
2. PR 생성 또는 작업 완료 직후
3. 다른 브랜치나 다른 격리 worktree로 전환하기 전
4. Source Control에 예상하지 못한 변경 묶음이 보일 때

## Check Commands

```bash
git worktree list
git status --short --branch
```

worktree 경로가 `.claude/worktrees/`, `/private/tmp/`, `/tmp/` 아래에 있으면 임시 작업일 가능성이 높다.
하지만 임시 경로라는 이유만으로 삭제하지 않는다.

## Classification

점검한 worktree는 아래 중 하나로 분류한다.

| 상태 | 기준 | 처리 |
|------|------|------|
| Active | 현재 요청을 수행 중이거나 아직 PR/커밋이 필요한 worktree | 유지 |
| Pending Review | PR이 열려 있고 리뷰/머지를 기다리는 worktree | 유지, PR URL과 함께 보고 |
| Candidate Cleanup | PR이 머지됐거나 작업이 중단됐고 변경이 없는 worktree | 사용자 확인 후 제거 |
| Dirty Unknown | 변경 파일이 있고 현재 요청과 관련이 불명확한 worktree | 제거 금지, 사용자에게 보고 |

## Cleanup Rules

- `git worktree remove`는 사용자가 명시적으로 승인했을 때만 실행한다.
- dirty worktree는 제거하지 않는다. 먼저 해당 worktree에서 `git status --short --branch`를 확인한다.
- 제거 전에는 worktree 경로, 브랜치명, HEAD 커밋, dirty 여부를 사용자에게 요약한다.
- PR이 열린 branch는 PR 상태를 확인하기 전까지 제거하지 않는다.
- 메인 worktree의 기존 사용자 변경은 절대 정리 대상으로 삼지 않는다.

## Handoff Report

작업 완료 보고에는 필요한 경우 아래를 포함한다.

```text
Worktree 상태:
- 현재 작업: [경로] ([브랜치]) — clean/dirty
- 열린 PR: [URL 또는 없음]
- 정리 후보: [경로/브랜치] — 사용자 승인 필요
```

## Command

반복 점검은 `.agent/commands/worktree-check.md` 절차를 따른다.
