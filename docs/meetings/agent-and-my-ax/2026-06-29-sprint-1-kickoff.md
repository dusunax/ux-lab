# Sprint 1 킥오프 회의록 — agent-and-my-ax

**날짜:** 2026-06-29  
**참석자:** PM Jordan, FE Avery, BE Blake, QA Morgan, TS Alex, UX Riley  
**진행자:** PM Jordan

---

## Sprint 1 목표

> **Agent를 부탁해의 핵심 탐색-상세-실행-랭킹 흐름을 Next.js 기반 mock 앱으로 구현한다.**

---

## 이전 스프린트 완료 검증

신규 프로젝트 첫 스프린트이므로 이전 스프린트 완료 게이트는 적용하지 않는다.

---

## 결정 사항 요약

| # | 결정 내용 | 담당 |
|---|-----------|------|
| D-1 | 앱 위치는 `apps/agent-and-my-ax`로 신규 생성한다 | FE Avery |
| D-2 | 기술 스택은 Next.js App Router + TypeScript + Tailwind CSS를 우선한다 | FE Avery |
| D-3 | Sprint 1은 Firestore 없이 mock 데이터와 local state로 핵심 UX를 검증한다 | PM Jordan |
| D-4 | 디자인 기준은 `docs/PRD/agent-and-my-ax`의 4개 HTML 화면을 따른다 | UX Riley |
| D-5 | 브랜드명은 `Agent를 부탁해`, 보조 표기는 `Agent & My AX`로 사용한다 | PM Jordan |
| D-6 | 라우팅은 `/`, `/agent/[id]`, `/agent/[id]/run`, `/ranking`을 P0로 둔다 | FE Avery |
| D-7 | 실명제 회원 모델은 mock user seed로 표현하고 실제 인증은 Sprint 2 이후로 이월한다 | BE Blake |
| D-8 | 좋아요, 써봤어요, 댓글, Fork는 Sprint 1에서 UI 상태와 카운터 동작까지만 구현한다 | FE Avery |
| D-9 | Firestore 컬렉션 구조는 PRD를 기준으로 문서화하되 실제 저장소 연결은 제외한다 | BE Blake |
| D-10 | 실명제 인증 소스는 Google Workspace SSO를 기본으로 한다 | BE Blake |
| D-11 | Agent 실행은 API proxy를 기본으로 하고, 외부 URL은 새 탭 fallback으로 제한한다 | BE Blake |
| D-12 | 좋아요와 써봤어요는 사용자당 1회로 제한한다. 좋아요는 toggle, 써봤어요는 후기 수정 플로우로 확장한다 | PM Jordan |
| D-13 | 월간 랭킹 산식은 `likes * 3 + triedCount * 5 + registeredAgents * 10`을 기본안으로 검증한다 | PM Jordan |
| D-14 | Fork는 단순 복사가 아니라 `parentAgentId`, `forkedFromVersion`을 유지하는 파생 관계로 추적한다 | PM Jordan |
| D-15 | Sprint 1 백엔드는 Next API Routes 기반 mock service로 구현하고 Firestore 전환은 Sprint 2에서 진행한다 | BE Blake |
| D-16 | Agent 데이터에 Platform, Usage Guide, Visibility 필드를 추가해 실행 맥락과 공개 범위를 명확히 한다 | PM Jordan |
| D-17 | 작성자가 정의한 결과 프리셋과 다운로드 에셋을 Agent 데이터에 포함해 여러 Agent/UI/API가 같은 계약을 쓰게 한다 | PM Jordan |
| D-18 | 다운로드 파일은 버튼만 제공하지 않고 Cursor, Claude, Codex, Prompt별 사용 위치를 아코디언 가이드로 제공한다 | UX Riley |

---

## Sprint 1 확정 스코프

### P0 — 완료 목표

