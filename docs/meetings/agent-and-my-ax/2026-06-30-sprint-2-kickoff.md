# Sprint 2 킥오프 회의록 — agent-and-my-ax

**날짜:** 2026-06-30  
**참석자:** PM Jordan, FE Avery, BE Blake, QA Morgan, QA Quinn, TS Alex, UX Riley  
**진행자:** PM Jordan

---

## Sprint 2 목표

> **Agent를 부탁해를 mock 탐색 앱에서 작성자 등록·요청·프로필까지 이어지는 운영 가능한 Agent Hub로 확장한다.**

---

## 이전 스프린트 완료 검증

Sprint 1 수용 기준과 액션 아이템 기준 완료율은 40/40개, 100%다. `/sprint:eval`에서 지적된 PR 범위 오염은 `f14324e`에서 정리됐고, PR #43은 main에 병합 완료됐다.

---

## 결정 사항 요약

| # | 결정 내용 | 담당 |
|---|-----------|------|
| D-1 | Sprint 2의 중심은 Create Agent, Profile, Request Board로 한다 | PM Jordan |
| D-2 | 실제 Firebase 키 없이도 개발 가능하도록 repository interface + mock adapter를 먼저 구현한다 | BE Blake |
| D-3 | Firestore 전환을 위해 users, agents, comments, interactions, requests 컬렉션 계약을 문서와 타입으로 고정한다 | BE Blake |
| D-4 | Google Workspace SSO는 Sprint 2에서 UI/auth shell과 current user provider까지만 구현하고 실제 OAuth 배포는 환경변수 준비 후 연결한다 | BE Blake |
| D-5 | Agent 등록 폼에는 Platform, Usage Guide, Visibility, resultPreset, downloads 생성을 P0 필드로 포함한다 | FE Avery |
| D-6 | Request Board는 사용자가 필요한 Agent를 요청하고 투표/상태를 확인하는 운영 채널로 정의한다 | PM Jordan |
| D-7 | Profile은 작성 Agent, 써봤어요, 좋아요, Fork 활동을 한 화면에서 확인하는 실명제 기반 화면으로 정의한다 | UX Riley |
| D-8 | Sprint 2는 관리자 페이지, Badge 자동 발급, 외부 Slack/Chat 연동을 제외한다 | PM Jordan |
| D-9 | Sprint 2는 Firebase production 연결 없이 repository adapter와 mock persistence를 완성하고, Firestore 연결은 Sprint 3로 이월한다 | BE Blake |
| D-10 | resultPreset은 Prompt에서 자동 생성되는 기본값을 제공하되, 작성자가 제목/CTA/샘플 출력으로 조정할 수 있게 한다 | PM Jordan |
| D-11 | Request Board 요청은 전체 공개만 허용하고, 팀 공개 요청은 운영 정책 확정 후 추가한다 | PM Jordan |
| D-12 | Profile 기본 진입점은 `/me`, 공유 가능한 공개 URL은 `/profile/[userId]`로 둔다 | UX Riley |
| D-13 | Fork 생성은 Sprint 2 P1로 유지하고, Create Agent의 필수 플로우로 승격하지 않는다 | PM Jordan |

---

## Sprint 2 확정 스코프

### P0 — 완료 목표

