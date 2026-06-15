---
name: project-quiz-drill-ai
description: quiz-drill-ai 앱의 스프린트 진행 현황, 확정 기술 결정, 이연 항목
metadata:
  type: project
---

CSV 파일 한 장으로 즉시 시험 대비 퀴즈를 시작하는 최소 학습 도구.
Vite + React + TypeScript + Tailwind 스택, `apps/quiz-drill-ai` 경로.

## Sprint 1 완료 (2026-06-13 기준)

- INIT-1: Vite + React + TypeScript + Tailwind 초기 세팅
- CSV-1~3: 파일 업로드 + 붙여넣기 탭 UI, zod 스키마 검증 파서, 오류 처리
- QUIZ-1~5: 랜덤 출제, 퀴즈 화면, 정답 확인, 해설, 진행 상태
- SESSION-1: 세션 완료 화면 (다시 풀기 + 오답만 풀기)
- TypeScript strict 에러 0, 빌드 성공

**Why:** CSV 한 장으로 동작하는 PoC 검증이 목표였고 완전 달성.

## Sprint 2 핵심 스코프 (확정)

- STORE-1~2: LocalStorage 정답/오답 저장 + 오답 다시 풀기 세션 지속
- STAT-1~2: 세션 통계 표시 + 누적 학습 이력 뷰
- UX-1: Enter 키 단축키 (다음 문제 / 결과 보기 트리거)
- UX-2: 풀이 시간 표시 (세션 총 시간 또는 문제별 시간)
- DEPLOY-1: Vercel 정적 배포 (`apps/quiz-drill-ai`)

## 이연 결정

| 항목 | 이연 시점 | 근거 |
|------|-----------|------|
| 카테고리/필터 | Sprint 3+ | 문항 볼륨 충분해야 필터 효용 발생 |
| AI 채팅 (OpenRouter) | Sprint 3 | 퀴즈 UX 안정화 이후 연동 |
| 모바일 반응형 최적화 | Sprint 2 이후 | 기능 안정화 선행 |

## 기술 결정

- Quiz 타입: `id`, `category`, `question`, `options[4]`, `answer(1-based)`, `explanation`
- QuizResult: `quizId`, `status(untouched|correct|wrong)`, `selectedOption`
- 상태 관리: `useQuizSession` 훅 중심, Map 기반 results
- 저장소: LocalStorage (Sprint 2 도입 예정)

**How to apply:** Sprint 2 설계 시 기존 useQuizSession 훅 확장 방향으로 저장 로직 붙일 것.
[[project-ai-musician]] 과 동일한 Vercel 정적 배포 패턴 사용 예정.
