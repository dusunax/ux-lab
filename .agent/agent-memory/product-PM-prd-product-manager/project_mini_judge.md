---
name: project-mini-judge
description: mini-judge 앱의 스프린트 진행 현황, 확정 기술 결정, 이연 항목, Open Questions
metadata:
  type: project
---

부트캠프 팀 프로젝트 출품회에서 심사위원이 사용하는 평가 지원 도구.
URL(노션 + GitHub)을 입력하면 팀별 평가표 + 질문 시트를 AI로 자동 생성한다.
현재 브랜치: `sprint/mini-judge/1`.

## 페르소나

- 심사위원: 주니어~시니어 개발자. 레벨별로 질문 깊이가 달라야 함.
- 피심사자: 부트캠프 수료 예정 신입 개발자.

## Sprint 1 스코프 (2026-06-20 수립)

| ID | 항목 |
|----|------|
| INIT-1 | 프로젝트 세팅 (Vite + React + TypeScript + Tailwind + Zod) |
| INIT-2 | 심사위원 프로필 설정 화면 (이름, 레벨) |
| INPUT-1 | 팀 입력 폼 (제목, 설명, 노션 URL, GitHub URL) |
| INPUT-2 | 팀 목록 관리 (n개 팀 추가/삭제) |
| PARSE-1 | GitHub README 파싱 (raw fetch) |
| PARSE-2 | 노션 페이지 파싱 (공개 URL 스크레이핑) |
| AI-1 | 팀별 AI 프롬프트 설계 → 평가표 + 질문 시트 생성 |
| AI-2 | 심사위원 레벨 반영 (질문 깊이 조정) |
| OUTPUT-1 | 팀별 결과 카드 (프로젝트 요약 + 기술 스택 + 완성도 체크리스트) |
| OUTPUT-2 | 질문 시트 렌더링 (기술 3개 + 포괄 2개) |
| PRINT-1 | 인쇄/PDF 내보내기 (print CSS, 팀당 1페이지) |

**Why:** URL 입력 하나로 맞춤 평가표 + 질문 시트를 자동 생성하는 MVP 검증이 목표.

## 이연 결정

| 항목 | 이연 시점 |
|------|-----------|
| 심사 점수 입력 및 집계 | Sprint 2 |
| 팀 간 순위 비교 | Sprint 2+ |
| 질문 수동 편집·저장 | Sprint 2 |
| 노션 OAuth 연동 (Private 레포) | Sprint 2 |
| 사용자 계정/로그인 | 미정 |
| 모바일 반응형 최적화 | 낮은 우선순위 |

## Open Questions (Sprint 1 킥오프 기준)

1. 노션 URL Private 처리 방식 — Public export 전용 vs Notion API 토큰 입력 허용
2. AI API 선택 — OpenRouter(DeepSeek) vs Vercel AI SDK
3. GitHub Private 레포 fallback — 수동 입력 vs GitHub token 입력

## 핵심 제약

- 생성된 질문 5개 중 최소 1개는 해당 팀 프로젝트 고유 내용을 포함해야 함 (Generic only 불허)
- GitHub raw fetch는 Public 레포 전제 (브라우저 CORS 제한)
- 파싱된 컨텍스트 부족 시 사용자에게 보강 요청 UX 필요

**How to apply:** Sprint 2 설계 시 점수 입력 UI와 노션 Private 연동 방향을 먼저 결정할 것.