| # | 항목 | 상태 | 담당 |
|---|------|------|------|
| 1 | repository interface 정의: agent, user, request, interaction read/write 계약 | ☑ | BE Blake |
| 2 | mock repository adapter 구현: 현재 seed 데이터 기반 create/update/read 동작 | ☑ | BE Blake |
| 3 | Firestore 전환 문서 작성: 컬렉션, document shape, index 후보, 보안 규칙 초안 | ☑ | BE Blake |
| 4 | Auth shell 구현: current user provider, Google Workspace SSO placeholder, 로그인 필요 상태 | ☑ | BE Blake |
| 5 | Create Agent 라우트 구현: `/agent/new` 등록 폼과 미리보기 | ☑ | FE Avery |
| 6 | Agent 등록 API 구현: `POST /api/agents`와 validation error 응답 | ☑ | BE Blake |
| 7 | 등록 필드 반영: Platform, Usage Guide, Visibility, Prompt, resultPreset, downloads | ☑ | FE Avery |
| 8 | 등록 완료 후 Feed 반영과 Detail 이동 플로우 구현 | ☑ | FE Avery |
| 9 | Profile 라우트 구현: `/profile/[userId]` 또는 `/me`에서 작성/활동 요약 표시 | ☑ | FE Avery |
| 10 | Request Board 라우트 구현: `/requests` 목록, 요청 생성, 투표, 상태 badge | ☑ | FE Avery |
| 11 | comments/likes/tried/fork 상태를 repository action 경유로 정리 | ☑ | BE Blake |
| 12 | 빈 상태, 검색 결과 없음, API validation 실패, 로그인 필요 상태 UX 구현 | ☐ | QA Quinn |
| 13 | 핵심 플로우 QA: Create → Feed → Detail → Run → Tried → Profile → Requests | ☑ | QA Morgan |
| 14 | 모바일 390px와 데스크톱 1280px에서 Create/Profile/Requests overflow 확인 | ☑ | QA Morgan |

### P1 — 시간 여유 시

| # | 항목 | 담당 |
|---|------|------|
| 15 | Fork 생성 폼과 parentAgentId/forkedFromVersion 표시 | FE Avery |
| 16 | Request Board에서 요청을 Agent 등록 초안으로 변환하는 CTA | FE Avery |
| 17 | ranking 산식 상세 툴팁과 월간 필터 상태 고도화 | UX Riley |
| 18 | Firestore emulator 연결 PoC | BE Blake |

### 제외 (Sprint 3 이후 이월)

| 항목 | 이연 사유 |
|------|-----------|
| 실제 Firebase Auth 배포 연결 | Google Workspace OAuth client와 배포 환경변수 준비 필요 |
| 실제 Firestore production write | 보안 규칙, 권한 모델, migration seed 검증 필요 |
| 관리자 페이지 | 운영 정책 확정 전 MVP 제외 |
| Badge 자동 발급 | 랭킹 산식의 실제 데이터 검증 후 진행 |
| Slack / Google Chat / Gen.AI 연동 | 외부 실행 권한과 API 승인 필요 |
| AI 추천 | 활동 데이터 수집 이후 추천 품질 검증 가능 |

---

## 수용 기준 (Acceptance Criteria)

- [x] `/agent/new`에서 새 Agent를 작성하고 제출할 수 있다
- [x] 등록 폼에서 Platform, Usage Guide, Visibility, Prompt, resultPreset, downloads 필드를 입력하거나 생성할 수 있다
- [x] `POST /api/agents`가 유효한 Agent payload를 받아 mock repository에 저장한다
- [x] 등록 완료 후 Home Feed에 새 Agent가 표시되고 Detail 화면으로 이동할 수 있다
- [x] 생성된 Agent의 Detail과 Run 화면에서 작성자 결과 프리셋과 다운로드 파일이 기존 UI로 표시된다
- [x] `/profile/[userId]` 또는 `/me`에서 작성 Agent, 써봤어요, 좋아요, Fork 활동 요약을 볼 수 있다
- [x] `/requests`에서 Agent 요청 목록을 보고 새 요청을 만들 수 있다
- [x] Request Board에서 요청 투표와 상태 badge가 local/repository state로 동작한다
- [x] Auth shell이 로그인 필요 상태와 현재 사용자 정보를 일관되게 제공한다
- [x] Firestore 전환 문서에 컬렉션 구조, document shape, index 후보, 보안 규칙 초안이 포함된다
- [x] comments, likes, tried, fork 동작이 직접 local state가 아니라 repository action을 경유한다
- [ ] 빈 상태, 검색 결과 없음, validation 실패, 로그인 필요 상태가 UI로 확인된다
- [x] 모바일 390px에서 Create/Profile/Requests 주요 텍스트와 버튼이 겹치거나 넘치지 않는다
- [x] `pnpm --filter @ux-lab/agent-and-my-ax run build`가 통과한다

