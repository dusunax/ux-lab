---
name: project-projection-art
description: projection-art 신규 프로젝트 — Sprint 10에서 시작하는 인터랙티브 프로젝션 아트 PoC
metadata:
  type: project
---

Sprint 10(2026-05-29~)에 시작하는 신규 프로젝트. PoC 문서: `docs/PoC/projection-Interaction-PoC_260529.md`

**Why:** 수산시장 팀의 인터랙티브 미디어아트 기술 가능성 검증. "공간 자체가 반응하는 경험" 구현이 목표.

**How to apply:** 빌드 도구 없는 싱글 HTML 또는 바닐라 JS 구조를 우선 검토할 것. ai-empathy-diary와 유사한 정적 서빙 방식이 적합할 수 있음.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 렌더링 | WebGL |
| 그래픽 | p5.js / Three.js |
| 인터랙션 | Mouse Event |
| 실행 환경 | Chrome Browser |
| 출력 | HDMI + Projector |

## 구현 대상 데모

- **Demo A — Particle Flow**: 마우스 움직임 기반 입자·빛 생성·확산
- **Demo B — Neon Tunnel**: 사용자 입력 기반 시점·공간 왜곡 (3D 네온 터널, Three.js)
- **Demo C — Audio Reactive Visual**: Web Audio API + 마우스 동시 반응 비주얼

## 확정된 제외 범위

- 다중 프로젝터 연동
- 카메라 기반 사람 인식
- Kinect/LiDAR 센서 연동
- 상용 전시 수준 프로젝션 매핑
- 모바일 환경 대응

## 미결 질문 (Sprint 10 킥오프 기준)

- p5.js vs Three.js 라이브러리 선택 기준 (Demo별 분리 or 통일)
- 오디오 소스 방식 (로컬 파일 업로드 vs 마이크 입력 vs 하드코딩)
- 앱 디렉토리 구조 (`apps/projection-art/` 신설 여부)
- 프레임률 목표 수치 (60fps? 프로젝터 주사율 기준?)
