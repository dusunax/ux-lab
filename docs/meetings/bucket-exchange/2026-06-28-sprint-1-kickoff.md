# Sprint 1 킥오프 회의록 — bucket-exchange

**날짜:** 2026-06-28  
**참석자:** PM Jordan, FE Avery, BE Blake, QA Morgan, TS Alex, UX Riley  
**진행자:** PM Jordan

---

## Sprint 1 목표

> **Claude 디자인 파일(9개 화면) 기반으로 Bucket Exchange UI를 구현하고 Firebase 백엔드까지 연동한다 — Next.js App Router + Firestore + Anonymous Auth.**

---

## 결정 사항 요약

| # | 결정 내용 | 담당 |
|---|-----------|------|
| D-1 | 앱 위치: `apps/bucket-exchange` 신규 생성 (Next.js App Router + TypeScript) | FE Avery |
| D-2 | ~~Sprint 1은 UI 전용~~ → P1 완료: Firebase 연동까지 Sprint 1 내 구현 | PM Jordan |
| D-3 | 디자인 레퍼런스: `docs/PRD/bucket-exchange/app-design-standalone.html` (9개 화면) | 전체 |
| D-4 | Paper First 테마: Primary #4F46E5 / Paper #F8F5EF / Ink #2F2F2F / Stamp Red #D64545 | FE Avery |
| D-5 | CSS 프레임워크: Tailwind CSS 확정 | FE Avery |
| D-6 | Firebase 신규 프로젝트 `bucket-exchange` 생성 (ai-empathy-diary와 분리) | BE Blake |
| D-7 | 인증 방식: Firebase Anonymous Auth — 별도 회원가입 없이 지원자 식별 | PM Jordan |

---

## Sprint 1 확정 스코프

### 완료 (P0)

| # | 항목 | 상태 | 화면 |
|---|------|------|------|
| 1 | Next.js 앱 초기 세팅 (`apps/bucket-exchange`) — 라우팅, 공통 레이아웃, 디자인 토큰 | ✅ | — |
| 2 | **Quest Board** — Firestore 실시간 데이터, 카테고리 필터 탭, RECRUITING/CLOSING 스탬프 배지 | ✅ | Screen 1 |
| 3 | **Quest Card (Dream Order 상세)** — 종이 의뢰서 스타일, Reward/Difficulty/Applicants/Deadline, 지원 CTA | ✅ | Screen 2 |
| 4 | **Application Form (지원서 작성)** — 5개 필드, 중복 지원 방지(409), Firestore 저장 | ✅ | Screen 3 |
| 5 | **Create Quest (의뢰 등록)** — 폼 입력 → `POST /api/quests` → Firestore 저장 → Board 리다이렉트 | ✅ | Screen 4 |

### 완료 (P1)

| # | 항목 | 상태 |
|---|------|------|
| 6 | **Firebase Firestore 연동** — `quests` 컬렉션 read/write, `applications` 서브컬렉션 write | ✅ |
| 7 | **Next.js API Routes** — `GET /api/quests`, `POST /api/quests`, `POST /api/applications` | ✅ |
| 8 | **Firebase Auth (Anonymous)** — 자동 익명 로그인, Bearer 토큰 검증 | ✅ |

### 제외 (Sprint 2 이월)

| 항목 | 이연 사유 |
|------|-----------|
| Proof (인증 자료 제출) | 파일 업로드 플로우 — Sprint 2에서 별도 설계 |
| Journey Log | 그라디언트 배경 + 에디터 — UI 복잡도 높음 |
| Mission Complete 인증서 | Certificate 디자인 — Sprint 2 목표 |
| Selection (지원자 선정) UI | 백엔드 연동 완료 후 구현 |
| Profile UI | 포인트/배지 시스템 설계 필요 |
| 실시간 모집 현황 (WebSocket) | MVP 이후 |

---

## 수용 기준 (Acceptance Criteria)

