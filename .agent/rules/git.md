# Git 사용 규칙

> 모든 에이전트는 git 명령어 실행 전 이 파일을 읽는다.
> 규칙 충돌 시 `security.md` > 이 파일 순서로 적용한다.

---

## 1. 허용 / 금지 목록

### 자유롭게 실행 가능 (읽기 전용)

```bash
git status
git log --oneline
git diff
git branch --show-current
git worktree list
git fetch origin        # 네트워크 조회만, 변경 없음
gh pr list / gh pr view
gh api GET ...
```

### 사용자 확인 후 실행

| 명령 | 확인 사유 |
|------|-----------|
| `git add` + `git commit` | 변경 이력에 영구 기록됨 |
| `git push` | 원격 영향 |
| `git merge` | 히스토리 변경 |
| `git rebase` | 히스토리 재작성 |
| `git stash pop` | 충돌 가능성 |
| `gh pr merge` | 되돌리기 어려움 |
| `gh api PATCH/DELETE` | 외부 상태 변경 |

### 절대 금지

```
main / master에 직접 push        → 반드시 브랜치 → PR 경로 사용
git push --force                  → 사용자 명시 요청 시에만 허용
git commit --no-verify            → 사용자 명시 요청 시에만 허용
git reset --hard (공유 브랜치)    → 사용자 확인 필수
.env / 자격증명 파일 커밋          → 절대 금지
```

---

## 2. 브랜치 전략

```
main                     — 항상 배포 가능한 상태 유지
sprint/{app}/{N}         — 스프린트 기능 브랜치
feat/{kebab-description} — 일반 기능 개발
fix/{kebab-description}  — 버그 수정
chore/{kebab-description}— 도구·설정·문서
refactor/{description}   — 리팩토링
```

**분기 기준:** 항상 최신 `main`에서 분기한다.

```bash
git checkout main && git pull origin main
git checkout -b feat/my-feature
```

---

## 3. 커밋 메시지 형식

```
{type}({scope}): {한국어 요약}

{변경 이유 — 선택}

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

| type | 사용 상황 |
|------|-----------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `chore` | 설정·도구·하네스 |
| `docs` | 문서만 변경 |
| `refactor` | 동작 변경 없는 구조 개선 |
| `design` | UI/스타일 변경 |

- 제목은 50자 이내, 명령형 동사 시작
- 본문은 **what이 아니라 why**를 담는다
- 무관한 변경은 같은 커밋에 포함하지 않는다 (외과적 커밋)

---

## 4. 커밋 전 체크리스트

```
- [ ] git status로 변경 파일 목록 확인
- [ ] .env / 자격증명 파일 미포함 여부 확인
- [ ] 무관한 파일이 섞여있지 않은지 확인
- [ ] 커밋 메시지를 사용자에게 보여주고 확인받기
```

---

## 5. 에이전트 커맨드 참조

상황에 따라 아래 커맨드를 사용한다. 직접 git 명령을 조합하지 않고 커맨드를 통해 진행한다.

| 상황 | 커맨드 |
|------|--------|
| 변경점 커밋 | `/git:commit` |
| PR 생성 | `/git:pr` |
| PR merge | `/git:merge` |
| 커밋 → PR → merge 전체 | `/git:ship` |
| 스프린트 PR 생성 | `/sprint:review` |
| 스프린트 merge 마무리 | `/sprint:merge` |

> 스프린트 전용 흐름은 `/sprint:*` 커맨드를 우선한다.
> 스프린트와 무관한 일반 작업에는 `/git:*` 커맨드를 사용한다.

---

## 6. worktree 사용 규칙

- 에이전트가 worktree를 생성할 때는 `isolation: "worktree"` 옵션으로만 생성한다.
- 작업 완료 후 변경이 없으면 자동 정리된다.
- 변경이 있으면 메인 브랜치로 병합 후 `git worktree remove`로 정리한다.
- worktree 목록 확인: `git worktree list`
- prunable 항목 정리: `git worktree prune`
