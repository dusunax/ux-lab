# Sprint mini-judge/1 킥오프 회의록

**날짜:** 2026-06-20
**프로젝트:** mini-judge (미니 심사위원 도구)
**참석자:** PM Jordan, FE Avery, BE Blake, QA Morgan, QA Quinn, TS Alex
**진행자:** PM Jordan

---

## Sprint mini-judge/1 목표

> **URL 입력만으로 팀별 평가표와 질문 시트를 자동 생성하는 미니 심사위원 MVP를 완성한다.**

### 컨셉

> 부트캠프 출품회 부스를 돌며 각 팀의 GitHub README와 노션 페이지를 URL 하나로 읽는다.
> AI가 팀 고유 맥락을 파악해 평가표와 5개 질문 시트를 즉시 만들어낸다.
> 심사위원 레벨(주니어/미드/시니어)에 따라 질문의 깊이가 달라진다.
>
> **"URL 하나, 팀 고유 평가표 하나."**

#### 핵심 메커니즘 — 심사위원 흐름

| 단계 | 설명 |
|------|------|
| 1. 입력 | 심사위원 프로필(이름·레벨) 설정 → 팀 정보(제목·설명·노션 URL·GitHub URL) 입력 |
| 2. 파싱 | GitHub raw README fetch + 노션 공개 페이지 HTML 스크레이핑 → 텍스트 추출 |
| 3. AI 생성 | 파싱된 컨텍스트 + 심사위원 레벨 → LLM 프롬프트 → 평가표 + 질문 시트 |
| 4. 출력 | 팀별 결과 카드 (프로젝트 요약 · 기술 스택 · 완성도 체크리스트 · 질문 5개) |
| 5. 인쇄 | print CSS로 팀당 1페이지 PDF 내보내기 |

> 파싱 실패 시 수동 보강 UX가 개입해 컨텍스트 품질을 보장한다.

---

## 안건

| # | 구분 | 항목 |
|---|------|------|
| 1 | Open Question | 노션 URL 파싱 방식 — 공개 페이지 HTML 스크레이핑 vs Notion API 토큰 입력 허용 |
| 2 | Open Question | AI API 선택 — OpenRouter(DeepSeek) vs Vercel AI SDK |
| 3 | Open Question | GitHub Private 레포 fallback — 수동 입력 폼 제공 |
| 4 | 확정 | Sprint mini-judge/1 스코프 및 수용 기준 확정 |
| 5 | 확정 | 심사 점수 입력·집계, 순위 비교, 질문 편집·저장 Sprint 2 이연 |

---

## 결정 사항 요약

| # | 결정 내용 | 담당 |
|---|-----------|------|
| 1 | 앱 위치: `apps/mini-judge/` monorepo 신설, Vite + React + TypeScript + Tailwind + Zod | FE + BE |
| 2 | 심사위원 레벨 3단계: 주니어 / 미드 / 시니어 — 레벨별 프롬프트 분기 | PM |
| 3 | 노션 파싱: Sprint 1은 공개 URL HTML 스크레이핑 우선 (Notion OAuth는 Sprint 2 이연) | FE |
| 4 | AI API: OpenRouter(DeepSeek) 우선 검토, Vercel AI SDK 병행 평가 후 확정 (OQ-2) | FE/BE |
| 5 | GitHub Private 레포: 수동 텍스트 입력 fallback 폼 제공 (OQ-3) | FE |
| 6 | 질문 시트 구성: 기술 3개 + 포괄 2개, 팀 고유 내용 최소 1개 포함 보장 | PM |
| 7 | 인쇄 내보내기: print CSS 기반, 팀당 1페이지 레이아웃 | FE |
| 8 | 파싱 실패 UX: 실패 항목 명시 + 수동 보강 입력 모달 제공 | FE |

---

## Sprint mini-judge/1 확정 스코프

| # | ID | 항목 |
|---|----|------|
| 1 | INIT-1 | `apps/mini-judge/` Vite + React + TypeScript + Tailwind + Zod 초기 구조 세팅 |
| 2 | INIT-2 | 심사위원 프로필 설정 화면 (이름, 레벨 — 주니어/미드/시니어) |
| 3 | INPUT-1 | 팀 입력 폼 (제목, 설명, 노션 URL, GitHub URL) |
| 4 | INPUT-2 | 팀 목록 관리 (n개 팀 추가/삭제, 진행 상태 표시) |
| 5 | PARSE-1 | GitHub README 파싱 (raw.githubusercontent.com fetch) |
| 6 | PARSE-2 | 노션 페이지 파싱 (공개 URL 텍스트 스크레이핑) |
| 7 | AI-1 | 팀별 AI 프롬프트 설계 → 평가표 + 질문 시트 생성 (LLM API) |
| 8 | AI-2 | 심사위원 레벨 반영 질문 깊이 조정 (프롬프트 분기) |
| 9 | OUTPUT-1 | 팀별 결과 카드 (프로젝트 요약 + 기술 스택 + 완성도 체크리스트) |
| 10 | OUTPUT-2 | 질문 시트 렌더링 (기술 3개 + 포괄 2개, 총 5개) |
| 11 | PRINT-1 | 인쇄/PDF 내보내기 (print CSS, 팀당 1페이지) |

---

## 수용 기준 (Acceptance Criteria)

