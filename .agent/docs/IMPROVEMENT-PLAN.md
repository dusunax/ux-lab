# `.agent` 개선 계획서

> 2026-07-12 `.agent` 전면 점검 결과에 따른 개선 계획.
> 점검 범위: wrapper 정합성, Cursor/Codex/Claude Code 호환성, 서브에이전트 동작, 스킬 과부족, 하드 게이트, 피그마 스킬.

## 진행 상태 (2026-07-12)

**Phase 1~5 전체 구현 완료.** `sync-agent-wrappers.py --check` clean (66/66), Hermes 재export 완료 (commands 22, skills 3, memory 9).

남은 후속 항목:
- [ ] **Vercel 토큰 회전** — `settings.local.json`에서 항목은 제거했으나 토큰 자체 폐기·재발급은 Vercel 대시보드에서 사용자가 직접 수행
- [ ] **Cursor 실기기 사후 검증** — 평탄화된 커맨드/에이전트 인식 확인 (안전 기본값 적용 완료로 블로커 아님)
- [ ] **figma-harness E2E 검증** — figma MCP 인증 후 실제 URL 1건으로 개선된 검증 루프 확인

## 배경 요약

| 영역 | 상태 | 핵심 발견 |
|------|------|-----------|
| 구조 설계 | ✅ 양호 | SSoT(`.agent/`) + thin wrapper + 훅 게이트 설계는 유지 |
| Wrapper 동기화 | ⚠️ drift | wrapper 8개 누락, description 6개 구버전, Hermes stale |
| 하드 게이트 | ⛔ 미작동 | `.active-role`을 기록하는 주체가 없어 scope 강제가 사실상 비활성 |
| Sprint 커맨드 | ⚠️ 세대 차 | 문서·레포는 `{app}` 멀티앱 스킴, 커맨드 6개는 구형 플랫 스킴 |
| 피그마 스킬 | ⛔ 결함 | `/figma-harness` 검증 루프가 비교 대상 없이 실행되는 구조 |
| 보안 | ⚠️ 주의 | `settings.local.json`에 Vercel 토큰 평문 (git 미추적) |

## 원칙

1. `.agent/`가 단일 진실 공급원(SSoT)이라는 현행 구조는 유지한다. wrapper는 손으로 고치지 않고 `sync-agent-wrappers.py`로만 갱신한다.
2. 문서(프롬프트)로만 존재하는 규칙과 훅으로 강제되는 규칙을 구분해 명시한다. 훅 게이트는 Claude Code 전용임을 문서화한다.
3. OQ(미결 사항)가 열려 있는 항목은 확정 전에 구현하지 않는다.

---

## Phase 1 — 동기화 복구 (즉시, OQ 없음)

**목표:** 스크립트 재실행만으로 해소되는 drift 제거.

| # | 작업 | 대상 | 완료 기준 |
|---|------|------|-----------|
| 1-1 | `python3 .agent/scripts/sync-agent-wrappers.py` 실행 | `.claude/commands/`, `.cursor/commands/` | 누락 8개 생성(`sprint/merge` ×2, `.cursor` git 6종), STALE 6개 갱신. 특히 `git/ship` description에서 merge 문구 제거 확인 |
| 1-2 | `python3 .agent/scripts/export-hermes.py` 실행 | `.agent/hermes/generated/` | manifest `counts.commands` 15 → 22 |
| 1-3 | `sync-agent-wrappers.py`에 `--check` 모드 추가 | `.agent/scripts/` | 쓰기 없이 MISSING/STALE/OK 목록과 non-zero exit 반환. 이후 훅 또는 CI에서 drift 차단 가능 |
| 1-4 | `git.md:74`·`sync.md` 커밋 서명의 모델명 하드코딩(`Claude Sonnet 4.6`) 제거 | `.agent/rules/git.md`, `.agent/commands/sprint/sync.md` | 모델 비의존 표기로 교체 |

**리스크:** 없음. 전부 생성물/문구 갱신.

---

## Phase 2 — 하드 게이트 실효화 (핵심, OQ-A·B 일부 의존)

**목표:** scope-enforcer가 실제로 작동하는 상태 만들기.

