# Tasks: 수평션(Soo Function) dev-team 페르소나 마이그레이션

- 상위 계획: [plan.md](./plan.md)
- Jira: [TD-42](https://dusunax.atlassian.net/browse/TD-42)
- 포맷: GitHub [spec-kit](https://github.com/github/spec-kit)의 `tasks.md` 관례를 일부 차용 — 태스크 ID(`T0NN`), 정확한 파일 경로, Phase 단위 그룹화. spec-kit 전체 워크플로(`/specify → /plan → /tasks → /implement`)는 가져오지 않고 tasks.md의 산출물 형식만 차용한다.
- **진행 방식: 순차.** 별도 의존성 그래프 없이 Phase 1부터 Phase 7까지 순서대로 진행한다. 실행 주체는 Claude(AI 에이전트). 단, 같은 Phase 안의 서로 다른 파일을 건드리는 태스크는 한 턴에 묶어서(병렬 도구 호출로) 처리해도 된다 — 예: Phase 3의 11개 파일, Phase 4의 wrapper 파일들.

---

## Phase 1 — Setup

- [x] **T001** `git checkout main && git pull origin main` 후 `chore/dev-team-persona-migration` 브랜치 생성 (`.agent/rules/git.md` 기준)

## Phase 2 — Format & Workflow 기반 작업 (`.agent/rules/agent-creation.md`)

plan.md 4장(workflow 채택)·5장(Persona Format)·6장(팀 이름)·7장(이름 매핑)을 한 파일에 반영.

- [x] **T002** Team Name 섹션을 "수산시장" → "수평션(Soo Function)"으로 교체, dev-team v2 배지(`![수평션](https://img.shields.io/badge/dev--team--v2-0EA5E9?logoColor=white)`) 추가 (plan.md 6장)
- [x] **T003** Persona Format을 `You are [Name], a [Title] ([Abbr]).` → `You are the [Title] ([Abbr]), [Name].`로 변경, Name 규칙을 "미국식 영어 이름" → "해양동물 이름"으로 갱신 (plan.md 5장)
- [x] **T004** Existing Agents 표에 새 이름 11개 반영 + "Stage" 컬럼 추가, plan.md 4.3장 단계 매핑대로 채움 (plan.md 4장, 7장)

## Phase 3 — Subagent 페르소나 파일 갱신 (`.agent/subagents/dev-team/**`)

각 태스크는 헤더 문장(`You are ...`)을 T003 포맷으로, 이름을 아래 표(plan.md 7장)로 교체.

- [x] **T005** `.agent/subagents/dev-team/product/orchestrator.md` — Sam → Pilot
- [x] **T006** `.agent/subagents/dev-team/product/prd-product-manager.md` — Jordan → Orca
- [x] **T007** `.agent/subagents/dev-team/design/ux-design-reviewer.md` — Riley → Coral
- [x] **T008** `.agent/subagents/dev-team/eng/backend-architect.md` — Blake → Kraken
- [x] **T009** `.agent/subagents/dev-team/eng/frontend-dev.md` — Avery → Angelfish
- [x] **T010** `.agent/subagents/dev-team/eng/perf-optimizer.md` — Chase → Sailfish
- [x] **T011** `.agent/subagents/dev-team/eng/openrouter-llm-specialist.md` — Sage → Dolphin
- [x] **T012** `.agent/subagents/dev-team/qa/code-quality-reviewer.md` — Morgan → Shark
- [x] **T013** `.agent/subagents/dev-team/qa/qa-engineer.md` — Quinn → Octopus
- [x] **T014** `.agent/subagents/dev-team/product/secretary.md` — Alex → Nautilus
- [x] **T015** `.agent/subagents/dev-team/product/sprint-evaluator.md` — Nolan → Grouper

## Phase 4 — Wrapper 동기화 (`.claude/`, `.cursor/`)

grep으로 재확인된 범위(plan.md 8장 추가 항목). 팀 이름 + frontmatter description 예시 문구에 박힌 옛 이름 둘 다 처리.

- [x] **T016** `.claude/agents/dev-team/product/orchestrator.md` + `.cursor/agents/dev-team-product-orchestrator.md` — 팀 이름 + 예시 속 "Sam" → "Pilot"
- [x] **T017** `.claude/agents/dev-team/product/secretary.md` + `.cursor/agents/dev-team-product-secretary.md` — 팀 이름 + 예시 속 "Alex" → "Nautilus"
- [x] **T018** `.claude/agents/dev-team/product/sprint-evaluator.md` + `.cursor/agents/dev-team-product-sprint-evaluator.md` — 팀 이름 + 예시 속 "Nolan" → "Grouper"
- [x] **T019** `.claude/commands/sprint/{report,eval,review,start}.md` — 팀 이름 + 옛 이름 참조 갱신
- [x] **T020** `.cursor/commands/sprint-{report,eval,review,start}.md` — 팀 이름 + 옛 이름 참조 갱신
- [x] **T021** `.agent/commands/dev-team/{oc,orchestrate}.md`, `.claude/commands/dev-team/{oc,orchestrate}.md`, `.cursor/commands/dev-team-{oc,orchestrate}.md`, `docs/workflow/sprint-{workflow,git-workflow}.md` — 팀 이름 교체. **`README.md`는 제외**: 실제 내용을 보니 앱별 "작업자" 배지가 시작일과 함께 박힌 과거 기록(전부 마이그레이션 이전 날짜)이라 회의록과 같은 성격 — 소급 개명하지 않고 보존

## Phase 5 — Scope / Memory 동기화

- [x] **T022** `.agent/rules/agent-scope.md` / `agent-scope.json`에 이름 참조가 있으면 새 이름으로 동기화 — 예상보다 참조가 많았음(전 역할 `agent` 필드 + 표/프로즈). `agent-scope.json`(SSOT)만 수정 후 `python3 .agent/scripts/gen-scope-doc.py`로 `agent-scope.md` 재생성, 손글씨 프로즈 4곳은 별도 수정
- [x] **T023** `.agent/agent-memory/{team-ABBR-role}/**` 내부 문서 중 "현재 시점" 참조로 옛 이름을 쓰는 곳이 있으면 새 이름으로 갱신 — `MEMORY.md` 자기소개 줄(Blake→Kraken, Quinn→Octopus) 갱신, `project_*.md`(mythgraph 포함) 과거 기록은 보존

## Phase 6 — 산출물 재생성 & 검증

- [x] **T024** `python3 .agent/scripts/export-hermes.py` 실행
- [x] **T025** `.agent/hermes/generated/**`에 새 이름·팀명이 반영됐는지 확인 — 1차 실행 후 grep 재검증에서 두 가지 누락 발견 및 수정:
  - `.agent/commands/sprint/{start,report,review,eval,eval-fix}.md` 소스 본문(옛 이름 다수, wrapper description만 고치고 본문을 놓쳤음)
  - `export-hermes.py`의 `TEAM = {"id": "susan-market", "name": "수산시장"}` 하드코딩 상수 — 모든 agent JSON에 박히던 근본 원인. `{"id": "soo-function", "name": "수평션"}`로 수정 후 재실행
  - 부수적으로 `.agent/scripts/gen-scope-doc.py`(agent-scope.md 재생성 스크립트)와 `.agent/docs/SPRINT-PROCESS.md`(현재 사용 중인 절차 명세), `docs/workflow/{sprint-workflow,sprint-git-workflow,pr-template}.md` 본문에서도 옛 이름 다수 발견 및 수정. `.agent/docs/IMPROVEMENT-PLAN.md`는 2026-07-12 완료된 감사 기록이라 과거 기록으로 보존
  - 최종 재검증: 0건 (preserved 범위 제외)
- [x] **T026** subagent_type 11개(`name:` frontmatter)가 전부 원래 값 그대로 유지됨을 확인 — role identifier 미변경으로 라우팅 영향 없음

## Phase 7 — PR & 보고

- [x] **T027** PR 생성 — https://github.com/dusunax/ux-lab/pull/55 (`chore/dev-team-persona-migration` → `main`)
- [x] **T028** TD-42에 결과 코멘트 등록 완료

---

## Notes

- 체크박스는 실행 시 진행 상황 추적용. 태스크 세부 근거(이름 매핑 이유, 채택/비채택 판단)는 전부 `plan.md`에 있음 — 이 문서는 "무엇을·어디를" 중심, `plan.md`는 "왜" 중심으로 역할을 분리한다.
- T016~T020(wrapper 파일)은 이번 세션에서 grep으로 새로 발견된 범위라 `plan.md` 8장에도 추가 반영해뒀다.
- Phase는 번호 순서대로 하나씩 완료 후 다음 Phase로 넘어간다. Phase 사이에는 순서를 지키되, 같은 Phase 내 독립 파일들(예: Phase 3 T005~T015, Phase 4 T016~T021)은 한 턴에 묶어서 병렬 도구 호출로 처리해도 무방하다.
