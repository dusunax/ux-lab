---
name: project-underwater-demo
description: Demo E Underwater 테마 구현 — 파도 레이어, 플랑크톤, 스켈레톤 glow 2패스, body trail
metadata:
  type: project
---

Demo E Underwater 테마를 `#pose/underwater` 라우트로 구현 완료 (2026-06-06).

**구현 파일:**
- `apps/projection-art/src/demos/PoseReactive/underwater/UnderwaterPoseReactive.tsx`
- `apps/projection-art/src/demos/PoseReactive/underwater/UnderwaterScene.tsx`

**핵심 구현 판단:**
- 파도 레이어 4겹은 `line_` JSX 태그 대신 `useEffect`에서 `THREE.Line` 인스턴스를 직접 생성하고 `useFrame`에서 `scene.add`로 주입하는 방식 채택. R3F에서 polyline을 렌더링하는 `<line>` JSX 태그가 타입 충돌이 심해 imperative 방식이 더 안전함.
- 스켈레톤 glow 2패스: `skeletonGlowGeoRef` / `skeletonCoreGeoRef` 두 개의 독립 geometry ref로 분리. useFrame에서 같은 positions를 양쪽에 각각 set.
- `BufferGeometry<NormalBufferAttributes, BufferGeometryEventMap>` ref 타입 에러는 pre-existing (@types/three 버전 이중 설치 충돌) — PoseScene.tsx와 동일하게 방치.

- `scene.add(line as any)` 캐스팅은 same @types/three 버전 충돌 우회용으로 eslint-disable 주석 병기.

**Why:** 클라이언트(동화 작가) 디자인 회의 확정 스펙 구현. PoseReactive/PoseScene은 아카이브 보존.

**How to apply:** 이후 Three.js 씬에서 polyline이 필요한 경우 JSX 대신 imperative THREE.Line + scene.add 패턴 선호. [[project_sprint5_ux_overhaul]]
