# Tasks: 수평션(Soo Function) dev-team 페르소나 마이그레이션

- 상위 계획: [plan.md](./plan.md)
- Jira: [TD-42](https://dusunax.atlassian.net/browse/TD-42)
- 포맷: GitHub [spec-kit](https://github.com/github/spec-kit)의 `tasks.md` 관례를 일부 차용 — 태스크 ID(`T0NN`), 정확한 파일 경로, Phase 단위 그룹화. spec-kit 전체 워크플로(`/specify → /plan → /tasks → /implement`)는 가져오지 않고 tasks.md의 산출물 형식만 차용한다.
- **진행 방식: 순차.** 별도 의존성 그래프 없이 Phase 1부터 Phase 7까지 순서대로 진행한다. 실행 주체는 Claude(AI 에이전트). 단, 같은 Phase 안의 서로 다른 파일을 건드리는 태스크는 한 턴에 묶어서(병렬 도구 호출로) 처리해도 된다 — 예: Phase 3의 11개 파일, Phase 4의 wrapper 파일들.

---

## Phase 1 — Setup

- [ ] **T001** `git checkout main && git pull origin main` 후 `chore/dev-team-persona-migration` 브랜치 생성 (`.agent/rules/git.md` 기준)

## Phase 2 — Format & Workflow 기반 작업 (`.agent/rules/agent-creation.md`)

plan.md 4장(workflow 채택)·5장(Persona Format)·6장(팀 이름)·7장(이름 매핑)을 한 파일에 반영.

- [ ] **T002** Team Name 섹션을 "수산시장" → "수평션(Soo Function)"으로 교체, dev-team v2 배지(`![수평션](https://img.shields.io/badge/dev--team--v2-0EA5E9?logoColor=white)`) 추가 (plan.md 6장)
- [ ] **T003** Persona Format을 `You are [Name], a [Title] ([Abbr]).` → `You are the [Title] ([Abbr]), [Name].`로 변경, Name 규칙을 "미국식 영어 이름" → "해양동물 이름"으로 갱신 (plan.md 5장)
- [ ] **T004** Existing Agents 표에 새 이름 11개 반영 + "Stage" 컬럼 추가, plan.md 4.3장 단계 매핑대로 채움 (plan.md 4장, 7장)

## Phase 3 — Subagent 페르소나 파일 갱신 (`.agent/subagents/dev-team/**`)

각 태스크는 헤더 문장(`You are ...`)을 T003 포맷으로, 이름을 아래 표(plan.md 7장)로 교체.

- [ ] **T005** `.agent/subagents/dev-team/product/orchestrator.md` — Sam → Pilot
- [ ] **T006** `.agent/subagents/dev-team/product/prd-product-manager.md` — Jordan → Orca
- [ ] **T007** `.agent/subagents/dev-team/design/ux-design-reviewer.md` — Riley → Coral
- [ ] **T008** `.agent/subagents/dev-team/eng/backend-architect.md` — Blake → Kraken
- [ ] **T009** `.agent/subagents/dev-team/eng/frontend-dev.md` — Avery → Angelfish
- [ ] **T010** `.agent/subagents/dev-team/eng/perf-optimizer.md` — Chase → Sailfish
- [ ] **T011** `.agent/subagents/dev-team/eng/openrouter-llm-specialist.md` — Sage → Dolphin
- [ ] **T012** `.agent/subagents/dev-team/qa/code-quality-reviewer.md` — Morgan → Shark
- [ ] **T013** `.agent/subagents/dev-team/qa/qa-engineer.md` — Quinn → Octopus
- [ ] **T014** `.agent/subagents/dev-team/product/secretary.md` — Alex → Nautilus
- [ ] **T015** `.agent/subagents/dev-team/product/sprint-evaluator.md` — Nolan → Grouper

## Phase 4 — Wrapper 동기화 (`.claude/`, `.cursor/`)

grep으로 재확인된 범위(plan.md 8장 추가 항목). 팀 이름 + frontmatter description 예시 문구에 박힌 옛 이름 둘 다 처리.

- [ ] **T016** `.claude/agents/dev-team/product/orchestrator.md` + `.cursor/agents/dev-team-product-orchestrator.md` — 팀 이름 + 예시 속 "Sam" → "Pilot"
- [ ] **T017** `.claude/agents/dev-team/product/secretary.md` + `.cursor/agents/dev-team-product-secretary.md` — 팀 이름 + 예시 속 "Alex" → "Nautilus"
- [ ] **T018** `.claude/agents/dev-team/product/sprint-evaluator.md` + `.cursor/agents/dev-team-product-sprint-evaluator.md` — 팀 이름 + 예시 속 "Nolan" → "Grouper"
- [ ] **T019** `.claude/commands/sprint/{report,eval,review,start}.md` — 팀 이름 + 옛 이름 참조 갱신
- [ ] **T020** `.cursor/commands/sprint-{report,eval,review,start}.md` — 팀 이름 + 옛 이름 참조 갱신
- [ ] **T021** `README.md`, `.agent/commands/dev-team/{oc,orchestrate}.md`, `.claude/commands/dev-team/{oc,orchestrate}.md`, `.cursor/commands/dev-team-{oc,orchestrate}.md`, `docs/workflow/sprint-{workflow,git-workflow}.md` — 팀 이름 교체 (plan.md 6장 "팀 정체성 문서" 분류)

## Phase 5 — Scope / Memory 동기화

- [ ] **T022** `.agent/rules/agent-scope.md` / `agent-scope.json`에 이름 참조가 있으면 새 이름으로 동기화 (role 키는 불변이므로 대부분 영향 없을 것으로 예상 — 확인 후 필요한 곳만 수정)
- [ ] **T023** `.agent/agent-memory/{team-ABBR-role}/**` 내부 문서 중 "현재 시점" 참조로 옛 이름을 쓰는 곳이 있으면 새 이름으로 갱신 (과거 project_*.md 메모리 본문은 plan.md 6장 기준 보존 — 손대지 않음)

## Phase 6 — 산출물 재생성 & 검증

- [ ] **T024** `python3 .agent/scripts/export-hermes.py` 실행
- [ ] **T025** `.agent/hermes/generated/**`에 새 이름·팀명이 반영됐는지 확인 (grep으로 "수산시장", 옛 이름 11개 잔존 여부 재확인 — 0건이어야 함, 단 `docs/meetings/**`·과거 메모리는 예외)
- [ ] **T026** 오케스트레이터(Pilot) 경유로 11개 subagent_type 각각 샘플 라우팅 확인 — role identifier가 안 바뀌었으므로 라우팅 자체는 영향 없어야 함을 검증

## Phase 7 — PR & 보고

- [ ] **T027** PR 생성 (`.agent/rules/git.md` 커밋 메시지 형식 준수)
- [ ] **T028** TD-42에 결과 코멘트 (변경 파일 수, 검증 결과, 남은 리스크)

---

## Notes

- 체크박스는 실행 시 진행 상황 추적용. 태스크 세부 근거(이름 매핑 이유, 채택/비채택 판단)는 전부 `plan.md`에 있음 — 이 문서는 "무엇을·어디를" 중심, `plan.md`는 "왜" 중심으로 역할을 분리한다.
- T016~T020(wrapper 파일)은 이번 세션에서 grep으로 새로 발견된 범위라 `plan.md` 8장에도 추가 반영해뒀다.
- Phase는 번호 순서대로 하나씩 완료 후 다음 Phase로 넘어간다. Phase 사이에는 순서를 지키되, 같은 Phase 내 독립 파일들(예: Phase 3 T005~T015, Phase 4 T016~T021)은 한 턴에 묶어서 병렬 도구 호출로 처리해도 무방하다.
