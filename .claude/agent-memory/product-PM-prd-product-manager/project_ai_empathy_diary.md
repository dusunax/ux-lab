---
name: project-ai-empathy-diary
description: ai-empathy-diary 앱의 스프린트 진행 현황, 확정된 기술 결정, 미결 질문 추적
metadata:
  type: project
---

ai-empathy-diary는 개인 감정 일기 앱이다. OpenRouter LLM이 감정 분석 및 공감 응답을 제공한다. 현재 Vercel 배포(https://ai-empathy-diary.vercel.app), Firebase Google OAuth, Firestore, Vercel Runtime Logs 기반 로그 파이프라인이 운영 중이다.

**Why:** 수산시장 AI 에이전트 팀의 실험적 프로덕트. 싱글 HTML 파일(~2100줄) + vanilla JS + Vercel + Firebase 스택 의도.

**How to apply:** 빌드 툴 없는 싱글 파일 구조를 전제로 기능 제안 범위를 설정할 것. React/Next.js 컨벤션(파일 크기 800줄 제한 등)을 이 앱에 그대로 적용하면 안 됨.

---

## 확정된 기술 결정

- `x-request-id` 전달 방식: **JSON body에 포함** (헤더 방식 기각). 이유: 싱글 HTML 구조에서 body 파싱 코드가 이미 존재하며 일관성 우선.
- GA4 데이터 보존 기간: **2개월(62일)**. 이유: 개인 감정 일기 특성상 데이터 최소 보관 원칙.
- `/api/log` rate limit: **IP당 분당 30회**. 이유: 정상 사용 패턴(일기 제출 1회 = 최대 3 이벤트) 기준.
- `api/log.js` CORS `Access-Control-Allow-Origin: *` — 현재 allowlist로 인젝션 방어 중, 스프린트 5 이후 도메인 제한 검토 예정.

## 이월된 미결 결정 (Open Questions)

- **동의 UX 배너**: 해외 출시 시점까지 보류. 해외 출시 기준 정의 필요 (국가 수, 사용자 수, 도메인 변경 여부). → Owner: Jordan, Due: 스프린트 5 이전.
- **빌드 환경 도입 여부**: `index.html` 2100줄 초과. Vite 등 도입 vs 싱글 파일 유지. Avery가 분리 가능 영역 사전 조사 중. → Owner: Jordan + Avery, Due: 스프린트 5 이전.
- **Sage(AI) 관여 시점**: 모델 선택 전략 및 프롬프트 품질 개선 필요 시점 미결. → Owner: Jordan + Sage, Due: 스프린트 5 이후.

## 스프린트 현황

| 스프린트 | 날짜 | 주요 완료 |
|---------|------|----------|
| Sprint 1 | 2026-05-11 | 킥오프, 감정 분석 MVP |
| Sprint 2 | 2026-05-13 | 버그 수정, 셀 그리드, 감정 필터, 삭제 버튼 |
| Sprint 3 | 2026-05-18 | Vercel 배포, Firebase OAuth, Firestore, P0 로그 구현 |
| Sprint 4 | 2026-05-19 | 로그 파이프라인 완성, rate limit, GA4 연결, 모바일 최소 대응, 오류 UX |

## 로그 아키텍처 (Sprint 3 확정)

- 클라이언트 이벤트: `logEvent()` → `sendBeacon` → `/api/log` → Vercel Runtime Logs
- 서버 이벤트: `api/chat.js` → `console.log` structured JSON → Vercel Runtime Logs
- 클라이언트-서버 연결: `request_id` (JSON body, Sprint 4 확정)
- 절대 수집 금지: 일기 텍스트 원문, AI 응답 원문, 이메일/이름/UID 원문
