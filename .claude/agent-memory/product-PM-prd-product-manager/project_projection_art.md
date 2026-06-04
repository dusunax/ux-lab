---
name: project-projection-art
description: projection-art 프로젝트 현황 — Sprint/3 완료(Demo E + Pose + AI 비주얼 파라미터, 120 tests), Sprint/4 키스톤 UX 완성 + Pose Web Worker 오프로딩
metadata:
  type: project
---

Vite + React 18 + TypeScript 기반 인터랙티브 프로젝션 아트 PoC 프로젝트. PoC 문서: `docs/PoC/projection-Interaction-PoC_260529.md`

**Why:** 수산시장 팀의 인터랙티브 미디어아트 기술 가능성 검증. "공간 자체가 반응하는 경험" 구현이 목표.

**How to apply:** Vite + React 18 + TS 구조로 확정. ai-empathy-diary와 달리 빌드 도구 있음. 파일 크기 규칙 정상 적용.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 렌더링 | WebGL |
| 그래픽 | p5.js (Demo A), @react-three/fiber + drei (Demo B·C) |
| 인터랙션 | Mouse Event (Sprint/1) → MediaPipe Hands + InteractionPoint[][] 어댑터 (Sprint/2 완료) |
| 실행 환경 | Chrome Browser |
| 출력 | HDMI + Projector |

## Sprint/1 완료 항목 (2026-05-29~)

- `apps/projection-art/` Vite + React 18 + TypeScript 앱 신설
- Demo A: ParticleFlow (p5.js, 파티클 1000개+)
- Demo B: NeonTunnel (@react-three/fiber, 3D 네온 터널)
- Demo C: AudioReactiveVisual (Web Audio API, 오디오 반응형)
- 글로우·기하학 애니메이션 고도화
- requestAnimationFrame 기반 퍼포먼스 최적화 (60fps)
- Vitest 79 tests 통과
- Sprint/1 확정 결정: Demo A → p5.js / Demo B·C → Three.js, 오디오 소스 번들 mp3 + 마이크 선택 병행

## Sprint/2 완료 항목 (2026-06-01~)

웹캠 기반 모션 인터랙션 도입 — MediaPipe Hands로 Demo D 구현 + 기존 3종 인터랙션 레이어 추상화 완료.

### Sprint/2 확정 결정 사항

- MediaPipe Hands 모델 채택 — 손 관절 21개, avg 7~9ms 추론, 60fps 유지 확인
- 인터랙션 어댑터: `InteractionPoint[][]` 멀티포인트 배열 인터페이스 확정
- 프로젝션 키스톤 보정: CSS perspective + matrix3d, 4코너 드래그, localStorage 영속
- Demo D: HandReactive (MediaPipe Hands, 한손/양손 모드, Three.js 파티클 트레일) 구현 완료
- 마우스 폴백 제거 — 한손/양손 모드로 대체
- Vitest 103 tests 통과

### Sprint/2 이연 항목 → Sprint/3+

- MediaPipe Pose 전신 33관절 검토 — 번들·레이턴시 부담 이연
- Canvas 기반 호모그래피 프로젝션 보정 — PoC 과투자 이연
- 생성형 AI 비주얼 연동 — Sage 투입 필요

## Sprint/3 완료 항목 (2026-06-02~03)

전신 모션 + 생성형 AI 비주얼 연동 — MediaPipe Pose로 Demo E 구현 + LLM 기반 비주얼 파라미터 생성 도입. 120 tests, 16 test files.

### Sprint/3 확정 결정 사항

- MediaPipe Pose Web Worker 오프로딩 — 메인 스레드 우선 시도. 실측 후 드랍 발생 시 Worker 전환 (Worker 구현은 Sprint/4 이월)
- 생성형 AI 비주얼 파라미터 생성 — 이벤트 트리거 배치, 디바운스 1200ms 적용
- `useMotionTracker` 훅 `model: 'hands' | 'pose'` 옵션 추가, 기존 `InteractionPoint[][]` 인터페이스 호환 유지
- Demo E 커스터마이즈 UI: 포인트 색상 컬러 피커, 얼굴 표정 이모지 오버레이 추가
- 키스톤 보정 구현 시도 후 드래그 UX 미완성으로 제거 — Sprint/4 이월

### Sprint/3 이월 항목 → Sprint/4

- Web Worker 오프로딩 구현 — Pose 모델 Worker 분리, 좌표 직렬화 최적화 (미완료)
- 키스톤 보정 UX — CSS matrix3d 4코너 드래그 보정, 프로젝터 세팅용 (드래그 UX 미완성)

## Sprint/4 목표 (2026-06-03~)

키스톤 보정 UX 완성 + Web Worker 오프로딩으로 프로젝터 시연 품질 확보 — PoC 마무리 스프린트.

### Sprint/4 Open Questions

- Web Worker 오프로딩 — 좌표 직렬화 방식 확정 (SharedArrayBuffer vs Float32Array transferable) (담당: PERF Chase + FE Avery)
- 키스톤 보정 드래그 UX — 핸들 좌표 방식 확정 (절대 픽셀 vs 비율, 스냅 여부) (담당: FE Avery)
- 시연 프리셋 저장 방식 — URL 파라미터 vs JSON export vs localStorage 단독 (담당: FE Avery + PM Jordan)

## 확정된 제외 범위

- 다중 프로젝터 연동 (Sprint/3+, 하드웨어 환경 미확정)
- Canvas 기반 호모그래피 프로젝션 보정 (Sprint/2 결정: CSS matrix3d로 충분)
- Kinect / LiDAR 센서 연동 (하드웨어 의존성)
- 상용 전시 수준 프로젝션 매핑 (TouchDesigner/Resolume)
- 모바일 환경 대응 (프로젝션 전시 특성상 데스크톱 전용)
