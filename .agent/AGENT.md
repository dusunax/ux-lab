# Agent Configuration

> **모든 AI 에이전트는 작업 시작 전 이 파일과 하위 rules를 반드시 읽어야 합니다.**
> Every AI agent (Codex, Claude Code, Cursor 등)은 작업 전에 이 파일을 읽습니다.

이 디렉터리(`.agent/`)는 에이전트 설정의 **단일 진실 공급원(Single Source of Truth)**입니다.
`.claude/`, `.cursor/`, 루트의 `AGENTS.md`와 `CLAUDE.md`는 모두 이 파일을 가리키는 thin wrapper입니다.

---

## 이 레포지토리

`ux-lab`은 여러 실험 앱과 문서, 하네스를 관리하는 pnpm 기반 모노레포입니다.
기능 구현은 기존 앱/패키지 구조를 우선하고, 앱별 README와 `docs/meetings/`의 스프린트 문서를 함께 확인합니다.

---

## 필수 Rules 읽기 순서

| 순서 | 파일 | 내용 |
|------|------|------|
| 1 | [rules/security.md](rules/security.md) | 보안 규칙, 비밀값, 입력 검증 |
| 2 | [rules/performance.md](rules/performance.md) | React/Next.js 성능, 이미지, 데이터 패칭, 번들 |
| 3 | [rules/coding-style.md](rules/coding-style.md) | 코딩 스타일, 파일/함수 크기, 구조 규칙 |
| 4 | [rules/conflict-resolution.md](rules/conflict-resolution.md) | 충돌 발생 시 설명, 계획, 검증 절차 |
| 5 | [rules/agent-scope.md](rules/agent-scope.md) | 에이전트별 파일 소유권과 작업 범위 |
| 6 | [rules/agent-creation.md](rules/agent-creation.md) | 새 에이전트 생성 규칙 |

규칙 충돌 시 `security` > `performance` > `coding-style` > `skills` 순서로 적용합니다.

---

## Codex 적용 원칙

- `features` 폴더 기준으로 기능 단위를 확인합니다.
- 가능하면 한 기능 단위는 한곳에 모아두고 분리를 지양합니다.
- 빌드, 실행, 파일 삭제 등은 사용자가 명시하거나 요청했을 때만 수행합니다.
- 모순되는 지시가 있으면 사용자 요청의 동작 목표를 우선하고 내부 규칙은 보조로 적용합니다.
- 로직에 중요한 변경이 생기면 기존 markdown 문서를 즉시 최신 상태로 갱신합니다.

---

## Claude Code 자동 기록 규칙

대화 중 아래 상황에서는 `/notion-daily --log "내용"`을 사용해 기록합니다.

| 상황 | 예시 |
|------|------|
| 아키텍처/구조 결정 | 컴포넌트 분리 방식, 상태 관리 선택, API 설계 방향 |
| 버그 원인 파악 | 재현 조건, 근본 원인, 임시 해결책 |
| 기술적 트레이드오프 발견 | A vs B 비교, 성능/유지보수 충돌 |
| 중요한 제약 발견 | 라이브러리 한계, 브라우저 호환성, 빌드 제약 |
| 작업 맥락 전환 | 현재 작업을 마치고 다른 작업으로 넘어갈 때 |

기록 형식은 한 줄 요약입니다.

```text
[주제] 핵심 내용
```

새로운 주요 작업을 시작하거나 맥락이 바뀔 때는 `/notion-daily --update "내용"`도 함께 사용합니다.

---

## 앱별 예외

### apps/ai-empathy-diary

이 앱은 빌드 도구 없는 싱글 HTML 파일 구조로 의도적으로 설계됐습니다.
Vite 등의 빌드 환경 도입은 Sprint 5 기준으로 보류 상태이며, TypeScript 마이그레이션 필요 또는 기여자 2인 이상이 되는 시점에 재검토합니다.

- `coding-style.md`의 파일 크기 규칙(최대 800줄)은 이 앱에 적용하지 않습니다.
- `index.html`은 싱글 파일 아키텍처의 결과물이며, 줄 수 초과가 규칙 위반이 아닙니다.

근거: 2026-05-20 Sprint 5 회의 결정. 참조: `docs/meetings/2026-05-20-sprint-5.md` 안건 1.

---

## 사용 가능한 Commands

반복 작업은 아래 command를 호출합니다.

> Cursor: `.cursor/commands/`의 slash command wrapper로 호출합니다.
> Claude Code: `.claude/commands/`의 slash command wrapper로 호출합니다.
> Codex: 해당 `.agent/commands/{name}.md`를 읽고 따릅니다.