- [ ] 심사위원 이름과 레벨(주니어/미드/시니어)을 설정할 수 있다
- [ ] 팀 정보(제목, 설명, 노션 URL, GitHub URL)를 입력할 수 있다
- [ ] n개 팀을 추가하고 목록으로 관리할 수 있다
- [ ] GitHub 공개 레포의 README를 자동으로 파싱한다
- [ ] 노션 공개 페이지의 텍스트를 자동으로 파싱한다
- [ ] 팀 프로젝트 내용 기반 평가표(완성도 체크리스트 포함)를 생성한다
- [ ] 질문 시트 5개를 생성한다 (기술 3개 + 포괄 2개, 팀 고유 내용 최소 1개 포함)
- [ ] 심사위원 레벨에 따라 질문 깊이가 달라진다
- [ ] 생성된 결과를 인쇄/PDF로 내보낼 수 있다 (팀당 1페이지)
- [ ] 파싱 실패 시 사용자에게 수동 보강을 요청하는 UX가 있다

---

## 액션 아이템

**FE**
- [ ] `apps/mini-judge/` Vite + React + TypeScript + Tailwind + Zod 프로젝트 신설 — INIT-1
- [ ] 심사위원 프로필 설정 화면 구현 (이름, 레벨 선택 UI) — INIT-2
- [ ] 팀 입력 폼 구현 (제목·설명·노션 URL·GitHub URL, Zod 유효성 검사) — INPUT-1
- [ ] 팀 목록 관리 화면 구현 (n개 팀 추가/삭제, 상태 뱃지) — INPUT-2
- [ ] GitHub README 파싱 구현 (raw.githubusercontent.com fetch) — PARSE-1
- [ ] 노션 공개 페이지 HTML 스크레이핑 구현 + 파싱 실패 시 수동 보강 UX — PARSE-2
- [ ] GitHub Private 레포 fallback 수동 입력 폼 구현 — PARSE-1 보완
- [ ] LLM API 프롬프트 설계 및 평가표·질문 시트 생성 연동 — AI-1
- [ ] 심사위원 레벨별 프롬프트 분기 구현 (주니어/미드/시니어 깊이 조정) — AI-2
- [ ] 팀별 결과 카드 구현 (프로젝트 요약 · 기술 스택 · 완성도 체크리스트) — OUTPUT-1
- [ ] 질문 시트 렌더링 구현 (기술 3개 + 포괄 2개) — OUTPUT-2
- [ ] print CSS 기반 인쇄/PDF 내보내기 구현 (팀당 1페이지) — PRINT-1

**BE**
- [ ] monorepo 구성 검토 (`pnpm workspace`) — INIT-1 지원
- [ ] GitHub raw fetch CORS 정책 검토 — proxy 또는 서버사이드 필요 여부 판단 — PARSE-1 지원
- [ ] AI API 선택 평가 (OpenRouter/DeepSeek vs Vercel AI SDK) — AI-1 지원

**QA**
- [ ] 팀 추가/삭제 목록 관리 플로우 검증 — INPUT-2
- [ ] GitHub README 파싱 정상 동작 및 실패 케이스 검증 — PARSE-1
- [ ] 노션 파싱 실패 시 수동 보강 UX 진입 플로우 검증 — PARSE-2
- [ ] 심사위원 레벨별 질문 깊이 차이 검증 (주니어 vs 시니어 출력 비교) — AI-2
- [ ] 인쇄/PDF 내보내기 레이아웃 검증 (팀당 1페이지, 내용 잘림 없음) — PRINT-1

---

## Open Questions

| 질문 | 담당 | 기한 | 상태 |
|------|------|------|------|
| 노션 URL 파싱 방식 — 공개 페이지 HTML 스크레이핑 vs Notion API 토큰 입력 허용 | FE | Sprint 1 시작 전 | ⚠️ Open |
| AI API 선택 — OpenRouter(DeepSeek) vs Vercel AI SDK | FE/BE | Sprint 1 시작 전 | ⚠️ Open |
| GitHub Private 레포 fallback — 수동 입력 폼 제공 | FE | Sprint 1 킥오프 | ⚠️ Open |

---

## 비고

### 리스크

- **노션 공개 페이지 파싱 불안정**: HTML 구조가 undocumented이며 변경 빈도가 높음 — 파싱 실패 시 fallback UX 필수.
- **AI 생성 품질 의존성**: 질문 품질이 파싱된 컨텍스트에 직접 의존 — 파싱 실패 = 품질 저하 연쇄.
- **GitHub raw fetch CORS**: 브라우저 직접 fetch가 CORS 정책으로 차단될 수 있음 — proxy 또는 서버사이드 처리 검토 필요.
- **레벨별 질문 품질 보장**: 프롬프트 설계가 핵심 — 주니어/미드/시니어 간 실질적 깊이 차이를 만들 수 있어야 함.

### 제외 범위

| 항목 | 이연 사유 |
|------|-----------|
| 심사 점수 입력 및 집계 | Sprint 2 — MVP 우선 |
| 팀 간 순위 비교 | Sprint 2+ |
| 질문 수동 편집·저장 | Sprint 2 |
| 노션 OAuth 연동 (Private 페이지) | Sprint 2 — 공개 URL 먼저 |
| GitHub Private 레포 지원 | Sprint 2 |
| 사용자 계정/로그인 | 미정 |
| 모바일 반응형 최적화 | 낮은 우선순위 |

---

*회의록 작성: TS Alex | 작성일: 2026-06-20 | 다음 회의: Sprint mini-judge/1 리뷰*