- [x] `apps/bucket-exchange`에서 `pnpm dev`로 앱이 실행된다
- [x] `/` (Quest Board)에서 Quest 카드 목록이 **Firestore** 데이터로 렌더링된다
- [x] 카테고리 탭 (ALL / TRAVEL / CHALLENGE / LEARN / BONDS)으로 필터링된다
- [x] RECRUITING / CLOSING 스탬프 배지가 디자인과 동일하게 표시된다
- [x] Quest 카드 클릭 시 `/quest/[id]` (Dream Order 상세)로 이동한다
- [x] Dream Order 상세 화면이 종이 의뢰서 스타일로 렌더링된다 (Paper #F8F5EF 배경, 파선 구분선)
- [x] "의뢰 지원하기 · Apply" 버튼 클릭 시 `/quest/[id]/apply` (지원서)로 이동한다
- [x] 지원서 폼의 모든 필드가 입력 가능하고 "제출하기 · Submit" 버튼이 동작한다
- [x] `/create` (의뢰 등록) 폼이 렌더링되고 "Post" 버튼이 동작한다
- [x] 디자인 토큰 (색상, 타이포그래피, 스탬프 스타일)이 전역 CSS 변수로 정의된다
- [x] Firestore ID(`/quest/xbmBmLgtFhrnttc8NTT4`)로 퀘스트 상세 접근 시 404 없이 정상 렌더링된다
- [x] 의뢰 등록 → Board 이동 시 등록된 카드가 실시간 반영된다

---

## 액션 아이템

**FE (Avery)**
- [x] `apps/bucket-exchange` Next.js 앱 생성 — App Router, TypeScript, Tailwind
- [x] 디자인 토큰 정의 — `globals.css` + `tailwind.config.js` (색상, 타이포, 스탬프)
- [x] 공통 컴포넌트: `StampBadge`, `QuestCard`, `CategoryTab`, `QuestBoardClient`
- [x] Screen 1 구현: Quest Board (`/`) — Server Component + Firestore 조회
- [x] Screen 2 구현: Quest Detail (`/quest/[id]`) — Server Component + Firestore 조회
- [x] Screen 3 구현: Application Form (`/quest/[id]/apply`) — Server + Client 분리
- [x] Screen 4 구현: Create Quest (`/create`) — Firestore POST 연동
- [x] mock 데이터 파일 (`data/quests.ts`) — 타입 레퍼런스로 유지

**BE (Blake)**
- [x] `lib/firebase-client.ts` — Anonymous Auth + Firestore 클라이언트 초기화
- [x] `lib/firebase-admin.ts` — Service Account Admin SDK (API Routes 전용)
- [x] `lib/useAuth.ts` — 자동 익명 로그인 훅
- [x] `GET /api/quests` — Firestore quests 컬렉션 읽기
- [x] `POST /api/quests` — 의뢰 등록, Bearer 토큰 검증
- [x] `POST /api/applications` — 지원서 제출, 중복 방지(409), applicantCount 증가

---

## Open Questions

| 질문 | 담당 | 기한 | 상태 |
|------|------|------|------|
| CSS 프레임워크: Tailwind vs CSS Modules? | FE Avery | Sprint 1 시작 | ✅ Tailwind 확정 |
| 라우팅: App Router pages 구조 확정 | FE Avery | Sprint 1 시작 | ✅ Server Component 기본, 인터랙션만 Client |
| Firebase vs Supabase — Firestore 재사용 vs 새 DB 선택 | BE Blake | Sprint 1 백엔드 시작 전 | ✅ Firebase 신규 프로젝트 `bucket-exchange` |
| Anonymous Auth vs Google Login — 지원자 식별 방식 | PM Jordan | Sprint 1 백엔드 시작 전 | ✅ Anonymous Auth 확정 |

---

## 비고

### 구현 결과 요약

| 파일 | 역할 |
|------|------|
| `src/app/page.tsx` | Server Component — adminDb Firestore 조회 |
| `src/app/quest/[id]/page.tsx` | Server Component — 단일 퀘스트 조회 |
| `src/app/quest/[id]/apply/page.tsx` | Server Component — 퀘스트 조회 후 ApplyForm 전달 |
| `src/app/quest/[id]/apply/ApplyForm.tsx` | Client Component — 지원서 폼 |
| `src/app/create/page.tsx` | Client Component — 의뢰 등록 폼 |
| `src/app/api/quests/route.ts` | GET 목록 / POST 등록 |
| `src/app/api/applications/route.ts` | POST 지원서 제출 |
| `src/lib/firebase-client.ts` | Anonymous Auth + Firestore 클라이언트 |
| `src/lib/firebase-admin.ts` | Admin SDK (서버 전용) |
| `src/lib/useAuth.ts` | 자동 익명 로그인 훅 |

### Firestore 컬렉션 구조

```
quests/{questId}
  - title, description, category, reward, difficulty
  - deadline, maxApplicants, applicantCount
  - status, questionerId, questioner, postedAt

quests/{questId}/applications/{appId}
  - questId, nickname, reason, plan, schedule
  - desiredReward, applicantId, appliedAt
```

### 디자인 레퍼런스 화면 목록

| # | 화면명 | 라우트 | Sprint 1 |
|---|--------|--------|----------|
| 1 | Quest Board | `/` | ✅ |
| 2 | Quest Card 상세 | `/quest/[id]` | ✅ |
| 3 | 지원서 작성 | `/quest/[id]/apply` | ✅ |
| 4 | 의뢰 등록 | `/create` | ✅ |
| 5 | 지원자 선정 | `/quest/[id]/selection` | Sprint 2 |
| 6 | 프로필 | `/profile` | Sprint 2 |
| 7 | 인증 제출 | `/quest/[id]/proof` | Sprint 2 |
| 8 | Journey Log | `/quest/[id]/log` | Sprint 2 |
| 9 | Mission Complete | `/quest/[id]/complete` | Sprint 2 |

### 참조 문서

- PRD: `docs/PRD/bucket-exchange/prd.md`
- 디자인 컨셉: `docs/PRD/bucket-exchange/design-concept.md`
- 디자인 파일: `docs/PRD/bucket-exchange/app-design-standalone.html`

---

*회의록 작성: TS Alex | 다음 회의: Sprint 1 리뷰*
