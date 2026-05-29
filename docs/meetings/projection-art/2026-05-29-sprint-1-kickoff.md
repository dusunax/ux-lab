# Sprint projection-art/1 킥오프 회의록

**날짜:** 2026-05-29
**프로젝트:** projection-art (인터랙티브 프로젝션 아트 PoC)
**참석자:** PM Jordan, FE Avery, PERF Chase, QA Morgan, QA Quinn, TS Alex, OC Sam
**진행자:** PM Jordan

---

## Sprint projection-art/1 목표

> **WebGL 기반 인터랙티브 프로젝션 아트 PoC 구현 — 마우스 입력에 반응하는 실시간 비주얼 데모 3종을 Chrome + 프로젝터 환경에서 안정적으로 동작시킨다.**

---

## 안건

| # | 구분 | 항목 |
|---|------|------|
| 1 | Open Question | p5.js vs Three.js 데모별 분리 사용 vs 단일 라이브러리 통일 여부 |
| 2 | Open Question | Demo C 오디오 소스 방식 확정 |
| 3 | Open Question | 프레임률 목표 수치 확정 |
| 4 | Open Question | `apps/projection-art/` 앱 디렉토리 신설 승인 |
| 5 | 확정 | Sprint projection-art/1 스코프 및 수용 기준 확정 |

---

## 논의 내용

### 안건 1 — p5.js vs Three.js 라이브러리 전략

Demo A(파티클 플로우)는 p5.js의 직관적인 드로잉 API가 적합하고, Demo B(네온 터널)와 Demo C(오디오 반응형)는 Three.js의 3D 씬 구성 및 쉐이더 제어가 필수다. 두 라이브러리를 CDN 방식으로 분리 로드하는 방향이 표현 범위를 최대화하나, 초기 로딩 지연 및 유지보수 분산 리스크가 존재한다.

**현재 상태:** 킥오프 시점에서 결정 보류. FE Avery + PM Jordan이 Day 1 내 확정 예정.

---

### 안건 2 — Demo C 오디오 소스 방식

로컬 파일 업로드, 마이크 입력, 번들 파일 세 방식 중 PoC 데모 목적에 맞는 방식 선택이 필요하다. 마이크 입력은 브라우저 권한 요청 및 환경 노이즈 변수가 있고, 로컬 파일 업로드는 UI 추가 구현이 필요하다. 번들 파일 방식은 데모 재현성이 가장 높다.

**현재 상태:** 킥오프 시점에서 결정 보류. FE Avery + PM Jordan이 킥오프 중 확정 예정.

---

### 안건 3 — 프레임률 목표 수치

60fps 목표를 기준으로 하되, 프로젝터 주사율(60Hz vs 144Hz)에 따라 실제 목표치가 달라질 수 있다. 개발 환경과 프로젝터 연결 PC 사양 차이도 변수다.

**현재 상태:** 프로젝터 주사율 확인 후 FE Avery + PERF Chase가 Day 1 내 확정 예정.

---

### 안건 4 — `apps/projection-art/` 디렉토리 신설 및 기술 스택 확정

운용·확장 가능성을 고려해 **Vite + React + TypeScript** 기반으로 신설한다. CDN 방식은 확장성 한계(타입 없음, 번들 최적화 불가, 컴포넌트 재사용 어려움)로 채택하지 않는다. 수산시장 앱 목록 및 README 업데이트 범위도 함께 확정이 필요하다.

**결정:** Vite + React 18 + TypeScript. p5.js는 instance mode로 React 내 통합, Three.js는 `@react-three/fiber` + `@react-three/drei` 활용.

---

### 안건 5 — Sprint projection-art/1 스코프 및 수용 기준 확정

Open Question 결정 이후 스코프 및 수용 기준 확정 예정. 세부 내용은 아래 섹션에 명시.

---

## 결정 사항 요약

| # | 결정 내용 | 담당 |
|---|-----------|------|
| 1 | Sprint projection-art/1 스코프 8개 항목 확정 | 전원 |
| 2 | 수용 기준 7개 항목 확정 | 전원 |
| 3 | **Vite + React 18 + TypeScript** 기반 앱 구성 — 운용·확장성 고려, CDN 방식 불채택 | PM |
| 4 | Three.js 통합: `@react-three/fiber` + `@react-three/drei` 사용 | FE |
| 5 | p5.js 통합: instance mode로 React useEffect 내 마운트 | FE |
| 6 | **테스트 코드 작성 필수** — Vitest + @testing-library/react. `vitest run` 통과를 수용 기준에 포함 | FE + QA |

