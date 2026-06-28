# Sprint 1 킥오프 회의록 — bucket-exchange

**날짜:** 2026-06-28  
**참석자:** PM Jordan, FE Avery, BE Blake, QA Morgan, TS Alex, UX Riley  
**진행자:** PM Jordan

---

## Sprint 1 목표

> **Claude 디자인 파일(9개 화면) 기반으로 Bucket Exchange UI 프로토타입을 구현한다 — Next.js + 정적 목업 데이터, 백엔드 연동 없음.**

---

## 결정 사항 요약

| # | 결정 내용 | 담당 |
|---|-----------|------|
| D-1 | 앱 위치: `apps/bucket-exchange` 신규 생성 (Next.js App Router + TypeScript) | FE Avery |
| D-2 | Sprint 1은 UI 전용 — Firebase/API 연동 없음, 정적 mock 데이터 사용 | PM Jordan |
| D-3 | 디자인 레퍼런스: `docs/PRD/bucket-exchange/app-design-standalone.html` (9개 화면) | 전체 |
| D-4 | Paper First 테마: Primary #4F46E5 / Paper #F8F5EF / Ink #2F2F2F / Stamp Red #D64545 | FE Avery |

---

## Sprint 1 확정 스코프

### 포함 (P0 — 이번 스프린트)

| # | 항목 | 우선순위 | 담당 | 화면 |
|---|------|----------|------|------|
| 1 | Next.js 앱 초기 세팅 (`apps/bucket-exchange`) — 라우팅, 공통 레이아웃, 디자인 토큰 | P0 | FE | — |
| 2 | **Quest Board** — 오늘의 의뢰 목록, 카테고리 필터 탭, Quest Card 리스트, RECRUITING/CLOSING 스탬프 배지 | P0 | FE | Screen 1 |
| 3 | **Quest Card (Dream Order 상세)** — 종이 의뢰서 스타일, Reward/Difficulty/Applicants/Deadline, 지원 CTA | P0 | FE | Screen 2 |
| 4 | **Application Form (지원서 작성)** — 닉네임/지원이유/수행계획/예상일정/희망보상 입력, 제출 버튼 | P0 | FE | Screen 3 |
| 5 | **Create Quest (의뢰 등록)** — 제목/내용/카테고리/Reward/Deadline 입력, Post 버튼 | P0 | FE | Screen 4 |

### 포함 (P1 — 여유 시 추가)

| # | 항목 | 우선순위 | 담당 | 화면 |
|---|------|----------|------|------|
| 6 | **Selection (지원자 선정)** — 지원자 목록, 지원 내용 카드, 선정 버튼 | P1 | FE | Screen 5 |
| 7 | **Profile** — 닉네임/완료 퀘스트 수/만족도/포인트/배지 컬렉션 | P1 | FE | Screen 6 |

### 제외 (Sprint 2 이월)

| 항목 | 이연 사유 |
|------|-----------|
| Proof (인증 자료 제출) | 파일 업로드 플로우 — Sprint 2에서 별도 설계 |
| Journey Log | 그라디언트 배경 + 에디터 — UI 복잡도 높음 |
| Mission Complete 인증서 | Certificate 디자인 — Sprint 2 목표 |
| Firebase Auth/Firestore | 백엔드 연동 전 UI 완성 우선 |
| 실시간 모집 현황 (WebSocket) | MVP 이후 |

---

## 수용 기준 (Acceptance Criteria)

- [ ] `apps/bucket-exchange`에서 `pnpm dev`로 앱이 실행된다
- [ ] `/` (Quest Board)에서 Quest 카드 목록이 mock 데이터로 렌더링된다
- [ ] 카테고리 탭 (ALL / TRAVEL / CHALLENGE / LEARN / BONDS)으로 필터링된다
- [ ] RECRUITING / CLOSING 스탬프 배지가 디자인과 동일하게 표시된다
- [ ] Quest 카드 클릭 시 `/quest/[id]` (Dream Order 상세)로 이동한다
- [ ] Dream Order 상세 화면이 종이 의뢰서 스타일로 렌더링된다 (Paper #F8F5EF 배경, 파선 구분선)
- [ ] "의뢰 지원하기 · Apply" 버튼 클릭 시 `/quest/[id]/apply` (지원서)로 이동한다
- [ ] 지원서 폼의 모든 필드가 입력 가능하고 "제출하기 · Submit" 버튼이 동작한다
- [ ] `/create` (의뢰 등록) 폼이 렌더링되고 "Post" 버튼이 동작한다
- [ ] 디자인 토큰 (색상, 타이포그래피, 스탬프 스타일)이 전역 CSS 변수로 정의된다

---

## 액션 아이템

**FE (Avery)**
- [ ] `apps/bucket-exchange` Next.js 앱 생성 — App Router, TypeScript, Tailwind (or CSS Modules)
- [ ] 디자인 토큰 정의 — `styles/tokens.css` (색상, 타이포, 스탬프)
- [ ] 공통 컴포넌트: `StampBadge`, `QuestCard`, `CategoryTab`, `DreamOrderCard`
- [ ] Screen 1 구현: Quest Board (`/`)
- [ ] Screen 2 구현: Quest Detail (`/quest/[id]`)
- [ ] Screen 3 구현: Application Form (`/quest/[id]/apply`)
- [ ] Screen 4 구현: Create Quest (`/create`)
- [ ] mock 데이터 파일 (`data/quests.ts`)

---

## Open Questions

| 질문 | 담당 | 기한 | 상태 |
|------|------|------|------|
| CSS 프레임워크: Tailwind vs CSS Modules? | FE Avery | Sprint 1 시작 | ⚠️ Open |
| 라우팅: App Router pages 구조 확정 | FE Avery | Sprint 1 시작 | ⚠️ Open |
| P1 화면(Selection, Profile) Sprint 1 내 포함 여부 | PM Jordan | 진행 중 판단 | ⚠️ Open |

---

## 비고

### 디자인 레퍼런스 화면 목록

| # | 화면명 | 라벨 | 라우트(예상) |
|---|--------|------|-------------|
| 1 | Quest Board | QUEST BOARD · 의뢰 게시판 | `/` |
| 2 | Quest Card 상세 | QUEST CARD · 의뢰 상세 | `/quest/[id]` |
| 3 | 지원서 작성 | APPLICATION · 지원서 | `/quest/[id]/apply` |
| 4 | 의뢰 등록 | CREATE QUEST | `/create` |
| 5 | 지원자 선정 | SELECTION · 지원 N명 | `/quest/[id]/selection` |
| 6 | 프로필 | PROFILE · 프로필 통계 | `/profile` |
| 7 | 인증 제출 | PROOF · 인증 자료 제출 | `/quest/[id]/proof` |
| 8 | Journey Log | JOURNEY LOG · 기록 | `/quest/[id]/log` |
| 9 | Mission Complete | NOTION · 완주 인증서 | `/quest/[id]/complete` |

### 리스크

- 22MB 번들 HTML에서 정확한 스타일 값 추출이 어려울 수 있음 — 브라우저 DevTools로 직접 확인 필요
- Paper First 애니메이션(스탬프 찍기, 종이 펼치기)은 Sprint 1에서 제외, Sprint 2에서 추가

### 참조 문서

- PRD: `docs/PRD/bucket-exchange/prd.md`
- 디자인 컨셉: `docs/PRD/bucket-exchange/design-concept.md`
- 디자인 파일: `docs/PRD/bucket-exchange/app-design-standalone.html`

---

*회의록 작성: TS Alex | 다음 회의: Sprint 1 리뷰*
