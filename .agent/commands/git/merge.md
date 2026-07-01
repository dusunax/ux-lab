---
description: PR을 merge하고 post-merge 처리(이미지 URL 교체 등)를 수행한다. 스프린트와 무관한 범용 merge에 사용한다.
---

# /git:merge 하네스

**인수:** $ARGUMENTS

| 패턴 | 동작 |
|------|------|
| (없음) | 현재 브랜치의 PR 자동 탐지 |
| `--pr NUMBER` | PR 번호 직접 지정 |
| `--squash` | Squash merge 사용 (기본: merge commit) |
| `--delete-branch` | merge 후 원격 브랜치 삭제 (기본: true) |

**실행 전 필독:** `.agent/rules/git.md`

---

## Step 1 — PR 상태 확인

```bash
gh pr list --head {현재 브랜치} --repo dusunax/ux-lab \
  --json number,url,mergeStateStatus,mergeable,mergedAt --jq '.[0]'
```

- `mergedAt`이 null이 아니면 이미 merge 완료 → Step 3(post-merge)으로 이동
- `mergeStateStatus`가 `CLEAN`이 아니면 사용자에게 알리고 중단

---

## Step 2 — merge 실행

```bash
gh pr merge {PR_NUMBER} --repo dusunax/ux-lab --merge --delete-branch
```

`--squash` 플래그가 있으면 `--squash` 사용.
`--delete-branch false`로 지정하면 브랜치를 유지한다.

merge 완료 확인:

```bash
gh api /repos/dusunax/ux-lab/pulls/{PR_NUMBER} \
  --jq '{merged: .merged, merged_at: .merged_at}'
```

`merged: true`가 아니면 오류 보고 후 중단.

---

## Step 3 — post-merge 처리

### 3-1. PR 본문 이미지 URL 교체 (있을 때만)

PR 본문에 sprint 브랜치 raw URL이 있으면 main URL로 교체한다:

```bash
gh api /repos/dusunax/ux-lab/pulls/{PR_NUMBER} --jq '.body' > /tmp/pr_body.txt
# sprint 브랜치 URL → main URL 치환
```

교체할 URL이 없으면 건너뛴다.

### 3-2. main 최신화

```bash
git checkout main && git pull origin main
```

---

## Step 4 — 완료 보고

```
✅ Merge 완료

PR:      {URL}
브랜치:  {HEAD} → main (삭제됨)
커밋:    {merge commit SHA}
URL 교체: {N개 / 없음}
```
