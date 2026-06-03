# Sprint projection-art/4 킥오프 회의록

**날짜:** 2026-06-03
**프로젝트:** projection-art (인터랙티브 프로젝션 아트 PoC)
**참석자:** PM Jordan, FE Avery, PERF Chase, QA Morgan, QA Quinn, TS Alex, AI Sage, OC Sam
**진행자:** PM Jordan

---

## Sprint projection-art/4 목표

> **키스톤 보정 UX 완성 + Web Worker 오프로딩으로 프로젝터 시연 품질 확보 — PoC 마무리 스프린트.**

---

## 안건

| # | 구분 | 항목 |
|---|------|------|
| 1 | Open Question | Web Worker 오프로딩 — 좌표 직렬화 방식 확정 (SharedArrayBuffer vs Float32Array transferable) |
| 2 | Open Question | 키스톤 보정 드래그 UX — 핸들 좌표 방식 확정 (절대 픽셀 vs 비율, 스냅 여부) |
| 3 | Open Question | 시연 프리셋 저장 방식 — URL 파라미터 vs JSON export vs localStorage 단독 |
| 4 | 확정 | Sprint projection-art/4 스코프 및 수용 기준 확정 |

---

## 논의 내용

### 안건 1 — Web Worker 오프로딩 좌표 직렬화 방식

MediaPipe Pose 추론을 Web Worker로 분리할 때 관절 좌표 데이터 전달 방식이 성능에 직접 영향을 준다. SharedArrayBuffer는 복사 없이 메모리를 공유할 수 있어 오버헤드가 최소화되나, Cross-Origin Isolation 헤더(`COEP: require-corp`, `COOP: same-origin`)가 필요하여 Vite dev 환경 설정 변경이 선행되어야 한다. Float32Array transferable은 헤더 요구 없이 구조적 복제 알고리즘으로 전달되며 구현이 단순하지만, 전달 후 원본 ArrayBuffer가 무효화된다는 특성을 고려해야 한다.

**현재 상태:** PERF Chase + FE Avery가 Vite dev 환경 구성 가능 여부 확인 후 킥오프 중 확정 예정.

---

### 안건 2 — 키스톤 보정 드래그 핸들 좌표 방식

Sprint/3에서 CSS `matrix3d` 4코너 드래그 UX 구현을 시도했으나 미완성으로 제거된 이력이 있다. 이번 스프린트에서 재구현 시 핸들 좌표 방식을 먼저 확정해야 한다. 절대 픽셀 방식은 화면 해상도 변경 시 보정값이 무효화되는 문제가 있고, 비율 방식은 해상도 독립적이나 드래그 제스처 UX 구현이 상대적으로 복잡하다. 스냅 여부는 정밀 조정 vs 사용 편의성 트레이드오프이며 프로젝터 현장 조건에 따라 달라진다.

**현재 상태:** FE Avery가 구현 복잡도 재검토 후 킥오프 중 확정 예정.

---

### 안건 3 — 시연 프리셋 저장 방식

Demo 선택값과 키스톤 보정값을 하나의 시연 구성으로 저장·복원하는 방식을 확정해야 한다. URL 파라미터는 공유가 용이하고 북마크 가능하나 파라미터 길이 제한이 있다. JSON export는 파일로 내보내는 방식으로 유연성이 높으나 복원 시 파일 업로드 UI가 필요하다. localStorage 단독은 구현이 가장 단순하지만 브라우저 외부 공유가 불가능하다. PoC 마무리 스프린트 특성상 구현 비용 대비 실효성을 고려하여 결정한다.

**현재 상태:** FE Avery + PM Jordan이 PoC 요구 수준에 맞는 방식을 킥오프 중 확정 예정.

---

### 안건 4 — Sprint projection-art/4 스코프 및 수용 기준 확정

Open Question 결정 이후 스코프 및 수용 기준 확정 예정. 세부 내용은 아래 섹션에 명시.

---

## 결정 사항 요약

| # | 결정 내용 | 담당 |
|---|-----------|------|
| 1 | Sprint projection-art/4 스코프 확정 | 전원 |
| 2 | 수용 기준 확정 | 전원 |
| 3 | **Web Worker 좌표 직렬화 방식** — Float32Array transferable 채택 | PERF + FE |
| 4 | **키스톤 보정 드래그 핸들 좌표 방식** — 절대 픽셀, 스냅 없음 | FE |
| 5 | **시연 프리셋 저장 방식** — localStorage 단독 | FE + PM |

---

## Sprint projection-art/4 확정 스코프

| # | 항목 |
|---|------|
| 1 | 키스톤 보정 4코너 드래그 UX 완성 — CSS `matrix3d` 기반, localStorage 영속 |
| 2 | MediaPipe Pose Web Worker 오프로딩 구현 — 메인 스레드 분리, 좌표 직렬화 최적화 |
| 3 | 시연 프리셋 저장·복원 구현 — Demo 선택 + 키스톤 값 1개 이상 저장 가능 |
| 4 | 기존 116 tests 회귀 없이 통과 확인 |

