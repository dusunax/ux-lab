# Sprint projection-art/3 킥오프 회의록

**날짜:** 2026-06-02
**프로젝트:** projection-art (인터랙티브 프로젝션 아트 PoC)
**참석자:** PM Jordan, FE Avery, PERF Chase, QA Morgan, QA Quinn, TS Alex, AI Sage, OC Sam
**진행자:** PM Jordan

---

## Sprint projection-art/3 목표

> **전신 모션 + 생성형 AI 비주얼 연동 — MediaPipe Pose로 전신 관절 33개를 추적하여 Demo E를 구현하고, LLM 기반 비주얼 파라미터 생성으로 AI 반응형 연출을 도입한다.**

---

## 안건

| # | 구분 | 항목 |
|---|------|------|
| 1 | Open Question | MediaPipe Pose 모델 Web Worker 오프로딩 여부 — 전신 추론 레이턴시 vs 메인 스레드 부하 |
| 2 | Open Question | 생성형 AI 비주얼 파라미터 생성 방식 — 실시간 스트리밍 vs 이벤트 트리거 배치 |
| 3 | Open Question | Canvas 호모그래피 키스톤 보정 도입 범위 — 전면 교체 vs CSS perspective 병행 선택 UI |
| 4 | 확정 | Sprint projection-art/3 스코프 및 수용 기준 확정 |

---

## 논의 내용

### 안건 1 — MediaPipe Pose Web Worker 오프로딩 여부

MediaPipe Pose는 전신 33개 관절을 추출하는 고부하 모델로, Hands 모델 대비 추론 레이턴시가 약 3~5배 높다. Sprint/2에서 Hands 모델은 평균 7~9ms로 프레임 예산 내 허용됐으나, Pose 모델은 메인 스레드 실행 시 60fps 목표와 충돌할 가능성이 있다. Web Worker 오프로딩은 메인 스레드를 보호하나 구현 복잡도가 증가하고 관절 좌표 직렬화 오버헤드가 발생한다.

**현재 상태:** FE Avery + PERF Chase가 Pose 모델 레이턴시 실측 후 킥오프 중 확정 예정.

---

### 안건 2 — 생성형 AI 비주얼 파라미터 생성 방식

LLM 기반 비주얼 파라미터 생성은 모션 상태(포즈 분류, 속도, 에너지)를 입력으로 받아 색상 팔레트·파티클 밀도·이펙트 강도 등 비주얼 파라미터를 출력하는 방식이다. 실시간 스트리밍은 프레임 단위 반응이 가능하나 API 비용·레이턴시 리스크가 크다. 이벤트 트리거 배치는 포즈 변화 임계값 초과 시에만 호출하여 비용을 통제할 수 있으나 반응 지연이 체감될 수 있다.

**현재 상태:** AI Sage + PM Jordan이 비용·레이턴시 트레이드오프를 킥오프 중 확정 예정.

---

### 안건 3 — Canvas 호모그래피 키스톤 보정 도입 범위

Sprint/2에서 CSS `perspective + matrix3d` 방식으로 충분하다고 판단했으나, 실제 프로젝터 환경에서 사다리꼴 왜곡 보정의 정밀도 한계가 확인될 수 있다. Canvas 호모그래피는 4코너 → 4코너 매핑으로 정밀 보정이 가능하나 렌더링 파이프라인을 Canvas로 전환해야 하는 비용이 있다. 기존 CSS 방식과 병행 선택 UI를 제공하면 호환성을 유지하면서 점진적으로 전환할 수 있다.

**현재 상태:** FE Avery + PERF Chase가 정밀도 요구 수준을 확인 후 킥오프 중 확정 예정.

---

### 안건 4 — Sprint projection-art/3 스코프 및 수용 기준 확정

Open Question 결정 이후 스코프 및 수용 기준 확정 예정. 세부 내용은 아래 섹션에 명시.

---

## 결정 사항 요약

| # | 결정 내용 | 담당 |
|---|-----------|------|
| 1 | Sprint projection-art/3 스코프 확정 | 전원 |
| 2 | 수용 기준 확정 | 전원 |
| 3 | **MediaPipe Pose Web Worker 오프로딩 여부** — 실측 레이턴시 기반 확정 | PERF + FE |
| 4 | **생성형 AI 비주얼 파라미터 생성 방식** — 이벤트 트리거 배치 vs 실시간 스트리밍 확정 | AI + PM |
| 5 | **Canvas 호모그래피 도입 범위** — 전면 교체 vs CSS 병행 선택 UI 확정 | PERF + FE |

---

## Sprint projection-art/3 확정 스코프

| # | 항목 |
|---|------|
| 1 | Demo E 신규 구현 — MediaPipe Pose + Three.js 기반 전신 반응형 비주얼 (`PoseReactive`, `PoseScene`) |
| 2 | `useMotionTracker` 훅 확장 — `model: 'hands' \| 'pose'` 옵션 추가, Pose/Hands 전환 로직 |
| 3 | Web Worker 오프로딩 (OQ-1 결정 시) — Pose 추론을 Worker로 분리, 관절 좌표 직렬화 전송 |
| 4 | 생성형 AI 비주얼 파라미터 생성 — 포즈 분류·에너지 → LLM 호출 → 색상·파티클·이펙트 파라미터 반환 (`useAiVisualParams` 훅) |
| 5 | Canvas 호모그래피 키스톤 보정 (OQ-3 결정 범위에 따라) — 정밀 4코너 매핑 보정 또는 CSS 병행 선택 UI |
| 6 | 포즈 분류기 구현 — 관절 좌표 → 포즈 레이블 분류 유틸리티 (`classifyPose`) |
| 7 | 60fps 재검증 — Pose 모델 + WebGL + AI 호출 동시 부하 환경에서 프레임 예산 확인 |
| 8 | Vitest 테스트 확장 — `useAiVisualParams` 훅, 포즈 분류기, Worker 브릿지 단위 테스트 |

