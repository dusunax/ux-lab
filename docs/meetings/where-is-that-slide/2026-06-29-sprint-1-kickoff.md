# Sprint 1 킥오프 회의록 — where-is-that-slide

**날짜:** 2026-06-29
**참석자:** PM Jordan, FE Avery, BE Blake, QA Morgan, TS Alex, AI Sage
**진행자:** PM Jordan

---

## Sprint 1 목표

> **FastAPI + ChromaDB + OpenAI Embedding으로 사내 문서 자연어 검색 MVP를 완성한다 — 질문 하나로 관련 슬라이드를 5초 내에 찾아준다.**

---

## 결정 사항 요약

| # | 결정 내용 | 담당 |
|---|-----------|------|
| D-1 | 앱 위치: `apps/where-is-that-slide` (React + TypeScript + Vite) | FE Avery |
| D-2 | 백엔드: `apps/where-is-that-slide-api` (FastAPI + Python) | BE Blake |
| D-3 | Vector DB: ChromaDB (로컬, 파일럿 단계) | BE Blake |
| D-4 | 청킹 전략: PPT = 슬라이드 1개/청크, PDF = 페이지 단위 (50자 미만 인접 병합) | AI Sage |
| D-5 | Embedding: `text-embedding-3-small` (OpenAI) | AI Sage |
| D-6 | 요약: OpenAI Responses API | AI Sage |
| D-7 | 파일럿 범위: 사내 공개 세미나 자료 (법무 검토 완료 전까지) | PM Jordan |
| D-8 | 배포: FE → Vercel, BE → Railway (Vercel Python 미지원) | BE Blake |

---

## Sprint 1 확정 스코프

### P0 — 완료 목표

| # | 항목 | 상태 | 담당 |
|---|------|------|------|
| 1 | FastAPI 프로젝트 초기 세팅 (`apps/where-is-that-slide-api`) | ☐ | BE Blake |
| 2 | ChromaDB 연동 및 컬렉션 초기화 | ☐ | BE Blake |
| 3 | PDF 텍스트 추출 (pdfplumber, 페이지 단위) | ☐ | BE Blake |
| 4 | PPT 텍스트 추출 (python-pptx, 슬라이드 단위) | ☐ | BE Blake |
| 5 | 청킹 로직 구현 (PPT 슬라이드 단위 / PDF 페이지 단위 + 병합) | ☐ | AI Sage |
| 6 | OpenAI Embedding 생성 및 ChromaDB 저장 | ☐ | AI Sage |
| 7 | `POST /index` — 파일 업로드 → 인덱싱 API | ☐ | BE Blake |
| 8 | `POST /search` — 자연어 쿼리 → top-5 결과 반환 API | ☐ | BE Blake |
| 9 | OpenAI Responses API로 검색 결과 요약 생성 | ☐ | AI Sage |
| 10 | React 앱 초기 세팅 (`apps/where-is-that-slide`) | ☐ | FE Avery |
| 11 | 검색 입력 UI + 결과 카드 컴포넌트 | ☐ | FE Avery |
| 12 | 결과 카드: 파일명 / 추천 페이지 / 요약 / Drive 링크 표시 | ☐ | FE Avery |
| 13 | FastAPI CORS 설정 + 프론트 연동 확인 | ☐ | BE Blake |
| 14 | 파일럿 문서 10개 인덱싱 및 검색 동작 검증 | ☐ | QA Morgan |

### P1 — 시간 여유 시 (Sprint 1 선택)

| # | 항목 | 담당 |
|---|------|------|
| 15 | Google Drive API 연동 (Service Account OAuth) | BE Blake |
| 16 | Drive 폴더 지정 → 자동 파일 목록 조회 + 인덱싱 | BE Blake |
| 17 | 로딩 상태 UI (스켈레톤 / 스피너) | FE Avery |
| 18 | 검색 결과 없음 빈 상태 화면 | FE Avery |
| 19 | FE Vercel 배포 | FE Avery |
| 20 | BE Railway 배포 | BE Blake |

### 제외 (Sprint 2 이월)