---

## 수용 기준 (Acceptance Criteria)

- [ ] 키스톤 보정 — 4코너 핸들 드래그로 프로젝션 영역 조정 가능, 설정 localStorage 영속
- [ ] 키스톤 보정 — 드래그 핸들이 화면 좌표 방식(절대 픽셀 또는 비율) 확정 후 일관되게 동작
- [ ] Web Worker — Pose 모델 추론이 메인 스레드 분리 동작, 메인 스레드 fps 저하 없음
- [ ] Web Worker — Float32Array transferable 또는 SharedArrayBuffer 직렬화 방식 확정 후 구현
- [ ] 시연 프리셋 — 1개 이상의 시연 구성(Demo 선택 + 키스톤 값)을 저장·복원 가능
- [ ] 기존 116 tests 회귀 없이 통과

---

## 액션 아이템

**FE (Avery)**
- [ ] 키스톤 보정 4코너 드래그 UX 구현 — CSS `matrix3d`, 드래그 핸들 좌표 방식 확정 후 착수
- [ ] localStorage 영속 로직 구현 — 키스톤 보정값 저장·복원
- [ ] 시연 프리셋 저장·복원 UI 구현 — 저장 방식 OQ-3 결정 후 착수
- [ ] Web Worker 오프로딩 연동 — PERF Chase 구현과 인터페이스 맞춤

**PERF (Chase)**
- [ ] MediaPipe Pose Web Worker 오프로딩 구현 — Pose 모델 Worker 분리, 좌표 직렬화 방식 OQ-1 결정 후 착수
- [ ] Vite dev 환경 Cross-Origin Isolation 헤더 설정 (SharedArrayBuffer 선택 시)
- [ ] Worker 오프로딩 후 메인 스레드 fps 측정 검증

**QA (Morgan / Quinn)**
- [ ] `pnpm test` 실행 결과 0 failures 확인 (116 tests 이상)
- [ ] 수용 기준 전체 항목 검증 (키스톤 드래그, Web Worker 분리, 프리셋 저장·복원)

---

## Open Questions

| 질문 | 담당 | 기한 | 상태 |
|------|------|------|------|
| Web Worker 오프로딩 — 좌표 직렬화 방식 확정 (SharedArrayBuffer vs Float32Array transferable) | PERF Chase + FE Avery | Sprint projection-art/4 킥오프 | ✅ 결정: Float32Array transferable. 헤더 설정 불필요, PoC 수준에서 충분. |
| 키스톤 보정 드래그 UX — 핸들 좌표 방식 확정 (절대 픽셀 vs 비율, 스냅 여부) | FE Avery | Sprint projection-art/4 킥오프 | ✅ 결정: 절대 픽셀. 드래그 자연스럽고 구현 단순. 프로젝터 고정 해상도 환경에서 충분. |
| 시연 프리셋 저장 방식 — URL 파라미터 vs JSON export vs localStorage 단독 | FE Avery + PM Jordan | Sprint projection-art/4 킥오프 | ✅ 결정: localStorage 단독. PoC 마무리 스프린트 구현 비용 최소화. |

---

## 비고

### 이월 항목 (Sprint/3에서)

| 항목 | 이월 사유 |
|------|-----------|
| Web Worker 오프로딩 구현 | Pose 모델 레이턴시 실측 단계에서 메인 스레드 우선 시도로 결정 — Sprint/3 내 Worker 전환 불필요 판단, Sprint/4에서 완성 |
| 키스톤 보정 4코너 드래그 UX | CSS `matrix3d` 구현 시도 후 드래그 UX 미완성으로 Sprint/3 제거 — Sprint/4에서 재착수 |

### 리스크

- **SharedArrayBuffer Cross-Origin Isolation**: `COEP: require-corp` + `COOP: same-origin` 헤더 미설정 시 SharedArrayBuffer 사용 불가 — Vite dev 환경 설정 선행 필수
- **키스톤 드래그 UX 재구현 리스크**: Sprint/3에서 이미 한 번 제거 이력 — 구현 복잡도 재확인 및 MVP 범위 명확히 설정 필요
- **Scope Creep**: PoC 마무리 스프린트 성격상 추가 기능 요구 가능성 — 확정 스코프 외 작업은 Sprint/5 이후로 이연

### 제외 범위

| 항목 | 이연 사유 |
|------|-----------|
| 다중 프로젝터 연동 | 하드웨어 환경 미확정 |
| Canvas 기반 호모그래피 프로젝션 보정 | CSS `matrix3d`로 충분 — Sprint/2 결정 |
| Kinect / LiDAR 센서 연동 | 하드웨어 의존성 |
| 상용 전시 수준 프로젝션 매핑 (TouchDesigner/Resolume) | PoC 단계 이후 |
| 모바일 환경 대응 | 프로젝션 전시 특성상 데스크톱 전용 |
| 신규 Demo 추가 | PoC 마무리 스프린트 — Demo A~E 유지 |

---

*회의록 작성: TS Alex | 다음 회의: Sprint projection-art/4 리뷰*
