# Sprint projection-art/2 킥오프 회의록

**날짜:** 2026-06-01
**프로젝트:** projection-art (인터랙티브 프로젝션 아트 PoC)
**참석자:** PM Jordan, FE Avery, PERF Chase, QA Morgan, QA Quinn, TS Alex, OC Sam
**진행자:** PM Jordan

---

## Sprint projection-art/2 목표

> **웹캠 기반 모션 인터랙션 도입 — MediaPipe로 신체 움직임을 감지하여 Demo D를 구현하고, 기존 3종 데모의 인터랙션 레이어를 어댑터 패턴으로 추상화한다.**

---

## 안건

| # | 구분 | 항목 |
|---|------|------|
| 1 | Open Question | MediaPipe Pose vs Hands 모델 선택 — 레이턴시·번들 크기 트레이드오프 |
| 2 | Open Question | 인터랙션 어댑터 인터페이스 설계 — 단일 포인트 vs 멀티포인트 배열 |
| 3 | Open Question | 프로젝션 키스톤 보정 수준 — CSS perspective vs Canvas 호모그래피 |
| 4 | 확정 | Sprint projection-art/2 스코프 및 수용 기준 확정 |

---

## 논의 내용

### 안건 1 — MediaPipe Pose vs Hands 모델 선택

MediaPipe Pose는 전신 33개 관절 좌표를 추출하며 공간감 있는 반응형 비주얼에 적합하나, 번들 크기가 크고 추론 레이턴시가 상대적으로 높다. Hands 모델은 21개 손 관절에 특화되어 번들이 가볍고 레이턴시가 낮으나 표현 범위가 상체 동작에 한정된다. PoC Demo D의 표현 목표(신체 반응형 비주얼)와 60fps 유지 요건을 동시에 충족해야 하므로, 모델 선택이 성능 리스크와 직결된다.

**결정:** MediaPipe Hands 모델 채택. 손 관절 21개로 60fps 유지에 유리. Pose 모델은 번들·레이턴시 부담으로 Sprint/3+ 검토.

---

### 안건 2 — 인터랙션 어댑터 인터페이스 설계

마우스 입력(x, y 단일 좌표)과 MediaPipe 관절 좌표(다수 키포인트 배열)를 동일 인터페이스로 통합하는 어댑터 설계 방향이 논의됐다. 단일 포인트 인터페이스는 기존 3종 데모와의 호환이 쉬우나 멀티포인트 활용이 불가하다. 멀티포인트 배열 인터페이스는 Demo D의 표현 자유도가 높으나 기존 데모 코드 수정이 필요하다.

**결정:** 멀티포인트 배열 `InteractionPoint[]` 채택. Hands 21개 관절 전체 활용 가능. 마우스 어댑터는 단일 요소 배열로 감싸 통일. 기존 3종 데모는 `points[0]` 읽도록 최소 수정.

---

### 안건 3 — 프로젝션 키스톤 보정 수준

CSS `perspective` + `transform` 방식은 구현이 단순하고 브라우저 GPU 가속을 그대로 활용하나, 정밀한 4코너 보정에는 호모그래피 변환 정확도가 낮다. Canvas 기반 호모그래피는 정밀한 투사 보정이 가능하나 구현 복잡도가 높고 PoC 단계에서 과투자가 될 수 있다.

**결정:** CSS perspective + `matrix3d` 방식 채택. 4코너 드래그 UI로 브라우저 GPU 가속 그대로 활용. Canvas 호모그래피는 PoC 과투자 판단으로 Sprint/3+ 이연.

---

### 안건 4 — Sprint projection-art/2 스코프 및 수용 기준 확정

Open Question 결정 이후 스코프 및 수용 기준 확정 예정. 세부 내용은 아래 섹션에 명시.

---

## 결정 사항 요약

| # | 결정 내용 | 담당 |
|---|-----------|------|
| 1 | Sprint projection-art/2 스코프 6개 항목 확정 | 전원 |
| 2 | 수용 기준 6개 항목 확정 | 전원 |
| 3 | **MediaPipe Hands 모델 채택** — 손 관절 21개, 낮은 레이턴시로 60fps 유지에 유리 | PM + FE |
| 4 | **인터랙션 어댑터: 멀티포인트 배열** — `InteractionPoint[]`, 마우스는 단일 요소 배열로 감싸 통일. Hands 21개 관절 전체 활용, 기존 데모는 `points[0]` 읽도록 최소 수정 | FE + QA |
| 5 | **프로젝션 키스톤 보정: CSS perspective** — `matrix3d` 기반 4코너 드래그 보정. PoC 수준에서 Canvas 호모그래피 과투자 판단, Canvas 호모그래피는 Sprint/3+ 이연 | PERF + FE |

---

## Sprint projection-art/2 확정 스코프

| # | 항목 |
|---|------|
| 1 | Demo D 신규 구현 — MediaPipe Pose/Hands + Three.js 기반 신체 반응형 비주얼 |
| 2 | `useMotionTracker` 커스텀 훅 구현 — 웹캠 스트림 → 관절 좌표 추출 |
| 3 | 웹캠 권한 요청 UI — 카메라 불가 시 기능 동작 안됨 표시 |
| 4 | 인터랙션 어댑터 추상화 — 마우스 / 관절 좌표를 동일 인터페이스로 통합 |
| 5 | 프로젝션 키스톤 보정 UI — 4코너 드래그 기반 간이 보정 |
| 6 | 60fps 재검증 + 필요 시 Web Worker 오프로딩 |
| 7 | Vitest 테스트 확장 — `useMotionTracker` 훅 및 어댑터 단위 테스트 |