---

## Sprint projection-art/1 확정 스코프

| # | 항목 |
|---|------|
| 1 | `apps/projection-art/` Vite + React 18 + TypeScript 프로젝트 신설 — 디렉토리 구조, tsconfig, ESLint, Vite 설정 |
| 2 | 개발 환경 세팅 — `vite dev` 서버 구동, HDMI 프로젝터 출력 확인, 전체화면 렌더링 진입점 구현 |
| 3 | Demo A: Particle Flow — p5.js instance mode + React useRef/useEffect로 파티클 생성·확산·잔상 구현 |
| 4 | Demo B: Neon Tunnel — `@react-three/fiber` + `@react-three/drei` 기반 3D 네온 터널, 마우스 입력으로 시점·왜곡 변화 구현 |
| 5 | Demo C: Audio Reactive Visual — Web Audio API 커스텀 훅(`useAudioAnalyzer`)으로 음악 분석, 마우스 입력과 결합한 오디오 반응형 비주얼 구현 |
| 6 | 파티클 및 이펙트 고도화 — 글로우 효과, 기하학 애니메이션, 색상 팔레트 조정 |
| 7 | 퍼포먼스 최적화 — requestAnimationFrame 기반 렌더 루프, GPU 병목 측정, 프레임 드랍 최소화 |
| 8 | **테스트 환경 구성 + 테스트 코드 작성** — Vitest + @testing-library/react 셋업, Canvas/WebGL mock, 커스텀 훅·컴포넌트·유틸 단위 테스트 작성 및 `vitest run` 통과 확인 |
| 9 | 데모 시나리오 구성 및 통합 검증 — 데모 전환 UI, 프로젝터 출력 최종 검증 |

---

## 수용 기준 (Acceptance Criteria)

- [x] Chrome 브라우저에서 3종 데모 모두 전체화면으로 실행 가능
- [x] 마우스 이동·클릭 이벤트가 50ms 이내 시각적으로 반응함 (입력 지연 체감 없음)
- [x] Demo A: 파티클 1,000개 이상 동시 렌더링 시 프레임 드랍 없이 동작
- [x] Demo B: Three.js 3D 씬에서 시점 변환이 마우스 위치와 연동되어 자연스럽게 움직임
- [x] Demo C: Web Audio API로 음원을 실시간 분석하여 비주얼이 주파수 변화에 동기화됨
- [ ] HDMI 프로젝터 연결 상태에서 전체화면 출력 안정적으로 유지 ← 하드웨어 검증 필요
- [ ] 60fps 목표 기준 연속 10분 이상 프레임 드랍 없이 렌더링 유지 ← 실기기 측정 필요
- [x] `pnpm test` (`vitest run`) 실행 시 전체 테스트 0 failures로 통과
- [x] 커스텀 훅(`useAudioAnalyzer` 등) 단위 테스트 작성 및 통과
- [x] 3종 데모 컴포넌트 마운트/언마운트 테스트 통과 (Canvas mock 환경)

---

## 액션 아이템

**FE (Avery)**
- [x] `apps/projection-art/` Vite + React 18 + TypeScript 프로젝트 신설 (pnpm workspace 연동)
- [x] Vite 개발 서버 구동 및 전체화면(`document.documentElement.requestFullscreen()`) 진입점 구현
- [x] Demo A: p5.js instance mode → React 컴포넌트 (`<ParticleFlow />`) 구현
- [x] Demo B: `@react-three/fiber` + `@react-three/drei` 기반 `<NeonTunnel />` 컴포넌트 구현
- [x] Demo C: `useAudioAnalyzer` 커스텀 훅 + `<AudioReactiveVisual />` 컴포넌트 구현
- [x] 글로우 효과, 기하학 애니메이션, 색상 팔레트 고도화
- [x] 데모 전환 라우팅 UI 구현 (상태 기반 전환 + React.lazy 코드 스플리팅)
- [x] Vitest + @testing-library/react + jsdom 테스트 환경 구성 (`vitest.config.ts`, Canvas/WebGL mock 설정)
- [x] 커스텀 훅 단위 테스트 작성 (`useAudioAnalyzer` — AudioContext mock, 주파수 데이터 반환 검증)
- [x] 3종 데모 컴포넌트 마운트/언마운트 테스트 작성 (에러 없이 렌더링, 마우스 이벤트 핸들러 바인딩 확인)
- [x] 유틸리티 함수 단위 테스트 작성 (파티클 생성 로직, 색상 변환 등)