---

## 액션 아이템

**FE (Avery)**
- [x] `/agent/new`, `/profile/[userId]`, `/requests` 라우트 구현
- [x] Create Agent 폼과 등록 후 Feed/Detail 이동 플로우 구현
- [x] Profile 활동 요약과 Request Board UI 구현
- [x] 다운로드/resultPreset 입력 UX와 preview 구현

**BE (Blake)**
- [x] repository interface와 mock adapter 구현
- [x] `POST /api/agents`, request, interaction API action 정리
- [x] current user provider와 auth shell 구현
- [x] Firestore 전환 문서와 보안 규칙 초안 작성

**UX (Riley)**
- [ ] Create/Profile/Requests 화면의 정보 밀도와 CTA 우선순위 검토
- [ ] validation 실패, empty state, 로그인 필요 상태 문구 검토
- [ ] 다운로드/resultPreset 입력 UI가 작성자에게 이해 가능한지 리뷰

**QA (Morgan / Quinn)**
- [x] Create → Feed → Detail → Run → Tried → Profile → Requests 플로우 테스트
- [x] 모바일 390px, 데스크톱 1280px overflow 체크
- [ ] validation 실패와 빈 상태 테스트 케이스 작성

---

## Open Questions

| # | 질문 | 담당 | 기한 | 상태 |
|---|------|------|------|------|
| OQ-1 | Sprint 2에서 실제 Firebase 프로젝트를 연결할 수 있는가, 아니면 adapter와 문서까지만 고정할까? | BE Blake | Sprint 2 중 | ✅ repository adapter + mock persistence, Firestore 연결은 Sprint 3 |
| OQ-2 | Agent 등록 시 resultPreset을 작성자가 직접 쓰게 할지, Prompt에서 자동 생성하는 UX로 둘지 결정이 필요하다 | PM Jordan | Sprint 2 중 | ✅ Prompt 기반 기본값 + 작성자 조정 |
| OQ-3 | Request Board 요청은 전체 공개만 허용할지, 팀 공개 요청도 허용할지 결정이 필요하다 | PM Jordan | Sprint 2 중 | ✅ 전체 공개만 허용 |
| OQ-4 | Profile URL은 `/profile/[userId]`와 `/me` 중 무엇을 기본 진입점으로 둘까? | UX Riley | Sprint 2 중 | ✅ `/me` 기본, `/profile/[userId]` 공유 URL |
| OQ-5 | Fork 생성은 Sprint 2 P1로 둘지, Create Agent의 필수 파생 플로우로 승격할지 결정이 필요하다 | PM Jordan | Sprint 2 중 | ✅ Sprint 2 P1 유지 |

---

## 비고

### 리스크

- 실제 Firebase 환경변수가 없으면 production persistence 검증은 제한된다.
- Create Agent 입력 필드가 많아지면 작성자 진입 장벽이 높아질 수 있다.
- Request Board, Profile, Create를 동시에 구현하면 화면 수가 늘어 QA 범위가 커진다.
- 기존 mock seed와 생성 데이터의 일관성을 유지하지 않으면 Feed/Ranking/Profile 간 카운터 불일치가 생길 수 있다.

### 제외 범위

| 항목 | 사유 |
|------|------|
| Production Firebase write | 인증/보안 규칙 검증 전 위험 |
| 외부 Agent 실행 연동 | API 승인과 보안 정책 필요 |
| 관리자 승인 플로우 | 운영 정책 확정 후 설계 |
| AI 기반 Agent 추천 | 사용 데이터 수집 이후 검증 가능 |

---

*회의록 작성: TS Alex | 다음 회의: Sprint 2 리뷰*
