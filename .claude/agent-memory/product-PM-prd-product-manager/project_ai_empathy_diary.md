---
name: project-ai-empathy-diary
description: ai-empathy-diary 앱의 스프린트 진행 현황, 확정된 기술 결정, 미결 질문 추적
metadata:
  type: project
---

ai-empathy-diary는 개인 감정 일기 앱이다. OpenRouter LLM이 감정 분석 및 공감 응답을 제공한다. 현재 Vercel 배포(https://ai-empathy-diary.vercel.app), Firebase Google OAuth, Firestore, Vercel Runtime Logs 기반 로그 파이프라인이 운영 중이다.

**Why:** 수산시장 AI 에이전트 팀의 실험적 프로덕트. 싱글 HTML 파일 + vanilla JS + Vercel + Firebase 스택 의도.

**How to apply:** 빌드 툴 없는 싱글 파일 구조를 전제로 기능 제안 범위를 설정할 것. React/Next.js 컨벤션(파일 크기 800줄 제한 등)을 이 앱에 그대로 적용하면 안 됨. CLAUDE.md에 명시적 예외 조항 추가 예정(Sprint 5 TS 액션 아이템).

---

## 확정된 기술 결정

- `x-request-id` 전달 방식: **JSON body에 포함** (헤더 방식 기각). 이유: 싱글 HTML 구조에서 body 파싱 코드가 이미 존재하며 일관성 우선.
- GA4 데이터 보존 기간: **2개월(62일)**. 이유: 개인 감정 일기 특성상 데이터 최소 보관 원칙.
- `/api/log` rate limit: **IP당 분당 30회**. 이유: 정상 사용 패턴(일기 제출 1회 = 최대 3 이벤트) 기준.
- **Vite 도입 보류** (Sprint 5 결정): TypeScript 마이그레이션 필요 또는 기여자 2인 이상 시점에 재검토.
- **`api/log.js` CORS**: `*` → Vercel 프로덕션 도메인 + localhost로 제한 (Sprint 5). `api/chat.js`는 Firebase Auth 토큰 방어 유지, 스프린트 6 재검토.
- **파일 분리 방향** (Sprint 5): CSS + config.js + utils.js 분리, index.html 800줄 이하 목표. api.js / storage.js는 Firebase 초기화 순서 문제로 Vite 도입 시까지 보류.
- **AI 관여 시작** (Sprint 5): 프롬프트 리뷰 문서 + 모델 근거 문서화 + 응답 샘플 기준선 5개 이상 보존. 프롬프트 코드 반영은 PM + UX 승인 후.
- **`emotion_label_recorded` 이벤트** (Sprint 5): AI 프롬프트 품질 피드백 루프 목적. 파라미터: `{ label: string }`. 텍스트 원문 금지.

## 동의 UX 배너 트리거 기준 (Sprint 5 Resolved)

세 조건 중 하나라도 충족 시 P0 착수:
1. GA4 기준 non-KR 사용자 누적 50명 초과
2. 외부 공유 대상에 비한국어권 사용자가 명시적으로 포함
3. 앱 UI 언어를 한국어 외 언어로 추가

현재 상태: 세 조건 모두 미충족. SRE가 GA4 국가별 모니터링 설정 예정.

## 이월된 미결 결정 (Open Questions)

- **모바일 카드 뷰**: 외부 공유 후 GA4 기기 유형별 이탈률 2주치 확보 후 UX 제안. 현재 보류.
- **P2 이벤트 전체 추가**: DAU 50+ 달성 시. `emotion_label_recorded`만 Sprint 5에 선별 추가.
- **api/chat.js CORS**: Firebase Auth 토큰으로 방어 중. Sprint 7 킥오프 재검토 예정.
- **만족도 대시보드 시각화 방식**: 차트 vs 숫자 테이블, 라이브러리 사용 여부 — Sprint 7 킥오프 결정 필요. 담당: FE Avery + UX Riley.
- **모델 익명화 레이블 방식**: 모델 A/B vs 해시 vs 내부 코드명 — Sprint 7 킥오프 결정 필요. 담당: PM + AI Sage.
- **전체 익명 집계 도입 여부**: Firestore 규칙 변경 + Cloud Function 설계 필요. 사용자 수 증가 후 별도 검토. 담당: PM + BE Blake.

## 스프린트 현황

| 스프린트 | 날짜 | 주요 완료 |
|---------|------|----------|
| Sprint 1 | 2026-05-11 | 킥오프, 감정 분석 MVP |
| Sprint 2 | 2026-05-13 | 버그 수정, 셀 그리드, 감정 필터, 삭제 버튼 |
| Sprint 3 | 2026-05-18 | Vercel 배포, Firebase OAuth, Firestore, P0 로그 구현 |
| Sprint 4 | 2026-05-19 | 로그 파이프라인 완성, rate limit, GA4 연결, 모바일 최소 대응, 오류 UX |
| Sprint 5 | 2026-05-20 | Vite 보류, CSS+JS 분리, CORS 제한, AI 프롬프트 리뷰 시작, emotion_label_recorded |
| Sprint 6 | 2026-05-21 | 피드백 버튼(커스텀 SVG), Firestore feedback/model 필드, emotion_feedback_recorded 이벤트, 모델 추적 |

## 로그 아키텍처 (Sprint 3 확정, Sprint 5 업데이트)

- 클라이언트 이벤트: `logEvent()` → `sendBeacon` → `/api/log` → Vercel Runtime Logs
- 서버 이벤트: `api/chat.js` → `console.log` structured JSON → Vercel Runtime Logs
- 클라이언트-서버 연결: `request_id` (JSON body, Sprint 4 확정)
- 절대 수집 금지: 일기 텍스트 원문, AI 응답 원문, 이메일/이름/UID 원문
- 이벤트 목록: P0(page_view, entry_submit_success 등), P1(entry_load_failure 등), P1.5(emotion_label_recorded, Sprint 5 추가)
