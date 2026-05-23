---
description: 스프린트 평가. Nolan(EV)이 운영/마케팅/비즈니스 관점에서 PR diff를 분석하고 코멘트를 작성한다.
---

# /sprint:eval 하네스

**인수:** $ARGUMENTS

**평가자:** Nolan (EV) — `product/EV/sprint-evaluator`
**사양 문서:** `docs/process/sprint-git-workflow.md`

---

## Step 0 — 인수 파싱

| 패턴 | 동작 |
|------|------|
| (없음) | 현재 브랜치 또는 최신 kickoff에서 N 추론 |
| `--sprint N` | 지정 N 사용 |
| `--pr NUMBER` | 지정 PR 번호 사용 |
| `--focus ops\|marketing\|business\|all` | 평가 관점 한정 (기본: all) |

---

## Step 1 — 컨텍스트 수집

```bash
git diff main...sprint/N --stat
git log --oneline sprint/N ^main
```

수집 항목:
- 변경 파일 목록 및 diff 요약
- 스프린트 번호 / 목표 (kickoff 파일, 있으면)
- 완료 항목 / 이월 항목 (kickoff 파일, 있으면)
- 주요 결정 사항 (kickoff 파일, 있으면)
- GA4 / 피드백 데이터 (미연결 시 "데이터 미수집"으로 명시)

> kickoff 파일이 없거나 관련 없으면 PR diff만으로 평가한다. 추정하지 않는다.

---

## Step 2 — Nolan(EV) 소환

`product/EV/sprint-evaluator` 에이전트를 소환한다.

전달 프롬프트:
```
Sprint [N] PR을 평가해줘.

[컨텍스트: PR diff 요약]
[컨텍스트: 완료/이월 항목, 있으면]
[컨텍스트: 주요 결정 사항, 있으면]
[컨텍스트: GA4/피드백 데이터, 있으면]
평가 관점: [--focus 값]

에이전트 파일의 출력 형식을 그대로 따를 것.
```

---

## Step 3 — PR 코멘트 등록

Nolan의 평가 결과를 PR에 코멘트로 등록한다.

- GitHub MCP(`mcp__github__add_issue_comment`) 우선 시도
- 미연결 시: `gh pr comment [NUMBER] --body "..."` 로 폴백
- 둘 다 불가 시: 터미널에 출력하고 수동 등록 안내

---

## Step 4 — 완료 보고

```
📊 Sprint N 평가 완료

평가자:   Nolan (EV)
PR:       [URL]
관점:     [ops / marketing / business / all]
코멘트:   [URL]
```