| # | 항목 | 상태 | 담당 |
|---|------|------|------|
| 1 | Next.js 앱 초기 세팅 (`apps/agent-and-my-ax`) | ✅ | FE Avery |
| 2 | 공통 레이아웃, 헤더, 검색 입력, 카테고리 필터, 반응형 shell 구현 | ✅ | FE Avery |
| 3 | mock 데이터 모델 정의: users, agents, comments, tried, rankings | ✅ | FE Avery |
| 4 | Home Feed 구현: Agent 카드 목록, 검색, 카테고리, 정렬 UI | ✅ | FE Avery |
| 5 | Agent Detail 구현: 소개, 사용 방법, 예시, 작성자, 업데이트 이력, 댓글 | ✅ | FE Avery |
| 6 | Run Agent 구현: 입력 폼, 실행 버튼, mock 결과, 써봤어요 CTA | ✅ | FE Avery |
| 7 | Ranking 구현: 개인 랭킹과 팀 랭킹, 월간 필터 UI | ✅ | FE Avery |
| 8 | 좋아요, 써봤어요, Fork, 댓글 작성의 local state 동작 | ✅ | FE Avery |
| 9 | Run Agent 결과 화면을 입력 요약, 처리 단계, 공통 결과 카드, 후속 CTA 중심으로 개선 | ✅ | FE Avery |
| 10 | Next API Routes mock backend 구현: agents, agent detail, run, rankings | ✅ | BE Blake |
| 11 | Agent 데이터 필드 추가: Platform, Usage Guide, Visibility | ✅ | PM Jordan |
| 12 | 작성자 정의 결과 프리셋과 Cursor/Claude/Codex/Prompt 다운로드 에셋 추가 | ✅ | PM Jordan |
| 13 | 다운로드 아코디언 가이드 표시 및 파일 내부 Target Usage 보강 | ✅ | UX Riley |
| 14 | 모바일 390px와 데스크톱 1024px 이상에서 디자인 레퍼런스와 주요 밀도 일치 | ✅ | UX Riley |
| 15 | 핵심 플로우 QA: Feed → Detail → Run → Tried → Ranking 확인 | ✅ | QA Morgan |

### P1 — 시간 여유 시

| # | 항목 | 담당 |
|---|------|------|
| 11 | Create Agent mock 폼과 등록 후 Feed 반영 | FE Avery |
| 12 | Request Board mock 화면 초안 | FE Avery |
| 13 | Profile mock 화면 초안 | FE Avery |
| 14 | 빈 상태, 검색 결과 없음, 실행 실패 mock 상태 | QA Quinn |

### 제외 (Sprint 2 이후 이월)

| 항목 | 이연 사유 |
|------|-----------|
| Firebase Auth / 사내 SSO | 인증 방식과 실명제 계정 소스 결정 필요 |
| Firestore 실제 연동 | Sprint 1은 UI/정보구조 검증이 우선 |
| 관리자 페이지 | MVP 제외 범위 |
| AI 추천 | PRD 향후 계획 항목 |
| Slack / Google Chat / Gen.AI 연동 | 외부 실행 권한과 API 설계 필요 |
| Badge 자동 발급 | 랭킹 산식과 운영 정책 확정 후 구현 |
| Notification | MVP 제외 범위 |

---

## 수용 기준 (Acceptance Criteria)

