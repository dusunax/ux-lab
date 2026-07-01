---
description: 현재 브랜치를 push하고 GitHub PR을 생성한다. 라벨 자동 부착. 스프린트와 무관한 범용 PR 생성에 사용한다.
---

# /git:pr 하네스

**인수:** $ARGUMENTS

| 패턴 | 동작 |
|------|------|
| (없음) | 현재 브랜치 기준 자동 생성 |
| `--base BRANCH` | PR 대상 브랜치 지정 (기본: `main`) |
| `--title "제목"` | PR 제목 직접 지정 |
| `--draft` | Draft PR로 생성 |
| `--label LABEL` | 추가 라벨 지정 |

**실행 전 필독:** `.agent/rules/git.md`

---

## Step 1 — 전제 조건 확인

```bash
git rev-parse --abbrev-ref HEAD
git status --short
```

- 현재 브랜치가 `main`/`master`면 중단:
  ```
  ⛔ main 브랜치에서 PR을 생성할 수 없습니다. 피처 브랜치로 전환하세요.
  ```
- 미커밋 변경이 있으면 먼저 `/git:commit` 실행을 안내한다.

---

## Step 2 — push

```bash
git push -u origin {현재 브랜치}
```

이미 원격에 있으면:
```bash
git push origin {현재 브랜치}
```

---

## Step 3 — PR 본문 구성

`git log main..HEAD --oneline`과 `git diff main...HEAD --stat`을 읽어 PR 본문을 작성한다.

```markdown
## 개요

{변경 목적 — 1~3줄}

## 변경 내용

{주요 변경 항목 bullet}

## 테스트

- [ ] 로컬 실행 확인
- [ ] 주요 흐름 테스트

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

`--title`이 없으면 커밋 이력에서 PR 제목을 추론한다.

**PR 본문을 사용자에게 보여주고 확인받는다.** (대화형 모드)

---

## Step 4 — PR 생성

```bash
gh pr create \
  --base {base 브랜치} \
  --title "{제목}" \
  --body "{본문}" \
  --assignee @me
```

`--draft` 플래그가 있으면 `--draft` 추가.

---

## Step 5 — 라벨 부착

PR 번호 확인 후 라벨 부착:

```bash
gh pr edit {NUMBER} --add-label "{라벨}" --repo dusunax/ux-lab
```

| 조건 | 라벨 |
|------|------|
| 항상 | `status: review-needed` |
| `--draft` 사용 시 | `status: wip` |
| `--label` 인수 있음 | 해당 라벨 추가 |

---

## Step 6 — 완료 보고

```
🔀 PR 생성 완료

PR:      {URL}
브랜치:  {HEAD} → {base}
제목:    {제목}
라벨:    {라벨 목록}

다음 단계:
  merge:  /git:merge --pr {NUMBER}
```
