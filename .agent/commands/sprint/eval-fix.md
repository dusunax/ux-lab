---
description: eval 지적 사항 처리 결과를 PR에 댓글로 등록한다. Sprint 6 형식 유지.
---

# /sprint:eval-fix 하네스

**인수:** $ARGUMENTS

---

## Step 0 — 인수 파싱

| 패턴 | 동작 |
|------|------|
| (없음) | 현재 브랜치에서 PR 번호 자동 탐지 |
| `--pr NUMBER` | 지정 PR 번호 사용 |

---

## Step 1 — PR 번호 탐지

인수 없으면 `.agent/skills/SPRINT-CONTEXT.md`를 읽고 그 절차를 따라 **APP·N**을 확정한 뒤 PR을 탐색한다:

```bash
git branch --show-current  # sprint/{app}/{N} 패턴에서 APP·N 추출
gh pr list --repo [REPO] --head sprint/{APP}/{N} --json number --jq '.[0].number'
```

PR 번호를 확정하지 못하면:

```
⛔ PR 번호를 확인할 수 없습니다.
   --pr NUMBER 인수를 사용하거나 sprint/{app}/{N} 브랜치로 전환 후 재실행하세요.
```

---

## Step 2 — eval 댓글 읽기

```bash
gh pr view [NUMBER] --repo [REPO] --comments --json comments
```

eval 댓글(`🏁 Sprint {APP}/{N} 평가 — Grouper (EV)`, 구형 `🏁 Sprint N 평가 — Grouper (EV)` 제목도 허용)을 찾아 **Review Findings 테이블**을 추출한다.

각 항목의 등급(🔴 Blocker / 🟡 Major / 🟢 Minor)과 항목명을 목록화한다.

---

## Step 3 — 처리 결과 수집

각 finding 항목에 대해:

1. **처리 완료** — 관련 커밋 SHA 또는 파일명 확인
2. **미처리 (의도된 한계)** — 사유 명시
3. **미처리 (이월)** — 이월 스프린트 명시

최근 커밋 이력을 참고한다:

```bash
git log --oneline -10
```

---

## Step 4 — 댓글 본문 작성

아래 형식을 **반드시** 그대로 유지한다 (Sprint 6 표준):

```markdown
## 🔧 Review Findings — 처리 결과

---

### [등급아이콘] [항목명]: [✅ 완료 | ❌ 미처리]

[처리 내용 또는 사유. 완료 시 커밋 SHA 포함.]

### [등급아이콘] [항목명]: [✅ 완료 | ❌ 미처리]

**사유:** [미처리 사유 — 의도된 한계 / 이월 스프린트]

---

*🤖 /sprint:eval 후속 조치 — [오늘날짜]*
```

**규칙:**

- 각 finding 항목을 `### [등급아이콘] [항목명]: ✅/❌` 형식의 H3으로 작성
- 완료 항목: 무엇을 어떻게 했는지 + 커밋 SHA (있으면)
- 미처리 항목: `**사유:**` 라벨로 명확히 구분
- 등급 순서: 🔴 → 🟡 → 🟢
- 에이전트 실명(Orca, Kraken 등)은 역할명(PM, BE 등)으로 대체
- 마지막 줄: `*🤖 /sprint:eval 후속 조치 — YYYY-MM-DD*`

---

## Step 5 — 댓글 등록

댓글 본문을 **파일로 작성**한 후 등록한다:

```bash
# 1. 댓글 본문을 파일로 작성
cat > /tmp/evalfix_comment.txt << 'EOF'
[댓글 본문]
EOF

# 2. 파일로부터 댓글 등록 (--body-file 사용 필수)
gh pr comment [NUMBER] --repo [REPO] --body-file /tmp/evalfix_comment.txt

# 3. 댓글 등록 확인
if [ $? -eq 0 ]; then
  echo "✅ 댓글 등록 성공"
else
  echo "❌ 댓글 등록 실패"
  exit 1
fi
```

**주의사항:**
- ❌ `--body "$(cat file.txt)"` 금지 (쉘 이스케이프, 마크다운 파이프 미처리)
- ❌ `--body "$(cat file.txt | jq -Rs .)"` 금지 (JSON 이스케이프 오류)
- ✅ `--body-file file.txt` 사용 (파일 직접 읽음)
- ✅ `-F body=@file.txt` 사용 (파일 바이너리 전달, 가장 안전)

GitHub MCP(`mcp__github__add_issue_comment`) 우선 시도, 미연결 시 `gh` CLI 폴백.

---

## Step 6 — 라벨 업데이트

**⚠️ 중요: `findings:` 라벨은 절대 변경하지 않는다.**  
평가 당시 심각도를 기록하는 영구 메타데이터로, 항목 처리 완료 후에도 유지된다.

**모든 경우 (처리 완료 / 미처리 상관없음):**
- `findings: critical` / `findings: major` / `findings: minor` — **변경 없음**
- 처리 결과는 댓글에만 기록

```bash
# findings 라벨은 변경하지 않음 (Comment Step 5에서 댓글로만 반영)
# 라벨 업데이트 불필요
```

**처리 결과 반영 규칙:**
- 모든 항목 완료 → 댓글에 "✅" 표시
- 미처리 항목 있음 → 댓글에 "❌" 표시, 이월 스프린트 명시

---

## Step 7 — 완료 보고

```
✅ eval-fix 처리 완료

PR:       [URL]
댓글:     [댓글 URL]
처리:     [완료 N건 / 미처리 N건]
라벨:     변경 없음 (findings 영구 유지)
```

**라벨 유지 내용:**
- `findings: critical` / `findings: major` / `findings: minor` — 평가 이력 보존
- 처리 결과는 댓글의 ✅/❌ 마크로만 표시