- [x] `apps/agent-and-my-ax`에서 개발 서버로 앱이 실행된다
- [x] `/`에서 Agent 목록이 카드 형태로 렌더링되고 검색어 입력이 가능하다
- [x] 카테고리 필터와 정렬 UI가 Home Feed에서 표시된다
- [x] Agent 카드 클릭 시 `/agent/[id]` 상세 화면으로 이동한다
- [x] 상세 화면에 소개, 사용 방법, 입력 예시, 출력 예시, 작성자 정보가 표시된다
- [x] 상세 화면에서 실행 CTA를 통해 `/agent/[id]/run`으로 이동한다
- [x] Run 화면에서 입력값을 넣고 mock 결과를 확인할 수 있다
- [x] Run 결과가 입력 요약, 처리 단계, 공통 결과 카드, 복사/내보내기/써봤어요 CTA로 구조화된다
- [x] `POST /api/agents/[id]/run`으로 mock backend 실행 결과를 받을 수 있다
- [x] `GET /api/agents`, `GET /api/agents/[id]`, `GET /api/rankings`가 mock 데이터를 반환한다
- [x] Agent 카드와 상세 화면에서 Platform, Usage Guide, Visibility를 확인할 수 있다
- [x] 더미 Agent별 작성자 결과 프리셋이 Run 화면의 공통 결과 카드 UI로 표시된다
- [x] 상세 화면과 Run 화면에서 Cursor, Claude, Codex, Prompt 파일을 다운로드할 수 있다
- [x] 다운로드 아코디언 가이드에서 파일별 사용 위치를 확인할 수 있다
- [x] 실행 후 "써봤어요" 상태와 카운터가 local state로 반영된다
- [x] 좋아요, Fork, 댓글 작성 UI가 local state로 동작한다
- [x] `/ranking`에서 개인 랭킹과 팀 랭킹을 확인할 수 있다
- [x] 모바일 390px 화면에서 주요 텍스트와 버튼이 겹치거나 넘치지 않는다
- [x] 데스크톱 화면에서 Home Feed, Detail, Run, Ranking의 정보 밀도가 디자인 레퍼런스와 유사하다

---

## 액션 아이템

**FE (Avery)**
- [x] `apps/agent-and-my-ax` Next.js 앱 생성
- [x] Tailwind CSS와 전역 디자인 토큰 구성
- [x] mock 데이터와 타입 정의
- [x] Home Feed, Agent Detail, Run Agent, Ranking 라우트 구현
- [x] 좋아요, 써봤어요, 댓글, Fork local state 구현
- [x] 모바일/데스크톱 반응형 레이아웃 조정
- [x] Platform, Usage Guide, Visibility 표시 반영
- [x] 상세/Run 화면 다운로드 버튼 구현
- [x] 다운로드 아코디언 가이드 표시 및 파일 내부 Target Usage 보강

**UX (Riley)**
- [x] PRD HTML 4개 화면에서 색상, 간격, 컴포넌트 패턴 추출
- [x] Product Hunt + GitHub + Linear + Reddit 톤이 과도하게 한쪽으로 치우치지 않는지 리뷰
- [x] 검색, 실행, 랭킹 흐름의 CTA 우선순위 검토

**BE (Blake)**
- [x] PRD의 Firestore 구조를 Sprint 2 구현 후보로 정리
- [x] 인증/실명제 요구사항과 사내 계정 소스 Open Question 정리
- [x] 실제 Agent 실행 URL 보안 제약 초안 작성
- [x] Next API Routes mock backend 구현
- [x] Run Agent 화면을 `/api/agents/[id]/run`에 연결
- [x] Run API를 작성자 `resultPreset` 기반 응답으로 변경

**QA (Morgan)**
- [x] Feed → Detail → Run → Tried → Ranking 핵심 플로우 테스트
- [x] 검색/필터/정렬 조합별 표시 상태 확인
- [x] 모바일 390px, 데스크톱 1024px 이상 시각 회귀 체크

---

## Open Questions

| # | 질문 | 담당 | 기한 | 상태 |
|---|------|------|------|------|
| OQ-1 | 실명제 인증은 사내 SSO, Google Workspace, 수동 프로필 중 무엇을 기준으로 할까? | BE Blake | Sprint 1 | ✅ Google Workspace SSO |
| OQ-2 | Agent 실행은 외부 URL iframe, 새 탭 이동, API proxy 중 어떤 방식을 기본으로 할까? | BE Blake | Sprint 1 | ✅ API proxy 기본, 외부 URL 새 탭 fallback |
| OQ-3 | "좋아요"와 "써봤어요"를 중복 클릭 가능하게 할지 사용자당 1회로 제한할지 결정이 필요하다 | PM Jordan | Sprint 1 | ✅ 사용자당 1회 |
| OQ-4 | 랭킹 산식은 좋아요 중심인지, 써봤어요와 등록 Agent 수까지 가중합할지 결정이 필요하다 | PM Jordan | Sprint 1 | ✅ likes * 3 + triedCount * 5 + registeredAgents * 10 |
| OQ-5 | Fork는 단순 복사인지, 원본-파생 관계와 변경 이력을 추적해야 하는지 결정이 필요하다 | PM Jordan | Sprint 1 | ✅ parentAgentId + forkedFromVersion 추적 |

