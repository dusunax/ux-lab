---
name: project-underwater-demo
description: Demo E Underwater 테마 구현 — 중앙광 radial shader, 손끝 거품 trail, 플랑크톤, index satellite halo
metadata:
  type: project
---

Demo E Underwater 테마를 `#pose/underwater` 라우트로 구현 완료 (2026-06-06).

**기획/클라이언트 원문:**
- `docs/PoC/projection-art-이하나/2026-06-06-underwater-design-meeting.md`

**구현 파일:**
- `apps/projection-art/src/demos/PoseReactive/underwater/UnderwaterPoseReactive.tsx`
- `apps/projection-art/src/demos/PoseReactive/underwater/UnderwaterScene.tsx`
- `apps/projection-art/src/demos/PoseReactive/underwater/UnderwaterHands.tsx`
- `apps/projection-art/src/demos/PoseReactive/underwater/UnderwaterPlankton.tsx`
- `apps/projection-art/src/demos/PoseReactive/underwater/underwaterConstants.ts`
- `apps/projection-art/src/demos/PoseReactive/underwater/underwaterShaders.ts`

**핵심 구현 판단:**
- 파도 레이어는 프로젝션 화면에서 선형 UI가 과하게 단순해 보여 제거. 대신 배경 shader의 중앙 radial glow, caustic, edge shadow로 수중 공간감을 만든다.
- active 상태의 독립 플랑크톤 파티클은 렌더링하지 않는다. 카메라 허용 전 모달 배경에서만 플랑크톤을 노출한다.
- 손끝 인터랙션은 bubble ring sprite + trail로 표현한다. 검지만 더 큰 trail과 satellite halo를 갖고, 다른 손끝은 작은 bubble/trail로 보조한다.
- Underwater 전용 카메라 허용 모달은 글래스모피즘 UI와 프로젝트 맞춤 카피를 사용하며, 다른 Demo 화면에는 적용하지 않는다.

**Why:** 클라이언트(동화 작가) 디자인 회의 확정 스펙 구현. PoseReactive/PoseScene은 아카이브 보존.

**How to apply:** 이후 Underwater 관련 시각 변경은 클라이언트 회의 문서의 "살아있는 바닷속", "손 움직임에 따른 거품", "어두운 바다에 비추는 밝은 빛" 방향을 우선 기준으로 판단한다. [[project_sprint5_ux_overhaul]]