---

## 수용 기준 (Acceptance Criteria)

- [x] Demo D가 Chrome에서 웹캠 권한 승인 후 MediaPipe 모션 추적으로 Three.js 비주얼이 반응함 ← 실기기 시연 확인 완료
- [x] 인터랙션 어댑터: 관절 좌표 입력이 `InteractionPoint[][]` 인터페이스로 기존 3종 데모에 적용 가능
- [x] MediaPipe + WebGL 동시 부하 환경에서 60fps 유지 (연속 5분 이상) ← 실기기 확인 완료
- [x] `pnpm test` (`vitest run`) 실행 시 전체 테스트 0 failures로 통과 ← 104 tests, 13 test files
- [x] `useMotionTracker` 훅 단위 테스트 작성 및 통과 (웹캠 mock 환경) ← 6 tests
- [x] 프로젝션 키스톤 보정 UI가 4코너 드래그로 보정값 저장·적용됨

---

## 액션 아이템

**FE (Avery)**
- [x] Demo D: MediaPipe Hands + Three.js 기반 신체 반응형 비주얼 컴포넌트 구현 (`HandReactive`, `HandScene`)
- [x] `useMotionTracker` 커스텀 훅 구현 — 웹캠 스트림 초기화 및 관절 좌표 추출 (idle→requesting→loading→active 상태 기계)
- [x] 웹캠 권한 요청 UI 구현 — 카메라 불가 시 기능 동작 안됨 표시 (`WebcamPermission`)
- [x] 인터랙션 어댑터 추상화 — `InteractionPoint[]` 통일 인터페이스, `mouseToPoints` / `landmarksToPoints` 구현
- [x] 프로젝션 키스톤 보정 UI — CSS `matrix3d` 4코너 드래그 기반 간이 보정, localStorage 저장·적용 (`KeystoneOverlay`)
- [x] `useMotionTracker` 훅 단위 테스트 작성 (웹캠 mock 환경, 관절 좌표 반환 검증) — 6 tests
- [x] 어댑터 인터페이스 단위 테스트 작성 (마우스 / 관절 좌표 입력 동등성 검증) — 6 tests

**PERF (Chase)**
- [x] MediaPipe + WebGL 동시 부하 환경에서 60fps 유지 재검증 (연속 5분 이상) ← 실기기 프로젝터 시연 확인 완료
- [ ] MediaPipe 추론 레이턴시 측정 — 메인 스레드 영향 평가 및 Web Worker 오프로딩 설계 검토

**QA (Morgan / Quinn)**
- [x] `pnpm test` 실행 결과 0 failures 확인 — 104 tests, 13 test files
- [x] 수용 기준 전체 항목 검증 (Demo D 동작, 어댑터 적용) ← 실기기 시연 양호 확인 완료
- [x] 모션 입력 지연 검증 — 실기기 시연에서 체감 지연 없음 확인 완료

---

## Open Questions

| 질문 | 담당 | 기한 | 상태 |
|------|------|------|------|
| MediaPipe Pose vs Hands 모델 선택 — 레이턴시·번들 크기 트레이드오프 | PM + FE Avery | Sprint projection-art/2 킥오프 | ✅ 결정: MediaPipe Hands. 손 관절 21개, 레이턴시 낮아 60fps 유리. |
| 인터랙션 어댑터 인터페이스 설계 — 단일 포인트 vs 멀티포인트 배열 | FE Avery + QA Morgan | Sprint projection-art/2 킥오프 | ✅ 결정: 멀티포인트 배열 `InteractionPoint[]`. 마우스는 단일 요소 배열로 감싸 통일. 기존 데모는 `points[0]` 최소 수정. |
| 프로젝션 키스톤 보정 수준 — CSS perspective vs Canvas 호모그래피 | PERF Chase + FE Avery | Sprint projection-art/2 킥오프 | ✅ 결정: CSS perspective + `matrix3d`. PoC 수준 충분. Canvas 호모그래피는 Sprint/3+ 이연. |

---

## 비고

### 리스크

- **MediaPipe 추론 레이턴시**: 모델 추론이 메인 스레드에서 실행될 경우 60fps 목표와 충돌 — Web Worker 오프로딩 사전 검토 필요
- **웹캠 + WebGL 동시 부하**: 두 GPU 집약 작업이 동시 실행 시 프레임 드랍 가능성
- **웹캠 브라우저 권한 정책**: HTTPS 환경 필수, 개발 서버 localhost에서는 예외 허용되나 프로덕션 환경 확인 필요

### 제외 범위

| 항목 | 이연 사유 |
|------|-----------|
| 다중 프로젝터 연동 | Sprint projection-art/3+ |
| Kinect / LiDAR 센서 연동 | 하드웨어 의존성 |
| 상용 전시 수준 프로젝션 매핑 (TouchDesigner/Resolume) | PoC 단계 이후 |
| 생성형 AI 비주얼 연동 | Sage 투입 필요, 향후 확장 |
| 모바일 환경 대응 | 프로젝터 + PC 환경에 집중 |

---

*회의록 작성: TS Alex | 다음 회의: Sprint projection-art/2 리뷰*
