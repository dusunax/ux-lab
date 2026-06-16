---
name: marathon-diary-sprint1
description: marathon-diary 신규 앱 Sprint 1 핵심 결정 사항 — 컨셉 피벗, 스코프, 기술 스택
metadata:
  type: project
---

marathon-diary는 연 2~3회 10km 마라톤에 참가하는 취미 러너를 위한 마라톤 스티커북 앱. Sprint 1 시작일: 2026-06-16.

**⚠️ 컨셉 피벗 이력:** 초기 "탐험가 원정(expedition)" 테마 → **마라톤 스티커북**으로 전환 확정 (2026-06-16).

**채택 컨셉:** "마라톤 스티커북" — 배번호(Bib Number) 촬영이 진입점. 레이스 1회 = 스티커 페이지 1장. 연도별 시즌 앨범으로 쌓인다.

**태그라인:** "달린 날만큼, 페이지가 쌓인다."

**Why:** 배번호는 모든 러너가 공통으로 갖는 레이스의 상징물. 촬영 한 장으로 기록이 시작되는 낮은 진입장벽 + 스티커북 특유의 수집/꾸미기 재미가 장기 사용 동기로 연결됨.

## 스티커 페이지 4슬롯

| 슬롯 | 유형 | 비고 |
|------|------|------|
| 배번호 | 사진 | 촬영 → 수동 입력 or OCR |
| 메달 | 사진 | 촬영 |
| 완주기록 | 텍스트 | 시간·거리·날짜 (완주증 슬롯 제외 확정) |
| 셀카 | 사진 | 촬영 |

## 핵심 기능

- **도장·스티커 꾸미기 (DECO-1):** 드래그 자유 배치, 위치·회전·크기 IndexedDB 저장
- **시즌 앨범 (ALBUM-1):** 연도별 자동 그룹핑
- **3D 책 UI (BOOK-1):** CSS perspective + page-flip 애니메이션

## 기술 스택

- React 18 + TypeScript + Vite + Tailwind CSS, 포트 5177
- **IndexedDB** (이미지·데코 레이어 저장 — localStorage 5MB 한계 회피)
- 위치: `apps/marathon-diary`, Vercel 정적 배포

## Sprint 1 스코프 (11개)

INIT-1, BOOK-1, ALBUM-1, PAGE-1, BIB-1, PHOTO-1, RECORD-1, DECO-1, DATA-1, DESIGN-1, DEPLOY-1

## Open Questions (미결)

- OQ-1: 배번호 OCR(Tesseract.js) vs 수동 입력만
- OQ-2: 3D page-flip CSS transforms vs Three.js/WebGL
- OQ-3: monorepo vercel.json 충돌 방지 방안

**How to apply:** 기능 우선순위 결정 시 "배번호 중심 수집·꾸미기 경험" 기준. 완주증 슬롯 없음. IndexedDB 사용(localStorage 아님).