| Command | 설명 |
|---------|------|
| [commands/code-review.md](commands/code-review.md) | 커밋 전 코드 품질 및 보안 검토 |
| [commands/refactor-clean.md](commands/refactor-clean.md) | 미사용 코드 탐지 및 안전 제거 |
| [commands/notion-daily.md](commands/notion-daily.md) | 오늘자 노션 기록 페이지 생성/업데이트 |
| [commands/dev-team/orchestrate.md](commands/dev-team/orchestrate.md) | 요청 분석 후 적합한 서브에이전트 라우팅 |
| [commands/dev-team/oc.md](commands/dev-team/oc.md) | `/orchestrate` 축약 별칭 |
| [commands/sprint/start.md](commands/sprint/start.md) | 스프린트 시작 의식 및 킥오프 문서 생성 |
| [commands/sprint/review.md](commands/sprint/review.md) | 스프린트 완료 후 PR 생성과 결과 요약 |
| [commands/sprint/sync.md](commands/sprint/sync.md) | 스프린트 상태를 docs, git, PR에 동기화 |
| [commands/sprint/eval.md](commands/sprint/eval.md) | 스프린트 PR 평가 |
| [commands/sprint/eval-fix.md](commands/sprint/eval-fix.md) | eval 지적 사항 처리 결과 PR 댓글 등록 |
| [commands/sprint/report.md](commands/sprint/report.md) | 회의록 기반 HTML 보고서 생성 |
| [commands/figma-harness.md](commands/figma-harness.md) | Figma 단일 노드 구현 |
| [commands/figma-harness-all.md](commands/figma-harness-all.md) | Figma 페이지 전체 구현 |
| [commands/figma-harness-snapshots.md](commands/figma-harness-snapshots.md) | Figma 스냅샷 형식 구현 |
| [commands/figma-harness-showcase.md](commands/figma-harness-showcase.md) | Figma 구현 후 showcase 등록 |

---

## Subagents

| Agent | 역할 | Task subagent_type |
|-------|------|--------------------|
| [subagents/dev-team/product/orchestrator.md](subagents/dev-team/product/orchestrator.md) | 요청 라우팅, 팀원 선택, 컨텍스트 브리프 작성 | `product/OC/orchestrator` |
| [subagents/dev-team/product/prd-product-manager.md](subagents/dev-team/product/prd-product-manager.md) | PRD, 일정, 우선순위, 스프린트 계획 | `product/PM/prd-product-manager` |
| [subagents/dev-team/product/secretary.md](subagents/dev-team/product/secretary.md) | 회의록, 기술 결정, 스프린트 기록 | `product/TS/secretary` |
| [subagents/dev-team/product/sprint-evaluator.md](subagents/dev-team/product/sprint-evaluator.md) | 스프린트 PR 평가 | `product/EV/sprint-evaluator` |
| [subagents/dev-team/design/ux-design-reviewer.md](subagents/dev-team/design/ux-design-reviewer.md) | UX 리뷰와 개선 제안 | `design/UX/ux-design-reviewer` |
| [subagents/dev-team/eng/frontend-dev.md](subagents/dev-team/eng/frontend-dev.md) | 프론트엔드 UI, 접근성, 성능 | `eng/FE/frontend-dev` |
| [subagents/dev-team/eng/backend-architect.md](subagents/dev-team/eng/backend-architect.md) | 서버 아키텍처, API, 보안 | `eng/BE/backend-architect` |
| [subagents/dev-team/eng/openrouter-llm-specialist.md](subagents/dev-team/eng/openrouter-llm-specialist.md) | OpenRouter/LLM 통합과 프롬프트 | `eng/AI/openrouter-llm-specialist` |
| [subagents/dev-team/eng/perf-optimizer.md](subagents/dev-team/eng/perf-optimizer.md) | 성능 병목 분석과 최적화 | `eng/PERF/perf-optimizer` |
| [subagents/dev-team/qa/code-quality-reviewer.md](subagents/dev-team/qa/code-quality-reviewer.md) | 코드 품질 리뷰 | `qa/QA/code-quality-reviewer` |
| [subagents/dev-team/qa/qa-engineer.md](subagents/dev-team/qa/qa-engineer.md) | 기능 QA, 회귀, 경계 조건 검증 | `qa/QA/qa-engineer` |

---

## Skills

| Skill | 설명 | 진입점 |
|-------|------|--------|
| frontend-design | 프론트엔드 경험, 레이아웃, 시각 품질 지침 | [skills/FRONTEND_DESIGN.md](skills/FRONTEND_DESIGN.md) |

---

## Scripts

| 파일 | 사용처 |
|------|--------|
| [scripts/scope-enforcer.py](scripts/scope-enforcer.py) | Claude `PreToolUse` hook, 에이전트 파일 범위 제한 |
| [scripts/gen-scope-doc.py](scripts/gen-scope-doc.py) | Claude `PostToolUse` hook, scope 문서 생성 |
| [scripts/sync-agent-wrappers.py](scripts/sync-agent-wrappers.py) | `.agent` 원본 frontmatter를 Claude/Cursor wrapper에 동기화 |

---

## Agent Memory

에이전트별 장기 메모리는 [agent-memory/](agent-memory/)에 있습니다.
새 메모리 파일은 기존 에이전트별 디렉터리 구조를 유지해서 추가합니다.
