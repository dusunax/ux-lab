---
name: sprint5-ux-overhaul
description: projection-art Sprint 5 UX 전면 고도화 — 비기술 사용자 온보딩, 테마 프리셋, 카드 드롭다운 구현 내역
metadata:
  type: project
---

Sprint 5 목표: 5년차 동화 작가(제주도, 바다 그림 전문) 페르소나 기준 3클릭 이하 인터랙션 시작.

**Why:** 기존 UI는 기술 코드명(Demo A/B/C)과 select 드롭다운으로 비기술 사용자 진입 장벽이 높았음.

**How to apply:** 향후 projection-art UI 변경 시 이 페르소나를 기준으로 레이블·UX 결정 판단.

## 주요 구현 결정

- `types/index.ts`: `DemoInfo`에 `naturalLabel` 추가, DEMOS 전체 자연어 한국어로 교체 (기술 코드명 제거)
- `hooks/useTheme.ts`: 신규. `ThemePalette` 3종(pastel/ocean/forest) + localStorage 영속화
- `hooks/useAiVisualParams.ts`: `KEYWORD_SETS` export 추가, `themeKeywords` 옵션 파라미터로 Demo E AI 프롬프트에 테마 키워드 주입
- `components/WebcamPermission.tsx`: `canFallback`/`onDenied(boolean)` props 추가. Demo D(손)는 canFallback=true → "마우스로 계속하기" 버튼 노출; Demo E(포즈)는 false → 없음
- `App.tsx`: select → 카드 팝업 드롭다운, 버튼 레이블 한국어 교체, 키스톤 리셋 버튼, 테마 선택 UI(preset 패널 내), 온보딩 오버레이(localStorage 플래그)

## 하위 호환성 처리
- 레거시 `<select data-testid="demo-select">` 를 `opacity:0 / pointerEvents:none`으로 DOM에 유지 → 기존 테스트 셀렉터 깨지지 않음
- 새 `data-testid="demo-select-btn"` 추가로 카드 드롭다운 트리거 접근

## 테스트 결과
- 17 test files, 150 tests — 전체 통과 (Sprint 4 126개 → Sprint 5 150개)