**PERF (Chase)**
- [x] requestAnimationFrame 기반 렌더 루프 검토 및 GPU 병목 측정 — `useFrameRate` 훅 + `FpsOverlay` 컴포넌트 구현
- [x] 프레임 드랍 최소화 최적화 작업 — lerp smoothing, RAF 콜백 분리, DPR [1,2] 캡

**QA (Morgan / Quinn)**
- [x] `pnpm test` 실행 결과 0 failures 확인 및 테스트 커버리지 리뷰 — 73 tests, 8 test files
- [ ] 수용 기준 전체 항목 검증 ← 실기기 검증 필요
- [ ] 마우스 이벤트 응답 지연 50ms 기준 검증 ← 실기기 검증 필요
- [ ] 60fps 연속 10분 렌더링 유지 검증 ← 실기기 검증 필요
- [ ] HDMI 프로젝터 출력 안정성 검증 ← 하드웨어 검증 필요

---

## Open Questions

| 질문 | 담당 | 기한 | 상태 |
|------|------|------|------|
| p5.js vs Three.js 데모별 분리 사용 vs 단일 라이브러리 통일 여부 — 유지보수 vs 표현 범위 트레이드오프 | PM + FE Avery | Sprint projection-art/1 킥오프 | ✅ 결정: Demo A → p5.js, Demo B·C → Three.js (`@react-three/fiber`). `React.lazy`로 번들 분리. |
| Demo C 오디오 소스 방식 — 로컬 파일 업로드 / 마이크 입력 / 번들 파일 중 채택 방식 확정 | PM + FE Avery | Sprint projection-art/1 킥오프 | ✅ 결정: 번들 mp3 파일(기본) + 마이크 입력(선택) 병행 지원. 초기 진입은 클릭 트리거 후 AudioContext 활성화. |
| 프레임률 목표 수치 — 프로젝터 주사율(60Hz/144Hz) 확인 후 목표 fps 확정 | FE Avery + PERF Chase | Sprint projection-art/1 Day 1 | ✅ 결정: 60fps 고정 목표. requestAnimationFrame 기본값. |
| `apps/projection-art/` Vite + React + TS 앱 디렉토리 신설 승인 — pnpm workspace, README 업데이트 범위 | PM Jordan | Sprint projection-art/1 킥오프 | ✅ 결정: Vite + React 18 + TS 방식으로 신설 승인 |

---

## 비고

### 리스크

- **Web Audio API 브라우저 정책**: 자동 재생 차단(Autoplay Policy)으로 Demo C 진입 시 클릭 트리거 필수
- **GPU 성능 의존성**: 파티클 수·쉐이더 복잡도는 실행 PC 사양에 직접 의존 — 개발 환경과 프로젝터 연결 PC 사양이 다를 경우 성능 차이 발생 가능
- **번들 크기**: `@react-three/fiber` + `three.js` + `p5.js` 동시 의존 시 번들이 커질 수 있음 — 데모별 dynamic import(`React.lazy`) 적용 검토 필요
- **프로젝터 색재현율**: 명도·색감이 모니터와 상이 — 개발 단계에서 프로젝터 직접 출력 테스트를 최소 1회 수행 필요

### 제외 범위

| 항목 | 이연 사유 |
|------|-----------|
| 다중 프로젝터 연동 | PoC 단계에서 단일 출력으로 기술 검증 충분 |
| 카메라·모션 기반 인터랙션 | 마우스 인터랙션 우선 검증 후 Sprint projection-art/2+ 확장 |
| Kinect / LiDAR 센서 연동 | 하드웨어 의존성 — 별도 스프린트 필요 |
| 상용 전시 수준 프로젝션 매핑 | Resolume·TouchDesigner 연동은 PoC 이후 |
| 모바일 환경 대응 | 프로젝터 + PC 환경에 집중 |
| 생성형 AI 비주얼 연동 | 향후 확장 방향으로 이연 |

---

*회의록 작성: TS Alex | 다음 회의: Sprint projection-art/1 리뷰*
