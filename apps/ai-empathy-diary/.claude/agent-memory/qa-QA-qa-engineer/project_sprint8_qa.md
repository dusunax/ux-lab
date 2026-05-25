---
name: project-sprint8-qa
description: Sprint 8 프로덕션 배포 QA 결과 — 핵심 발견사항 및 알려진 제한
metadata:
  type: project
---

Sprint 8 프로덕션 QA (2026-05-25) 실행 결과.

**PASS 항목:**
- QA-1 E2E 전체 플로우: Google 로그인 유지 → 일기 작성 → AI 응답 200 → 피드백 클릭 → 대시보드 통계 반영까지 전부 정상.
- QA-1 Authorization 헤더: `callChatApi()` 가 `Bearer <Firebase ID Token>` 포함하여 전송. 응답에 `modelLabel`($C$3), `request_id` 포함.
- QA-2 캐시 로딩: `model_labels` Firestore 컬렉션 6개 모델 seeding 완료 확인. `modelLabelCache.size === 6`.
- QA-2 폴백 순서 코드 정합성: `entry.modelLabel || modelLabelCache.get(entry.model) || entry.model || null` 구현 확인.
- QA-3 /api/log CORS: 프로덕션 도메인 OPTIONS → 204 + CORS 헤더 정상. POST → 204 정상.
- QA-3 콘솔 CORS 오류 없음: 브라우저에서 CORS 관련 에러 0건 (favicon 404만 존재).

**FAIL / 주의 항목:**
- QA-2 레거시 엔트리 5개가 `model` 필드도 없어 `resolvedLabel === null` — 피드백이 있어도 대시보드 통계에서 완전 누락됨. Sprint 6 이전 매우 초기 데이터로 보임. 폴백 3단계가 모두 null이면 `computeModelStats()`에서 `if (!label) return`으로 정상 skip — 기능적 버그는 아니나 데이터 손실.
- QA-3 /api/chat CORS 구조적 버그: OPTIONS preflight에서 토큰 검증(`verifyIdToken`)이 먼저 실행되어 401 반환. 브라우저는 preflight 실패 시 실제 POST를 보내지 않음. 그러나 실제 브라우저 테스트에서는 정상 동작함 — Vercel 엣지가 캐시된 CORS 또는 토큰이 Authorization 헤더 없이도 preflight를 통과시키는 것으로 추정되나 근거 불분명. 정확한 동작 이유 확인 필요.

**Why:** Sprint 8 메인 머지 전 manual promote 상태 QA. main 머지 판단 기준으로 활용.
**How to apply:** 향후 스프린트에서 `api/chat.js` OPTIONS preflight 분기 버그 재확인 필수.