| # | 작업 | 대상 | 완료 기준 |
|---|------|------|-----------|
| 2-1 | 서브에이전트를 소환하는 모든 커맨드 하네스에 `.active-role` 기록/정리 스텝 추가 | `commands/dev-team/orchestrate.md`, `oc.md`, `sprint/start.md`, `sprint/eval.md` (소환 지점 전수) | 소환 직전 `echo '[역할]' > .claude/.active-role`, 완료 직후 `rm -f` 지시가 하네스(메인 세션이 실행하는 문서)에 존재. orchestrator.md의 동일 지시는 "메인 세션이 수행"으로 역할 명확화 |
| 2-2 | stale `.active-role` 방어 | `.claude/settings.json` 또는 하네스 | SubagentStop(또는 Stop) 훅으로 잔존 파일 삭제, 혹은 하네스에 정리 스텝 의무화. 메인 세션이 stale 파일로 차단되는 시나리오 제거 |
| 2-3 | 각 역할의 자기 메모리 디렉터리 쓰기 허용 | `.agent/rules/agent-scope.json` | FE/BE/PERF/AI/QA/UX allow에 `.agent/agent-memory/{자기 디렉터리}/**` 추가 (readonly 역할은 메모리 경로만 예외). "메모리 업데이트 지시 ↔ deny `.agent/**` 하드 차단" 모순 해소 |
| 2-4 | readonly 역할 tools 차등 적용 | `.agent/subagents/.../qa-engineer.md`, `ux-design-reviewer.md`, `code-quality-reviewer.md` (frontmatter) | OQ-B 결정 반영: Riley는 Bash 제외 화이트리스트, Quinn은 Bash 유지·Write/Edit 미부여, Morgan에 Grep/Glob/Bash 추가. `memory:` 지시어가 Write/Edit을 되살린다는 사실을 agent-creation.md에 명시 |
| 2-5 | Vercel 토큰 회전 | `.claude/settings.local.json:65` | 토큰 폐기·재발급 후 해당 allow 항목 삭제. env 참조 방식으로 교체 |
| 2-6 | Bash 우회 경로 축소 | `.claude/settings.local.json`, `scope-enforcer.py` | OQ-A 결정 반영: enforcer에 Bash 쓰기 패턴 소프트 경고 추가, `Bash(zsh *)` 제거·`Bash(python3:*)` 경로 한정 |
| 2-7 | 문서 현행화 | `gen-scope-doc.py` 템플릿, `AGENT.md` | agent-scope.md의 "경고 후 계속 진행"(OQ-1 구버전) 문구를 실제 동작(deny/readonly는 exit 2 하드 차단)으로 수정. AGENT.md에 "훅 게이트는 Claude Code 전용, Cursor/Codex는 프롬프트 제약만" 명시 |

**의존성:** 없음 — OQ-A·B 확정(2026-07-12)으로 전 항목 착수 가능.

---

## Phase 3 — Sprint 커맨드 멀티앱 스킴 갱신

**목표:** 커맨드가 문서(SPRINT-PROCESS.md)·실제 레포 구조(`sprint/{app}/{N}`, `docs/meetings/{app}/`)와 일치.

| # | 작업 | 대상 | 완료 기준 |
|---|------|------|-----------|
| 3-1 | 공통 sprint-context 수집 절차를 단일 문서로 추출 | 신규 `.agent/skills/SPRINT-CONTEXT.md` (또는 공유 스크립트) | 앱 추론 → `docs/meetings/{app}/` kickoff 탐색 → `sprint/{app}/{N}`에서 N 추출을 한곳에 정의 |
| 3-2 | 커맨드 6개가 3-1을 참조하도록 갱신 | `sprint/start.md`, `review.md`, `sync.md`, `eval.md`, `eval-fix.md`, `report.md` | `start.md`의 플랫 스캔(`ls docs/meetings/`)·`sprint/[N]` 브랜치 생성, `review.md`의 `sprint-N-report-*.html` glob 등 구형 패턴 제거. 현재 브랜치(`sprint/one-moon-date/1`) 기준으로 각 커맨드의 N·앱 추론이 성공해야 함 |
| 3-3 | SPRINT-PROCESS.md 소소한 정정 | `.agent/docs/SPRINT-PROCESS.md` | §7 주체 역할 명시, 역할 테이블에 UX·OC 추가, QA subagent_type 오매핑(Morgan↔Quinn) 수정 |
| 3-4 | 메모리 커밋 경로 통일 | `review.md`, `merge.md`, `SPRINT-PROCESS.md`, `.claude/agent-memory/` | OQ-C 결정 반영: `.claude/agent-memory/`의 2개 디렉터리를 `.agent/agent-memory/`로 이동·병합, 커밋 경로 문구 수정 |

---

## Phase 4 — 피그마 스킬 개선

**목표:** 검증 루프가 실제로 성립하고, 4개 커맨드의 중복을 제거.