---

## 수용 기준 (Acceptance Criteria)

- [ ] Demo E가 Chrome에서 웹캠 권한 승인 후 MediaPipe Pose 전신 모션 추적으로 Three.js 비주얼이 반응함
- [ ] `useMotionTracker` 훅이 `model: 'hands' | 'pose'` 옵션으로 전환 가능하고 기존 `InteractionPoint[][]` 인터페이스 호환 유지
- [ ] MediaPipe Pose + WebGL 동시 부하 환경에서 60fps 유지 (연속 5분 이상)
- [ ] `useAiVisualParams` 훅이 포즈 상태 변화 시 LLM 파라미터 호출을 트리거하고 비주얼에 반영됨
- [ ] `pnpm test` (`vitest run`) 실행 시 전체 테스트 0 failures로 통과
- [ ] Canvas 호모그래피 (또는 CSS 병행 선택 UI)가 4코너 보정값을 저장·적용함

---

## 액션 아이템

**FE (Avery)**
- [ ] Demo E: MediaPipe Pose + Three.js 기반 전신 반응형 비주얼 컴포넌트 구현 (`PoseReactive`, `PoseScene`)
- [ ] `useMotionTracker` 훅 확장 — `model` 옵션 추가, Pose/Hands 전환 로직 구현
- [ ] 포즈 분류기 유틸리티 구현 — 관절 좌표 → 포즈 레이블 분류 (`classifyPose`)
- [ ] `useAiVisualParams` 커스텀 훅 구현 — 포즈 이벤트 트리거 → AI 파라미터 요청 → 비주얼 파라미터 반환
- [ ] Canvas 호모그래피 키스톤 보정 구현 또는 CSS 병행 선택 UI 추가 (OQ-3 결정에 따라)
- [ ] 단위 테스트 작성 — `useAiVisualParams` 훅, 포즈 분류기, Demo E 컴포넌트

**PERF (Chase)**
- [ ] MediaPipe Pose 추론 레이턴시 실측 — Web Worker 오프로딩 필요 여부 판단
- [ ] Web Worker 오프로딩 구현 (OQ-1 결정 시) — Pose 모델 Worker 분리, 좌표 직렬화 최적화
- [ ] Pose + WebGL + AI 동시 부하 환경 60fps 재검증 (연속 5분 이상)

**AI (Sage)**
- [ ] LLM 비주얼 파라미터 생성 프롬프트 설계 — 포즈 입력 → 비주얼 파라미터 JSON 출력 스펙 정의
- [ ] `useAiVisualParams` 훅의 API 호출 방식 설계 — 이벤트 트리거 배치 구현, 비용·레이턴시 모니터링

**QA (Morgan / Quinn)**
- [ ] `pnpm test` 실행 결과 0 failures 확인
- [ ] 수용 기준 전체 항목 검증 (Demo E 동작, 포즈 전환, AI 파라미터 반영)
- [ ] Pose 모델 레이턴시 및 60fps 유지 검증 — 실기기 시연

---

## Open Questions

| 질문 | 담당 | 기한 | 상태 |
|------|------|------|------|
| MediaPipe Pose Web Worker 오프로딩 여부 — 전신 추론 레이턴시 실측 후 결정 | PERF Chase + FE Avery | Sprint projection-art/3 킥오프 | ⚠️ Open |
| 생성형 AI 비주얼 파라미터 생성 방식 — 실시간 스트리밍 vs 이벤트 트리거 배치 | AI Sage + PM Jordan | Sprint projection-art/3 킥오프 | ⚠️ Open |
| Canvas 호모그래피 키스톤 보정 도입 범위 — 전면 교체 vs CSS perspective 병행 선택 UI | PERF Chase + FE Avery | Sprint projection-art/3 킥오프 | ⚠️ Open |

---

## 비고

### 리스크

- **Pose 모델 레이턴시**: 전신 33관절 추론이 메인 스레드에서 60fps 목표와 충돌 가능 — Web Worker 오프로딩 사전 검토 필수
- **LLM API 비용**: 포즈 변화 이벤트 빈도에 따라 API 호출이 급증할 수 있음 — 디바운스·쓰로틀 전략 필수
- **AI 응답 레이턴시**: LLM 응답 시간(100ms~수초)이 실시간 비주얼 반응과 충돌 — 파라미터 보간(lerp) 또는 캐싱 전략 필요
- **Canvas 호모그래피 전환 비용**: 기존 CSS 기반 렌더링 파이프라인 변경 시 기존 3종 데모 호환성 검토 필요

### 제외 범위

| 항목 | 이연 사유 |
|------|-----------|
| 다중 프로젝터 연동 | Sprint projection-art/4+ |
| Kinect / LiDAR 센서 연동 | 하드웨어 의존성 |
| 상용 전시 수준 프로젝션 매핑 (TouchDesigner/Resolume) | PoC 단계 이후 |
| 모바일 환경 대응 | 프로젝터 + PC 환경에 집중 |
| 실시간 AI 스트리밍 비주얼 (프레임 단위) | 비용·레이턴시 리스크, Sprint/4+ 검토 |

---

*회의록 작성: TS Alex | 다음 회의: Sprint projection-art/3 리뷰*
