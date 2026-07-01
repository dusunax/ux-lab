---
description: 현재 변경점을 분석해 브랜치 분기 여부를 판단하고, 커밋 메시지를 제안한 뒤 사용자 확인 후 커밋한다.
---

# /git:commit 하네스

**인수:** $ARGUMENTS

| 패턴 | 동작 |
|------|------|
| (없음) | 변경점 자동 분석 |
| `--type TYPE` | 커밋 type 강제 지정 (`feat`/`fix`/`chore`/`refactor`/`docs`/`design`) |
| `--scope SCOPE` | 커밋 scope 강제 지정 |
| `--message "msg"` | 커밋 메시지 직접 지정 (확인 단계 생략) |
| `--branch NAME` | 분기할 브랜치명 직접 지정 |

**실행 전 필독:** `.agent/rules/git.md`

---

## Step 1 — 변경점 확인 (게이트)

```bash
git status --short
git diff --stat
```

변경이 하나도 없으면 중단:
```
⛔ 커밋할 변경점이 없습니다.
```

민감 파일(`.env`, 자격증명, 시크릿 포함 파일) 감지 시 커밋 전 사용자에게 경고한다.

변경 파일 목록과 요약을 사용자에게 보여준다.

---

## Step 2 — 브랜치 분기 판단

```bash
git rev-parse --abbrev-ref HEAD
```

### 분기 정책

| 현재 브랜치 | 처리 |
|------------|------|
| `main` / `master` | 반드시 새 브랜치 생성 후 커밋 |
| `sprint/*` | 스프린트 브랜치에 그대로 커밋 (분기 불필요) |
| `feat/*` / `fix/*` / `chore/*` | 현재 브랜치에 커밋 (기본) |

`main`/`master`에 있을 경우:

1. 변경 내용에서 type·설명을 추론해 브랜치명 제안
2. `--branch NAME` 지정 시 해당 이름 사용
3. **사용자에게 브랜치명 확인** 후 생성

```bash
git checkout -b {브랜치명}
```

---

## Step 3 — 커밋 메시지 작성

`--message` 인수가 있으면 해당 메시지를 사용하고 Step 4로 건너뛴다.

변경 파일·diff를 분석해 커밋 메시지 초안을 작성한다:

```
{type}({scope}): {한국어 요약}

{변경 이유 — 선택, 비자명한 경우에만}

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

- type 결정: `--type` 인수 > 변경 성격 추론
- scope 결정: 변경된 주요 디렉터리/앱명
- 요약: what이 아닌 **why** 중심으로 작성

**커밋 메시지를 사용자에게 보여주고 확인을 받는다.** 승인 전 커밋하지 않는다.

---

## Step 4 — 스테이징 및 커밋

요청 범위의 파일만 스테이징한다. 무관한 사전 변경은 포함하지 않는다.

```bash
git add {변경 파일들}
git commit -m "$(cat <<'EOF'
{커밋 메시지}
EOF
)"
```

커밋 후 확인:

```bash
git log --oneline -1
git status
```

---

## Step 5 — 완료 보고

```
✅ 커밋 완료

브랜치:  {브랜치명}
커밋:    {SHA} — {제목}
파일:    {N}개
```

다음 단계 안내:
- PR 생성: `/git:pr`
- 커밋·PR·merge 한 번에: `/git:ship`