---

## 비고

### 리스크

- PRD의 MVP 범위가 넓어 Sprint 1에서 전체 기능을 구현하려 하면 품질이 낮아질 수 있다.
- 디자인 레퍼런스는 4개 화면만 있으므로 Create Agent, Request Board, Profile은 별도 설계가 필요하다.
- 실제 Agent 실행 URL은 사내 보안 정책과 외부 링크 허용 범위에 영향을 받는다.
- 실명제와 팀 랭킹은 인증 소스가 결정되지 않으면 실제 데이터로 전환하기 어렵다.

### 구현 결과 요약

| 파일 | 역할 |
|------|------|
| `apps/agent-and-my-ax/src/app/page.tsx` | Home Feed 진입 화면 |
| `apps/agent-and-my-ax/src/components/HomeFeed.tsx` | 검색, 카테고리, 정렬, 카드 목록 상태 |
| `apps/agent-and-my-ax/src/app/agent/[id]/page.tsx` | Agent Detail 라우트 |
| `apps/agent-and-my-ax/src/components/AgentDetailClient.tsx` | 상세 정보, 좋아요, 써봤어요, Fork, 댓글 local state |
| `apps/agent-and-my-ax/src/app/agent/[id]/run/page.tsx` | Run Agent 라우트 |
| `apps/agent-and-my-ax/src/components/RunAgentClient.tsx` | 입력, API 실행, 구조화된 결과 페이지, 써봤어요 CTA |
| `apps/agent-and-my-ax/src/components/AgentDownloadButtons.tsx` | Cursor/Claude/Codex/Prompt 파일 다운로드 버튼과 아코디언 사용 위치 가이드 |
| `apps/agent-and-my-ax/src/app/ranking/page.tsx` | 개인/팀 랭킹 화면 |
| `apps/agent-and-my-ax/src/data/mock.ts` | Sprint 1 mock 데이터 |
| `apps/agent-and-my-ax/src/server/agentService.ts` | mock backend service |
| `apps/agent-and-my-ax/src/app/api/agents/route.ts` | Agent 목록 API |
| `apps/agent-and-my-ax/src/app/api/agents/[id]/route.ts` | Agent 상세 API |
| `apps/agent-and-my-ax/src/app/api/agents/[id]/run/route.ts` | Agent 실행 API |
| `apps/agent-and-my-ax/src/app/api/rankings/route.ts` | 랭킹 API |

### 검증

- `pnpm --filter @ux-lab/agent-and-my-ax run build` 통과
- Playwright: Home → Agent Detail → Run Agent → Tried 상태 변경 → Ranking 확인
- Playwright: 모바일 390px Home 레이아웃 및 콘솔 오류 없음 확인

### 참조 문서

| 파일 | 용도 |
|------|------|
| `docs/PRD/agent-and-my-ax/PRD-agent-and-my-ax.docx` | PRD 원본 |
| `docs/PRD/agent-and-my-ax/Agent Hub - Home Feed.html` | Home Feed 디자인 레퍼런스 |
| `docs/PRD/agent-and-my-ax/Agent Hub - Agent Detail.html` | Agent Detail 디자인 레퍼런스 |
| `docs/PRD/agent-and-my-ax/Agent Hub - Run Agent.html` | Run Agent 디자인 레퍼런스 |
| `docs/PRD/agent-and-my-ax/Agent Hub - Ranking.html` | Ranking 디자인 레퍼런스 |

---

*회의록 작성: TS Alex | 다음 회의: Sprint 1 리뷰*
