# Sprint marathon-diary/1 킥오프 회의록

**날짜:** 2026-06-16
**프로젝트:** marathon-diary (취미 러너를 위한 마라톤 스티커북)
**참석자:** PM Jordan, FE Avery, BE Blake, QA Morgan, QA Quinn, TS Alex
**진행자:** PM Jordan

---

## Sprint marathon-diary/1 목표

> **배번호(Bib Number)를 촬영하면 자동으로 스티커 페이지가 생성되는 마라톤 스티커북 MVP를 3D 책 UI로 Vercel에 배포한다.**

### 컨셉

> 달리기를 마친 날, 배번호 하나를 찍는다.
> 그 순간이 스티커 한 장이 되어 책에 붙는다.
> 몇 년이 쌓이면 — 시즌 앨범이 된다.
>
> **"달린 날만큼, 페이지가 쌓인다."**

#### 핵심 메커니즘

1. **배번호(Bib Number) 촬영** → 페이지 생성 트리거
2. **스티커 페이지 4슬롯** (레이스 1회 = 페이지 1장)

   | 슬롯 | 유형 | 내용 |
   |------|------|------|
   | 배번호 | 사진 | 촬영 → 수동 입력 or OCR |
   | 메달 | 사진 | 촬영 |
   | 완주기록 | 텍스트 | 완주 시간 · 거리 · 날짜 |
   | 셀카 | 사진 | 촬영 |

3. **도장 & 스티커 꾸미기** — 페이지 위에 자유 배치

   | 종류 | 예시 |
   |------|------|
   | 완주 도장 | 금·은·동 등급 도장, 날짜 도장 |
   | 코스 스티커 | 로드 · 트레일 · 야간 · 비 속 완주 |
   | 포인트 스티커 | 불꽃, 별, 하트, 페이스마커, 근육 |

   드래그 & 드롭으로 자유 배치 → 위치·회전·크기 IndexedDB 저장

4. **시즌 앨범** — 연도별 자동 그룹핑 (2026 시즌 앨범, 2027 시즌 앨범 …)
5. **3D 책 UI** — 앨범을 펼치는 page-flip 애니메이션

---

## 안건

| # | 구분 | 항목 |
|---|------|------|
| 1 | Open Question | 배번호 인식 방식 — OCR(Tesseract.js) vs 수동 입력 선택 제공 |
| 2 | Open Question | 3D page-flip 구현 방식 — CSS 3D transforms vs Three.js/WebGL |
| 3 | Open Question | 이미지 저장 방식 — localStorage Base64 (5MB 한계) vs IndexedDB |
| 4 | 확정 | Sprint marathon-diary/1 스코프 및 수용 기준 확정 |
| 5 | 확정 | 완주증 제외 — 완주기록(시간·거리·날짜) 텍스트 입력으로 대체 |

---

## 결정 사항 요약

| # | 결정 내용 | 담당 |
|---|-----------|------|
| 1 | 앱 위치: `apps/marathon-diary` monorepo 신설, Vite + React + TS + Tailwind | Avery + Blake |
| 2 | 핵심 단위: Bib Number 페이지. 배번호가 각 레이스의 primary key 역할 | PM |
| 3 | 완주증 슬롯 제외 → 완주기록(시간·거리·날짜) 텍스트 입력으로 대체 | PM |
| 4 | 3D 책 UI: CSS 3D perspective + page-flip 애니메이션 (OQ-2 해결 전 CSS 우선 시도) | Avery |
| 5 | 이미지 저장: Sprint 1은 IndexedDB 사용 (Base64 5MB 한계 회피) | Avery / Blake |
| 6 | Vercel 정적 배포 설정 (`vercel.json`, SPA fallback) | Blake / Chase |

---

## Sprint marathon-diary/1 확정 스코프

| # | ID | 항목 |
|---|----|------|
| 1 | INIT-1 | `apps/marathon-diary` Vite + React + TS + Tailwind 초기 구조 세팅 |
| 2 | BOOK-1 | 3D 책 UI — CSS perspective + page-flip 애니메이션 (앨범 펼치기) |
| 3 | ALBUM-1 | 시즌 앨범 목록 화면 — 연도별 앨범 카드 그리드 |
| 4 | PAGE-1 | 스티커 페이지 — 4슬롯 레이아웃 (배번호 / 메달 / 완주기록 / 셀카) |
| 5 | BIB-1 | 배번호 입력 — 카메라 촬영 + 수동 숫자 입력 fallback |
| 6 | PHOTO-1 | 사진 슬롯 — 촬영/업로드 → IndexedDB 저장 |
| 7 | RECORD-1 | 완주기록 입력 — 완주 시간(HH:MM:SS) · 거리(km) · 날짜 |
| 8 | DATA-1 | IndexedDB 기반 데이터 영속화 (레이스·이미지 CRUD 유틸 분리) |
| 9 | DECO-1 | 도장 & 스티커 꾸미기 — 자유 배치(드래그), 위치·회전·크기 저장 |
| 10 | DESIGN-1 | 스티커북 테마 디자인 토큰 — 크림·갈색·금박 색상 팔레트, 손글씨 느낌 타이포 |
| 11 | DEPLOY-1 | Vercel 정적 배포 설정 (`vercel.json`, SPA fallback) |

---

## 수용 기준 (Acceptance Criteria)

