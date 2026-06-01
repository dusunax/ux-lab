---
name: project-projection-art
description: projection-art 프로젝트 현황 — Sprint/1 완료, Sprint/2 웹캠 모션 인터랙션 확장 예정
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
| 인터랙션 | Mouse Event (Sprint/1), + 웹캠/MediaPipe (Sprint/2 예정) |
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

## Sprint/2 목표 (2026-06-01~)

웹캠 기반 모션 인터랙션 도입 — 신체 움직임 감지(MediaPipe)로 Demo D 구현 + 기존 3종 인터랙션 레이어 추상화.

### Sprint/2 주요 작업

- Demo D 신규 구현 (MediaPipe Pose/Hands + Three.js)
- `useMotionTracker` 커스텀 훅 구현
- 웹캠 권한 요청 UI + 마우스 폴백 모드
- 인터랙션 어댑터 추상화 (마우스 / 관절 좌표 동일 인터페이스)
- 프로젝션 키스톤 보정 UI (4코너 드래그 기반)
- 60fps 재검증 + 필요 시 Web Worker 오프로딩
- Vitest 테스트 확장

### Sprint/2 Open Questions (킥오프 미결)

- MediaPipe Pose vs Hands 모델 선택 — 레이턴시·번들 트레이드오프 (담당: PM + FE Avery)
- 인터랙션 어댑터 인터페이스 — 단일 포인트 vs 멀티포인트 배열 (담당: FE Avery + QA Morgan)
- 프로젝션 보정 수준 — CSS perspective vs Canvas 호모그래피 (담당: PERF Chase + FE Avery)

## 확정된 제외 범위

- 다중 프로젝터 연동 (Sprint/3+)
- Kinect / LiDAR 센서 연동 (하드웨어 의존성)
- 상용 전시 수준 프로젝션 매핑 (TouchDesigner/Resolume)
- 생성형 AI 비주얼 연동 (Sage 투입 필요, 향후 확장)
- 모바일 환경 대응