| 항목 | 이연 사유 |
|------|-----------|
| Drive 자동 동기화 (변경 감지) | Webhook 설계 필요 — MVP 이후 |
| 검색 권한 연동 (Drive 권한 필터) | OAuth 토큰 관리 복잡도 |
| Google Chat Bot 연동 | Chat API 별도 설계 필요 |
| 관련 문서 추천 | 검색 품질 검증 후 진행 |
| OCR (이미지 기반 슬라이드) | Sprint 1 범위 초과 |

---

## 수용 기준 (Acceptance Criteria)

- [ ] `POST /index`로 PDF/PPT 파일을 업로드하면 ChromaDB에 청크가 저장된다
- [ ] `POST /search`에 자연어 쿼리를 보내면 관련 문서 top-5 결과가 반환된다
- [ ] 검색 결과에 파일명, 추천 페이지 번호, AI 요약 1~3줄이 포함된다
- [ ] React 앱에서 검색어 입력 후 결과 카드가 렌더링된다
- [ ] 결과 카드에서 Google Drive 원본 링크를 클릭할 수 있다
- [ ] "OCR 발표 어디 있었지?" 시나리오에서 관련 문서가 top-3 이내에 포함된다
- [ ] 응답 시간 p95 ≤ 5초 (파일럿 문서 10개 기준)

---

## 액션 아이템

**BE (Blake)**
- [ ] FastAPI 프로젝트 초기화 및 ChromaDB 의존성 설치
- [ ] PDF/PPT 텍스트 추출 유틸리티 구현
- [ ] `/index`, `/search` API 엔드포인트 구현
- [ ] CORS 설정 및 FE 연동

**FE (Avery)**
- [ ] React + TypeScript + Vite 앱 초기화 (`apps/where-is-that-slide`)
- [ ] 검색 입력 컴포넌트 + 결과 카드 UI 구현
- [ ] FastAPI `/search` API 연동

**AI (Sage)**
- [ ] 청킹 전략 구현 (PPT 슬라이드 단위 / PDF 페이지 단위 + 병합 로직)
- [ ] OpenAI Embedding 생성 + ChromaDB 저장 파이프라인
- [ ] Responses API 요약 프롬프트 설계 및 구현

**QA (Morgan)**
- [ ] 파일럿 문서 10개 선정 및 인덱싱 테스트
- [ ] 검색 정확도 수동 평가 (top-3 relevant 기준)
- [ ] 응답 시간 측정

---

## Open Questions

| # | 질문 | 담당 | 기한 | 상태 |
|---|------|------|------|------|
| OQ-1 | **사내 문서의 AI 처리(OpenAI 전송)가 법무/보안 검토를 통과하는가?** | PM Jordan | 2026-07-03 | ⚠️ Open |
| OQ-2 | **Drive 접근 범위 — 전체 드라이브 vs 특정 폴더 화이트리스트?** | BE Blake | 2026-07-03 | ⚠️ Open |
| OQ-3 | ChromaDB 지속성 방식 — 로컬 파일 vs 인메모리 (파일럿 단계) | BE Blake | Sprint 1 시작 | ⚠️ Open |
| OQ-4 | 검색 결과 top-k 값 — 5개 vs 3개 (UI 밀도 고려) | FE Avery | Sprint 1 중 | ⚠️ Open |
| OQ-5 | PPT 이미지 슬라이드 처리 — 무시 vs 슬라이드 제목만 인덱싱? | AI Sage | Sprint 1 중 | ⚠️ Open |

---

## 비고

### 리스크

- **OQ-1 미해결 시**: 사내 공개 세미나 자료(외부 발표용)로 파일럿 범위 제한
- **OQ-2 미해결 시**: 수동 파일 업로드 방식으로 대체 (Drive API 연동 없이 진행)
- FastAPI는 Vercel에서 Python 미지원 → Railway/Render 배포 필요 (D-8 결정)

### 참조 문서

- PRD: `docs/PRD/where-is-that-slide/prd.md`
- 기술 스택: React + TypeScript, FastAPI, OpenAI Embedding + Responses API, ChromaDB, Google Drive API

---

*회의록 작성: TS Alex | 다음 회의: Sprint 1 리뷰*
