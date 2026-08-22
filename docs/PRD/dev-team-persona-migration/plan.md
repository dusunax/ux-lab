# 수평션(Soo Function) dev-team 페르소나 마이그레이션 계획

![수평션](https://img.shields.io/badge/dev--team--v2-0EA5E9?logoColor=white)

- Jira: [TD-42](https://dusunax.atlassian.net/browse/TD-42) — ux-lab 수산시장 agent 개발팀 GStack 참고 마이그레이션 및 페르소나 리네이밍
- 참조 저장소: [garrytan/gstack](https://github.com/garrytan/gstack)
- 상태: **전체 승인 완료** — 4장(workflow/철학), 6장(팀 이름), 7장(이름 매핑) 모두 확정. 이번 세션은 계획 수립까지 진행, 착수는 별도 시점에 시작.

---

## 1. 배경

`.agent/subagents/dev-team/**`의 11개 에이전트는 "미국식 영어 이름 + 정식 직함(약어)" 포맷을 쓴다 (Sam, Jordan, Riley, Blake, Avery, Chase, Sage, Morgan, Quinn, Alex, Nolan). TD-42는 이 페르소나 체계를 GStack을 참고해 수산시장 팀 테마에 맞게 재정비하는 작업이다.

GStack 구조 조사 결과, GStack은 개별 이름 없이 슬래시 커맨드 하나당 역할 타이틀 하나만 갖는 체계였다(예: `/review` → Staff Engineer). 그대로 이식할 "이름 세트"는 없었고, 참고할 만한 지점은 ① 타이틀이 정체성의 중심이 되는 명명 방식, ② workflow·철학 두 가지였다. workflow/철학 세부는 2장 참조. (구조 비교는 TD-42 코멘트 참조.)

## 2. GStack Workflow & 철학 (참고 자료)

### 2.1 Workflow — 하나의 스프린트 파이프라인

GStack README: *"gstack is a process, not a collection of tools."* 개별 스킬이 독립적으로 동작하는 게 아니라, 앞 단계 산출물을 다음 스킬이 그대로 이어받는 체인 구조다.

```
Think → Plan → Build → Review → Test → Ship → Reflect
```

- `/office-hours`(Think)가 쓴 design doc → `/plan-ceo-review`(Plan)가 읽음 → `/plan-eng-review`가 쓴 test plan → `/qa`(Test)가 픽업 → `/review`(Review)가 잡은 버그를 `/ship`(Ship)이 검증
- **산출물 체이닝**: 모든 단계가 "앞에서 뭐가 나왔는지" 알고 있어서 중간에 빠지는 게 없다는 게 핵심 주장
- **스마트 리뷰 라우팅**: "CEO는 인프라 버그 리뷰를 안 보고, backend 전용 변경엔 design review가 안 붙는다" — 변경 범위에 안 맞는 리뷰를 자동으로 스킵
- **Test everything**: `/ship`마다 커버리지 감사를 만들고, `/qa`가 버그를 고칠 때마다 회귀 테스트를 자동 생성 — 100% 테스트 커버리지가 목표
- **Continuous checkpoint mode** (opt-in): 작업 중 `WIP:` 커밋을 자동 생성해 크래시·컨텍스트 전환에도 복구 가능. `/ship` 시점에 WIP 커밋들을 필터-스쿼시해 히스토리를 깔끔하게 유지
- **병렬 스프린트 전제**: 여러 스프린트를 동시에 굴리는 것을 기본 시나리오로 설계 (design-shotgun의 taste memory, review readiness dashboard 등)

### 2.2 철학 — ETHOS.md 4원칙

GStack의 모든 워크플로 스킬 프리앰블에 자동 주입되는 원칙들 (`ETHOS.md`):

1. **Boil the Ocean** — "적당히 하지 말고 완전하게 하라." AI 코딩 시대엔 완성도를 높이는 한계비용이 거의 0에 가까워서, "이 정도면 됐다"는 지름길을 택할 이유가 사라졌다는 원칙. 테스트를 후속 PR로 미루는 것, 90%짜리 짧은 구현을 택하는 것을 반패턴으로 규정. 단, 과제와 무관한 별도 스코프(예: 수개월짜리 플랫폼 마이그레이션)는 분리해서 플래그하라고 명시.
2. **Search Before Building** — 새로 설계하기 전에 "이미 누가 풀어놓지 않았는지" 먼저 검색. 지식을 3계층(Layer 1: 검증된 정석 / Layer 2: 최신 유행 — 비판적으로 볼 것 / Layer 3: 1차 원리 추론 — 가장 가치 있음)으로 나눠, 지금 어느 계층에서 판단 중인지 자각할 것을 요구.
3. **User Sovereignty** — "AI는 추천하고, 사용자는 결정한다." 두 모델이 합의해도 사용자의 맥락(도메인 지식, 타이밍, 취향)을 이길 수 없다는 원칙 — 확신이 있어도 검증 단계를 건너뛰지 않고 항상 먼저 묻는다.
4. **Build for Yourself** — 가장 좋은 도구는 만든 사람 자신의 문제를 푸는 도구. 요청받아서가 아니라 필요해서 만든 기능이 가장 강하다는, 1인 빌더 관점의 원칙.

## 3. 확정 결정 사항

1. **GStack workflow/철학 선별 적용.** 2장에서 정리한 워크플로·ETHOS 원칙 중 장점만 골라 적용한다 (전체 스킬 카탈로그 이식 아님). 상세는 4장 참조.
2. **타이틀 우선, 이름은 유지.** GStack처럼 이름을 없애지 않는다. `You are [Name], a [Title] ([Abbr]).` → `You are the [Title] ([Abbr]), [Name].` 순서로 타이틀을 앞에 둔다. 상세는 5장 참조.
3. **팀 이름을 수산시장 → 수평션(Soo Function)으로 변경.** 상세는 6장 참조.
4. **이름은 미국식 → 해양동물 이름으로 교체.** 바다 테마에 맞춘 1:1 교체이며, role identifier(`team/ABBR/role`)와 `subagent_type`은 그대로 유지한다. 상세는 7장 참조.

## 4. GStack 채택 범위: Workflow & 철학 적용

2장에서 정리한 GStack workflow/철학 중, ux-lab(수평션) 스코프에 실제로 반영할 항목만 선별한다. GStack 전체 스킬 카탈로그(23개 커맨드)는 이식하지 않는다.

### 4.1 Workflow 채택

| 채택 항목 | GStack에서 착안 | 수평션 적용 방식 |
|---|---|---|
| 단계별 그룹 라벨 | `Think → Plan → Build → Review → Test → Ship → Reflect` | `agent-creation.md` Existing Agents 표에 "Stage" 컬럼 추가, 11개 에이전트를 아래 단계에 매핑 |
| 산출물 핸드오프 명시 | 앞 단계 문서를 다음 스킬이 그대로 읽음 (design doc → plan → build) | PM(Orca)의 PRD → TS(Nautilus)의 회의록 → EV(Grouper)의 평가, 각 단계가 참조하는 문서 경로를 표로 명시 (이미 `docs/PRD/`, `docs/meetings/`로 존재 — 명시적 매핑만 추가) |
| 스코프에 맞지 않는 리뷰 스킵 | "CEO는 인프라 버그 리뷰 안 봄" 식 스마트 라우팅 | 오케스트레이터(Pilot)가 변경 파일 범위 기준으로 불필요한 리뷰어 배정을 건너뛰는 규칙을 `orchestrator.md`에 한 줄로 명문화 |

**채택하지 않는 Workflow 항목:** 개별 슬래시 커맨드 23종 이식, Continuous checkpoint mode(WIP 자동 커밋 — ux-lab git.md의 "사용자 확인 후 커밋" 원칙과 상충), 병렬 스프린트 전제 설계(현재 스프린트 규모에 과함), 브라우저 자동화/보안감사(`/cso`, `/qa` 실브라우저) 등 ux-lab 스코프 밖 도구.

### 4.2 철학(ETHOS) 채택

| 원칙 | 채택 여부 | 적용 방식 |
|---|---|---|
| Boil the Ocean | **부분 채택** | QA(Octopus)·PERF(Sailfish) 리뷰 기준에 "일단 커버만" 대신 엣지케이스까지 완결하는 기준을 반영. 단 GStack 원칙의 예외 조항(무관한 별도 스코프는 분리)은 그대로 유지 — 스프린트 스코프를 벗어난 완결주의는 지양 |
| Search Before Building | **채택** | 오케스트레이터(Pilot)가 새 기능 요청을 라우팅하기 전에 기존 앱/패키지 구조·유사 구현 여부를 먼저 확인하는 절차를 `orchestrator.md`에 원칙으로 명문화 |
| User Sovereignty | **이미 반영됨 (변경 없음)** | `.agent/rules/git.md`·`conflict-resolution.md`가 이미 "사용자 확인 후 실행" 원칙을 갖고 있어 GStack과 방향이 일치함을 확인 — 문서 간 교차 참조만 추가 |
| Build for Yourself | **채택하지 않음** | 1인 빌더 전제 원칙이라 팀/스프린트 협업 구조인 수평션에는 직접 적용하지 않음 |

### 4.3 단계 매핑 초안

| Stage | Agent(s) |
|---|---|
| Think | Pilot (OC) |
| Plan | Orca (PM) |
| Build | Kraken (BE), Angelfish (FE), Dolphin (AI) |
| Review | Shark (QA-code), Coral (UX) |
| Test | Octopus (QA-engineer), Sailfish (PERF) |
| Ship | Pilot (OC, git 커맨드 경유) |
| Reflect | Nautilus (TS), Grouper (EV) |

## 5. Persona Format 변경

`.agent/rules/agent-creation.md` 갱신안:

```diff
- You are [Name], a [Full Job Title] ([Abbr]).
+ You are the [Full Job Title] ([Abbr]), [Name].
```

- **Name 규칙 변경:** "A common American English first name" → "수산시장 테마에 맞는 해양동물 이름 (영어 표기, 예: Pilot, Orca, Coral)"
- Personality/Expertise/Focus/Style 필드 구조는 변경하지 않는다 (내용 유지, 호출 순서만 조정).
- Existing Agents 표에 아래 7장의 매핑을 반영한다.

## 6. 팀 이름 변경: 수산시장 → 수평션 (Soo Function)

**확정.** 후보로 외해(Why hae)/먼바다(Open Sea)를 검토했으나, 최종적으로 사용자가 제안한 **수평션(Soo Function)**으로 확정했다.

- **水(수)** — 물 수(水), 바다·물 테마를 한 글자로 압축
- **Function** — 개발팀다운 이중 의미(함수/기능)이면서, 빠르게 발음하면 "수-펑션" → **수평선(水平線, horizon)**을 연상시키는 언어유희
- **표기 규칙:** 본문·문서 작성 시에는 한글 **수평션**을 기본으로 쓴다 (작성 편의성). 로고·워드마크처럼 한자 펀을 시각적으로 드러낼 필요가 있는 곳에서만 **水평션**으로 표기하고, 필요 시 본문에서도 `수평션(水)`처럼 괄호 안에 한자를 병기할 수 있다.
- 기존 "수산시장"(육지의 상업 공간 이미지)보다 바다 자체·개발팀 정체성이 동시에 드러나는 이름으로 판단

**혼선 방지 (dev-team v2 명시):** 과거 대화·메모리·회의록 등 히스토리에는 "수산시장" 표기가 계속 혼재한다. 어느 세대의 팀 이름을 가리키는지 헷갈리지 않도록, 수평션은 **dev-team v2**임을 명시적으로 표기한다.

```markdown
![수평션](https://img.shields.io/badge/dev--team--v2-0EA5E9?logoColor=white)
```

- README.md 등 팀 이름이 처음 등장하는 문서 상단에 위 배지를 추가한다.
- "수산시장"이 언급된 과거 문서(8장 "과거 기록" 분류)는 v1으로 간주하고 갱신하지 않는다 — v1/v2 구분 자체가 혼선 방지 장치이므로 과거 기록을 지우거나 덮어쓰지 않는다.

**적용 범위:** `수산시장` 문자열은 저장소 전반 56개 파일에 나타난다(grep 확인). 아래 기준으로 분류해 적용한다.

| 분류 | 처리 | 예시 |
|---|---|---|
| 팀 정체성 문서 (갱신) | 새 이름 + v2 배지로 교체 | `README.md`, `.agent/rules/agent-creation.md`, `.agent/subagents/dev-team/product/orchestrator.md`, `.agent/commands/dev-team/{oc,orchestrate}.md`, `.claude/`·`.cursor/` wrapper 동일 파일, `docs/workflow/sprint-workflow.md`, `docs/workflow/sprint-git-workflow.md` |
| 생성 산출물 (재생성) | 손으로 고치지 않고 `export-hermes.py` 재실행으로 동기화 | `.agent/hermes/generated/**` |
| 과거 기록 (보존, v1로 간주) | 갱신하지 않음 — 히스토리는 당시 이름 그대로 남긴다 | `docs/meetings/**/*.md`, `.agent/agent-memory/**/project_*.md` |

## 7. 이름 매핑 (제안 — 승인 필요)

| Role identifier | Title (Abbr) | 기존 이름 | 제안 이름 (해양동물) | 근거 |
|---|---|---|---|---|
| `product/OC/orchestrator` | Fleet Orchestrator (OC) | Sam | **Pilot** (파일럿피시) | 파일럿피시는 실제로 상어·가오리 등 대형 어류를 안내(guide)하는 습성으로 유명 — 요청 라우팅/팀원 배치 역할과 정확히 일치 |
| `product/PM/prd-product-manager` | Product Manager (PM) | Jordan | **Orca** (범고래) | 무리(pod)를 이끄는 최상위 포식자 — 우선순위·로드맵을 결정하는 전략적 리더십 이미지 |
| `design/UX/ux-design-reviewer` | UX Designer (UX) | Riley | **Coral** (산호) | 생태계의 시각적·구조적 기반을 이루는 존재 — 디자인 리뷰 역할 상징 |
| `eng/BE/backend-architect` | Backend Architect (BE) | Blake | **Kraken** (크라켄) | 심해에서 거대한 구조를 떠받치는 존재 — 겉으로 드러나지 않는 백엔드 인프라의 무게감 |
| `eng/FE/frontend-dev` | Frontend Developer (FE) | Avery | **Angelfish** (엔젤피시) | 화려하고 사용자 눈에 가장 먼저 띄는 관상어 — 프론트엔드의 "보여지는 면" 상징 |
| `eng/PERF/perf-optimizer` | Performance Engineer (PERF) | Chase | **Sailfish** (돛새치) | 해양생물 중 최고 속도(~110km/h) — 성능 최적화 상징과 정확히 부합 |
| `eng/AI/openrouter-llm-specialist` | LLM Specialist (AI) | Sage | **Dolphin** (돌고래) | 해양생물 중 지능이 가장 높은 것으로 알려짐 — AI/LLM 역할과 자연스럽게 연결 |
| `qa/QA/code-quality-reviewer` | QA Engineer (QA) | Morgan | **Shark** (상어) | 예민한 감각으로 미세한 신호를 감지 — "Code never lies" 같은 냉철한 페르소나와 어울림 |
| `qa/QA/qa-engineer` | QA Engineer (QA) | Quinn | **Octopus** (문어) | 여러 팔로 동시에 다각도를 탐색하는 문제해결형 지능 — 회귀·경계조건 테스트의 다각적 접근과 부합 |
| `product/TS/secretary` | Technical Secretary (TS) | Alex | **Nautilus** (앵무조개) | 나선형 챔버에 기록을 층층이 쌓아가는 고대종 — 회의록/기록 보관 역할 상징 |
| `product/EV/sprint-evaluator` | Sprint Evaluator (EV) | Nolan | **Grouper** (다금바리) | 매복해 신중히 관찰한 뒤 판단하는 습성 — 스프린트 평가자의 신중한 판정 이미지 |

> 동명이인 방지: QA 팀 내 Shark(코드 품질)와 Octopus(기능 QA)는 서로 다른 이름으로 구분해 기존 "Morgan/Quinn 둘 다 QA Engineer"였던 혼동을 오히려 줄인다.

## 8. 변경 대상 파일

- 팀 이름(6장 표 기준): `README.md`, `.agent/rules/agent-creation.md`, `.agent/subagents/dev-team/product/orchestrator.md`, `.agent/commands/dev-team/{oc,orchestrate}.md`, `.claude/`·`.cursor/` 동일 wrapper 파일, `docs/workflow/sprint-{workflow,git-workflow}.md`
- `.agent/subagents/dev-team/**` (11개 md — 헤더 문장, 이름 전체)
- `.agent/rules/agent-creation.md` (Persona Format, Existing Agents 표, Stage 컬럼, 팀 이름)
- `.agent/rules/agent-scope.md` / `agent-scope.json` (이름 참조가 있다면 동기화)
- `.agent/agent-memory/{team-ABBR-role}/` — 디렉터리명은 role 기준이라 영향 없음, 내부 문서 중 이름 언급 시 갱신 (과거 프로젝트 메모리 파일 본문은 6장 기준 보존)
- `.claude/agents/dev-team/**`, `.cursor/agents/dev-team-*.md` — 팀 이름뿐 아니라 frontmatter description의 예시(example) 문구에 옛 이름(Sam, Avery 등)이 박혀있음 (grep으로 재확인된 범위: orchestrator, sprint-evaluator, secretary). 실행 세부는 `tasks.md` 참조.
- `.claude/commands/sprint/{report,eval,review,start}.md`, `.cursor/commands/sprint-{report,eval,review,start}.md` — 옛 이름 참조 포함, 위와 동일 처리
- `.agent/scripts/export-hermes.py` 실행 대상: `.agent/hermes/generated/**`
- 루트 `AGENTS.md` / `CLAUDE.md` (wrapper — 이름 직접 언급 여부 확인)
- 과거 커밋 메시지·PR 본문·`docs/meetings/**`의 옛 이름(수산시장, Sam, Jordan 등)은 갱신하지 않음 (히스토리 보존)

## 9. 마이그레이션 절차

1. 본 계획 문서 사용자 최종 승인 (이름 매핑 포함)
2. 브랜치 생성 (`chore/dev-team-persona-migration`, `.agent/rules/git.md` 기준)
3. `.agent/rules/agent-creation.md` 갱신 (Persona Format + Stage 컬럼 — workflow 채택분 우선 반영)
4. 팀 이름 교체 (6장 표의 "팀 정체성 문서" 분류 파일) — `README.md` 등 상단에 dev-team v2 배지 추가
5. `.agent/subagents/dev-team/**` 11개 파일 일괄 갱신 (이름 + 포맷)
6. scope/memory 경로 및 wrapper 문서 동기화
7. `python3 .agent/scripts/export-hermes.py` 실행, `.agent/hermes/generated/**` 확인
8. 검증: 각 subagent_type이 여전히 정상 라우팅되는지 오케스트레이터 경유로 샘플 확인
9. PR 생성 → TD-42에 결과 코멘트

## 10. 리스크

- 기존 대화·메모리 파일에 남아있는 옛 이름(수산시장, Sam, Jordan 등) 참조와 새 이름이 당분간 혼재 — 히스토리는 그대로 두고 앞으로의 참조만 새 이름 사용
- 이름 교체가 문서 전반(스코프/메모리/hermes)에 걸쳐 있어 일부 갱신 누락 가능 — 8장 파일 목록 기준 grep 대조로 마무리 검증 필요
- Stage 매핑은 초안이라 실제 운영 중 배정이 달라질 수 있음 (특히 Build 단계 3개 에이전트 병렬 배정)
- 팀 이름 변경(수산시장 → 수평션)은 TD-42 원 스코프(페르소나 리네이밍) 밖 확장 — Jira에 스코프 확장 사실을 명시해야 함

## 11. Open Questions

- [x] 4장 Stage 매핑 및 철학 채택 범위 최종 승인 여부 — **승인**
- [x] 7장 이름 매핑 최종 승인 여부 — **승인**
- [x] 브랜치/PR 진행 시점 — 이번 대화까지는 계획 수립만 진행. 곧 착수 예정(별도 요청 시 9장 절차대로 진행)
