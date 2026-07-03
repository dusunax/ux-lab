# 스프린트 프로세스 — 역할별 절차 명세

> 에이전트는 스프린트 작업 시 이 문서를 참조한다.
> 각 단계의 **주체(역할)**와 **커맨드**가 명시되어 있다.

---

## 전체 흐름

```
sprint:start
     ↓
  (개발)
     ↓
sprint:report
     ↓
sprint:review
     ↓
sprint:eval
     ↓
sprint:eval-fix  (RF 발견 시)
     ↓
sprint:merge
```

---

## 단계별 절차

### 1. `sprint:start` — 스프린트 시작

| 항목 | 내용 |
|------|------|
| **주체** | Jordan (PM) + Alex (TS) |
| **커맨드** | `/sprint:start` |
| **입력** | 이전 스프린트 킥오프 파일, git log |
| **출력** | 킥오프 MD (`docs/meetings/{app}/YYYY-MM-DD-sprint-N-kickoff.md`) |
| **브랜치** | `sprint/{app}/{N}` 생성 |

**절차:**
1. 이전 스프린트 완료율 확인 (90% 미만 시 블록)
2. Jordan: 스프린트 플랜 작성 (목표·백로그·AC·OQ·리스크)
3. Alex: 킥오프 MD 생성 + README.md 인덱스 업데이트
4. `sprint/{app}/{N}` 브랜치 생성

---

### 2. 개발 — 기능 구현

| 항목 | 내용 |
|------|------|
| **주체** | FE Avery / BE Blake / AI Sage (역할별) |
| **커맨드** | 없음 (일반 개발) |
| **git 규칙** | `.agent/rules/git.md` 준수 |

**절차:**
1. `sprint/{app}/{N}` 브랜치에서 작업
2. 기능 단위로 커밋 (외과적 커밋)
3. 킥오프 MD 체크리스트 `[x]` 업데이트
4. 개발 완료 후 `sprint:report`로 이동

---

### 3. `sprint:report` — 보고서 생성

| 항목 | 내용 |
|------|------|
| **주체** | Jordan (PM) |
| **커맨드** | `/sprint:report` |
| **입력** | 킥오프 MD, 스크린샷 (`docs/presentations/{app}/shot-*.png`) |
| **출력** | HTML 보고서 (`docs/presentations/sprint-{app}-{N}-report-{date}.html`) |

**절차:**
1. 킥오프 MD 읽기 (목표·완료 항목·결정 사항 추출)
2. 슬라이드 구조 설계 (ppt-theme.css 사용)
3. HTML 보고서 생성
4. `.last-report` 파일 업데이트

---

### 4. `sprint:review` — PR 생성

| 항목 | 내용 |
|------|------|
| **주체** | Jordan (PM) |
| **커맨드** | `/sprint:review` |
| **입력** | 킥오프 MD, 보고서 HTML |
| **출력** | GitHub PR (`sprint/{app}/{N}` → `main`) |

**절차:**
1. 킥오프 파일에서 완료율·결정 사항 추출
2. 보고서 GitHub Pages URL 변환
3. PR 본문 구성 + 생성 (이미지: sprint 브랜치 raw URL)
4. 라벨 부착: `type: sprint`, `eval: pending`

---

### 5. `sprint:eval` — 스프린트 평가

| 항목 | 내용 |
|------|------|
| **주체** | Nolan (EV) |
| **커맨드** | `/sprint:eval` |
| **입력** | PR diff, 킥오프 MD |
| **출력** | PR 평가 코멘트, Discussions 재발방지 항목 |

**절차:**
1. PR diff + 킥오프 컨텍스트 수집
2. Nolan(EV): ops·마케팅·비즈니스 관점 평가
3. PR 코멘트 등록
4. Blocker/Major RF → Discussions #42에 재발방지 코멘트 추가
5. 라벨 교체: `eval: pending` → `eval: done` + `finding: {blocker|major|clear}`

---

### 6. `sprint:eval-fix` — RF 수정

| 항목 | 내용 |
|------|------|
| **주체** | 담당 엔지니어 (FE Avery / BE Blake 등) |
| **커맨드** | `/sprint:eval-fix` |
| **입력** | eval 코멘트의 RF 항목 |
| **출력** | 수정 커밋 + PR 재발방지 코멘트 |

**절차:**
1. Blocker → Major → Minor 순으로 수정
2. 각 RF 수정 후 PR에 코멘트 등록
3. Blocker/Major: Discussions #42 재발방지 항목 추가

---

### 7. `sprint:merge` — 머지 마무리

| 항목 | 내용 |
|------|------|
| **주체** | 에이전트 |
| **커맨드** | `/sprint:merge` |
| **입력** | PR 번호 |
| **출력** | merged PR, main URL로 교체된 PR 본문 |

**절차:**
1. origin/main sync + 충돌 해결
2. push
3. `gh pr merge --merge --delete-branch`
4. PR 본문 이미지 URL: sprint 브랜치 raw → main raw 교체
5. `.claude/agent-memory/` 변경 시 커밋 (선택)
6. `git worktree prune` + 조건 충족 worktree 정리

---

## 역할 요약

| 역할 | 에이전트 | subagent_type | 담당 커맨드 |
|------|---------|---------------|------------|
| PM | Jordan | `product/PM/prd-product-manager` | `sprint:start`, `sprint:report`, `sprint:review` |
| TS | Alex | `product/TS/secretary` | 킥오프 MD 작성 |
| EV | Nolan | `product/EV/sprint-evaluator` | `sprint:eval` |
| FE | Avery | `eng/FE/frontend-dev` | 화면 구현, `eval-fix` |
| BE | Blake | `eng/BE/backend-architect` | API·DB 구현, `eval-fix` |
| AI | Sage | `eng/AI/openrouter-llm-specialist` | LLM 통합 |
| QA | Morgan | `qa/QA/qa-engineer` | 기능 검증 |

---

## 브랜치 규칙

```
sprint/{app}/{N}   — 스프린트 기능 브랜치 (base: main)
main               — 항상 배포 가능, 직접 push 금지
```

## 관련 문서

- git 사용 규칙: `.agent/rules/git.md`
- PR 템플릿: `docs/workflow/pr-template.md`
- git 워크플로우: `docs/workflow/sprint-git-workflow.md`
- Lessons Learned: https://github.com/dusunax/ux-lab/discussions/42