| # | 작업 | 대상 | 완료 기준 |
|---|------|------|-----------|
| 4-1 | 공통 코어 추출 | 신규 `.agent/skills/FIGMA_HARNESS_CORE.md` | URL 파싱, 인증, 에셋 다운로드, 버저닝, 타입 체크, 검증 절차, 보고 포맷을 코어로 이동. 4개 커맨드는 모드 차이(단일/전체/스냅샷/쇼케이스, 허용 오차, 등록 여부)만 기술 |
| 4-2 | 검증 루프 성립시키기 | `figma-harness.md` (코어에 반영) | 비-showcase 모드에서 검증 전 컴포넌트를 임시 마운트(쇼케이스 임시 등록 후 롤백) 또는 `apps/figma-harness/app/preview/[name]/page.tsx` 동적 프리뷰 라우트 신설. "생성만 하고 전체 페이지를 캡처"하는 현행 절차 폐기 |
| 4-3 | element 단위 스크린샷으로 전환 | 코어 검증 절차 | `npx playwright@latest screenshot`(전체 페이지, 매회 다운로드) 대신 Playwright MCP `browser_take_screenshot`으로 해당 컴포넌트 요소만 캡처 |
| 4-4 | dev 서버 기동 안정화 | 코어 준비 절차 | `next dev -p {고정포트}` + curl 헬스체크 루프(`sleep 3` 제거), 검증 종료 시 서버 정리 스텝. 포트 밀림으로 엉뚱한 앱을 캡처하는 시나리오 제거 |
| 4-5 | 품질 연결 | 코어 | `FRONTEND_DESIGN.md` 참조 지시 추가(고아 스킬 해소), 실패 시 `--json` 에러 스키마 정의, 스크린샷 임시 파일은 `/tmp` 대신 세션 scratchpad 사용 |
| 4-6 | 검증 실행 전제 문서화 | 코어 Step 0 | figma MCP 미인증 시 인터랙티브 세션에서 선행 인증 필요함을 명시 |

**검증 계획:** 개선 후 실제 Figma URL 1건으로 `/figma-harness` E2E 실행 — 컴포넌트가 화면에 렌더되고, element 스크린샷 대조가 3회 수행되는지 확인.

---

## Phase 5 — 에이전트 프롬프트 정리

| # | 작업 | 대상 | 완료 기준 |
|---|------|------|-----------|
| 5-1 | Morgan/Quinn 역할 경계 재정의 | `code-quality-reviewer.md`, `qa-engineer.md` | Morgan=정적 코드 리뷰, Quinn=기능 테스트·회귀·경계조건으로 분리. Quinn의 성능(§3)·Usability(§6) 섹션은 "Chase/Riley 영역 발견 시 위임 보고"로 축소 |
| 5-2 | 코딩 표준 5중 복붙 해소 | FE/BE/AI/QA×2 프롬프트 | 표준 전문을 삭제하고 `.agent/rules/coding-style.md`·`performance.md` 참조 지시로 교체 |
| 5-3 | 규칙 우선순위 완성 | `AGENT.md:30` | `security > git > agent-scope > conflict-resolution > performance > coding-style > skills` 등 전체 rules를 포함한 순서로 갱신 |
| 5-4 | agent-memory 디렉터리 네이밍 정리 | `.agent/agent-memory/` | `ux-design-reviewer` → `design-UX-ux-design-reviewer`, `eng-perf-optimizer` → `eng-PERF-perf-optimizer` (참조하는 프롬프트 경로 동시 수정) |
| 5-5 | 죽은 파일 정리 | `.claude/codex.md` | 삭제 (Codex는 루트 `AGENTS.md`를 읽음). eval 폴백 정책(`gh pr comment` vs MCP) 하네스·프롬프트 일치화 |

---

## OQ 결정 사항 (2026-07-12 확정)

### OQ-A: Bash 우회 게이트 → **(b) 중심 + (a) 소프트 경고** ✅

- scope-enforcer에 Bash 검사를 추가하되 **소프트 경고(stderr)로 시작**한다. 쓰기 패턴(`>`, `>>`, `sed -i`, `tee`, `rm`, `mv`)이 deny 경로를 향할 때만 경고. `.active-role` 설정 시에만 동작하므로 영향 범위는 서브에이전트 실행 중으로 한정된다.
- 하드 차단(exit 2)은 보류 — heredoc·따옴표·변수 치환 때문에 Bash 명령의 쓰기 대상 판정은 오탐이 불가피하고, 오탐 하드 차단은 정상 작업을 깨뜨린다.
- `settings.local.json`의 광범위 allow는 축소: `Bash(zsh *)` 제거, `Bash(python3:*)`는 `.agent/scripts/` 경로 한정으로 교체.
- **근거:** 이 게이트의 성격은 보안 경계가 아니라 협조적 에이전트용 가드레일이다. 결정적(deterministic) 차단은 tools 제한(OQ-B)이 담당하고, Bash는 가시성 확보로 충분하다.