- [ ] `apps/marathon-diary`에서 `pnpm dev`로 로컬 실행 가능
- [ ] 시즌 앨범 목록에서 연도별 앨범 카드를 볼 수 있다
- [ ] 앨범을 클릭하면 3D 책이 펼쳐지는 애니메이션이 실행된다
- [ ] 새 페이지 추가 시 배번호를 카메라로 촬영하거나 직접 입력할 수 있다
- [ ] 스티커 페이지에 메달·셀카 사진을 촬영 또는 업로드할 수 있다
- [ ] 완주기록(시간·거리·날짜)을 텍스트로 입력할 수 있다
- [ ] 도장/스티커를 페이지에 드래그해서 자유 배치하고 저장할 수 있다
- [ ] 페이지 새로고침 후에도 사진·기록·데코 데이터가 유지된다 (IndexedDB)
- [ ] Vercel 배포 URL이 정상 접근 가능하다
- [ ] 모바일(375px 기준) 레이아웃이 깨지지 않는다

---

## 액션 아이템

**FE (Avery)**
- [ ] `apps/marathon-diary/` Vite + React + TypeScript + Tailwind 프로젝트 신설 — INIT-1
- [ ] 3D 책 UI 구현 — CSS perspective + page-flip 애니메이션, 앨범 표지·페이지 전환 — BOOK-1
- [ ] 시즌 앨범 목록 화면 구현 — 연도별 앨범 카드 그리드 — ALBUM-1
- [ ] 스티커 페이지 4슬롯 레이아웃 구현 (배번호 / 메달 / 완주기록 / 셀카) — PAGE-1
- [ ] 배번호 입력 구현 — 카메라 촬영 + 수동 입력 fallback — BIB-1
- [ ] 사진 슬롯 구현 — 촬영/업로드 + IndexedDB 저장 — PHOTO-1
- [ ] 완주기록 입력 폼 구현 — HH:MM:SS · km · 날짜 — RECORD-1
- [ ] 도장 & 스티커 꾸미기 구현 — 드래그 배치, 위치·회전·크기 저장 — DECO-1
- [ ] IndexedDB CRUD 유틸 분리 구현 (레이스·이미지·데코 레이어 포함) — DATA-1
- [ ] 스티커북 테마 디자인 토큰 정의 (크림·갈색·금박, 손글씨 타이포) — DESIGN-1

**BE (Blake)**
- [ ] monorepo 구성 검토 (`pnpm workspace`) — INIT-1 지원
- [ ] Vercel 정적 배포 설정 — `vercel.json` SPA fallback 및 monorepo 충돌 방지 — DEPLOY-1

**QA (Morgan / Quinn)**
- [ ] 수용 기준 전체 항목 검증
- [ ] 사진 업로드 → IndexedDB 저장 → 새로고침 후 복원 플로우 검증
- [ ] 도장/스티커 드래그 배치 → 저장 → 새로고침 후 복원 검증 — DECO-1
- [ ] iOS Safari 카메라 접근 권한 및 3D 애니메이션 호환성 검증
- [ ] 모바일 375px 기준 레이아웃 깨짐 여부 확인

---

## Open Questions

| 질문 | 담당 | 기한 | 상태 |
|------|------|------|------|
| 배번호 인식 방식 — Tesseract.js OCR vs 수동 입력만 제공 | FE | BIB-1 착수 전 | ⚠️ Open |
| 3D page-flip — CSS 3D transforms 단독 vs Three.js/WebGL | FE | BOOK-1 착수 전 | ⚠️ Open |
| monorepo `vercel.json` 충돌 방지 방안 | BE/PERF | 배포 설정 전 | ⚠️ Open |

---

## 비고

### 리스크

- **IndexedDB 브라우저 지원**: iOS Safari 14+ 지원, 구형 기기 주의. Sprint 1은 최신 Safari 기준.
- **3D 애니메이션 성능**: iOS Safari에서 CSS 3D transform 렌더링 이슈 발생 가능 — will-change, backface-visibility 최적화 필수.
- **카메라 접근 권한**: iOS PWA 환경에서 `<input type="file" capture="camera">` 방식 사용. getUserMedia는 PWA 설치 필요.
- **monorepo 포트 충돌**: 기존 앱 5173~5176 점유 — `vite.config.ts`에서 포트 고정 필요.

### 제외 범위

| 항목 | 이연 사유 |
|------|-----------|
| 완주증 사진 슬롯 | 텍스트 완주기록으로 대체 확정 (Sprint 1 회의 결정) |
| OCR 자동 인식 (Tesseract.js) | OQ-1 미결 — Sprint 1은 수동 입력 fallback 우선 |
| 지도 API / GPS 경로 기록 | Sprint 1 복잡도 초과 |
| 소셜 공유 / SNS 내보내기 | 검증 전 구현 불필요 |
| 클라우드 동기화 | MVP는 단일 기기 전제, Sprint 2 이후 |
| 훈련 통계 / 차트 시각화 | 데이터 누적 후 의미 있음 |
| 타이머 / 실시간 트래킹 | 앱 방향(일지)과 범위 외 |
| 계정/인증 | 개인 취미 앱 MVP에서 불필요 |
| 다크모드 | 스티커북 테마 단일 팔레트로 Sprint 1 완성 |

---

*회의록 작성: TS Alex | 수정: 2026-06-16 (컨셉 피벗 — 탐험가 원정 → 마라톤 스티커북) | 다음 회의: Sprint marathon-diary/1 리뷰*