### OQ-B: readonly 역할 tools 제한 → **역할별 차등 적용** ✅

| 에이전트 | tools 조치 | 이유 |
|----------|-----------|------|
| Riley (UX) | Bash 제외 화이트리스트: `Read, Grep, Glob, WebFetch, WebSearch` | 순수 리뷰 역할 — 프롬프트 전수 확인 결과 Bash(실행) 의존이 없음 |
| Quinn (QA) | **Bash 유지**, Write/Edit만 미부여 | 기능 테스트 실행(vitest·build)이 역할의 핵심이라 Bash 제거 불가 |
| Morgan (QA) | 현 화이트리스트에 `Grep, Glob, Bash` **추가** | `git diff` 없이는 "최근 변경 코드 리뷰" 자체가 불가능한 현행 결함 수정 |

- 공통: 세 에이전트 모두 memory 지시가 있어 `memory:` 지시어가 Write/Edit을 되살린다. 이를 막지 않고 **scope-enforcer의 readonly 분기에 "자기 `agent-memory` 디렉터리만 쓰기 허용" 예외를 추가**한다(Phase 2-3과 통합 구현). 메모리 축적 기능과 readonly 정책이 공존하게 된다.
- **근거:** 일률적 화이트리스트(a)는 Quinn의 테스트 실행을 막고, Bash만 제외(b)는 Morgan의 결함을 방치한다. 역할이 요구하는 최소 권한이 서로 다르므로 차등이 맞다.

### OQ-C: agent-memory 단일화 → **(a) `.agent/agent-memory/`로 통일** ✅

- `.claude/agent-memory/`의 2개 디렉터리(`feedback/`, `product-PM-prd-product-manager/`)를 `.agent/agent-memory/`로 이동·병합하고, `review.md`·`merge.md`·`SPRINT-PROCESS.md`의 커밋 경로를 `.agent/agent-memory/`로 수정한다.
- **근거:** ① SSoT 원칙 — AGENT.md와 서브에이전트 프롬프트가 이미 전부 `.agent/agent-memory/`를 가리킨다. ② 현재 8/10 디렉터리가 이미 `.agent`에 있어 마이그레이션 비용이 최소인 방향이다. ③ `.claude/`는 Claude Code 전용 wrapper 공간인데, 메모리는 Cursor/Codex 에이전트도 읽어야 하는 도구 중립 자산이다.

### OQ-D: Cursor 실기기 확인 → **블로커에서 해제, 안전 기본값 선제 적용** ✅

- 실기기 확인을 기다리지 않고 `sync-agent-wrappers.py`의 `.cursor` 출력을 안전한 형태로 변경한다:
  1. `model: sonnet`/`opus` 별칭 → `inherit`로 치환 (Cursor 모델 체계와 무관하게 안전)
  2. 중첩 디렉터리를 평탄 파일명으로 생성: `sprint/eval.md` → `sprint-eval.md`, `git/up.md` → `git-up.md`, `dev-team/product/orchestrator.md` → `dev-team-product-orchestrator.md`. 기존 중첩 파일은 제거.
- 실기기 확인은 사후 검증으로 격하 — 중첩이 정상 인식되는 환경에서도 평탄 구조는 동작하므로 되돌릴 필요가 없다.
- **근거:** 두 안전 기본값 모두 "불확실한 환경에서도 동작"을 보장하며 비용이 낮다. 확인을 블로커로 두면 Phase 1·2가 실기기 접근 시점에 묶인다.

## 실행 순서 제안

```
Phase 1 (즉시) ──▶ Phase 2 (전 항목 착수 가능)
                     │
                     ├─▶ Phase 3 (전 항목 착수 가능)
                     ├─▶ Phase 4 (독립, 병행 가능)
                     └─▶ Phase 5 (독립, 병행 가능)
```

> OQ 4건은 2026-07-12에 모두 확정됨 — 상세 근거는 "OQ 결정 사항" 섹션 참조. Cursor 실기기 확인(구 OQ-D)만 사후 검증 항목으로 남는다.

완료 검증: 각 Phase 종료 시 `sync-agent-wrappers.py --check`(1-3 이후) 통과 + 해당 커맨드 1회 실기 실행으로 확인한다.
