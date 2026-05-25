# Sprint 8 킥오프 회의록

**날짜:** 2026-05-24
**참석자:** PM Jordan, FE Avery, BE Blake, QA Morgan, QA Quinn, TS Alex, AI Sage, UX Riley
**진행자:** PM Jordan

---

## Sprint 8 목표

> **Firebase Auth Admin SDK 서버사이드 토큰 검증으로 `api/chat.js` 보안 공백을 해소하고, `model_labels` Firestore 컬렉션 분리로 모델 레이블 관리를 재배포 없이 가능하게 한다.**

---

## 안건

| # | 구분 | 항목 |
|---|------|------|
| 1 | Open Question 결정 | `FIREBASE_SERVICE_ACCOUNT` 환경변수 등록 방식 및 Preview/Production 분리 여부 |
| 2 | Open Question 결정 | FEEDBACK_MIN_SAMPLE 복원 기준 충족 여부 |
| 3 | 결정 | Auth 검증 실패 시 클라이언트 재시도 전략 |
| 4 | 확정 | Sprint 8 스코프 및 수용 기준 확정 |

---

## 결정 사항 요약

(킥오프 후 채울 것)

---

## Sprint 8 확정 스코프

### 포함

| # | 항목 | 우선순위 | 담당 |
|---|------|----------|------|
| 1 | `api/chat.js` Firebase Admin SDK 설치 및 초기화 | P0 | BE Blake |
| 2 | `FIREBASE_SERVICE_ACCOUNT` 환경변수 Vercel 등록 | P0 | BE Blake |
| 3 | Bearer 토큰 추출 → `admin.auth().verifyIdToken()` 검증 — 실패 시 401 반환 | P0 | BE Blake |
| 4 | 클라이언트 `getIdToken()` 호출 → `Authorization: Bearer {token}` 헤더 첨부 | P0 | FE Avery |
| 5 | Firestore `model_labels/{modelId}` 컬렉션 수동 seeding (현재 모델 6개) | P1 | BE Blake |
| 6 | `firestore.rules` — 인증 사용자 읽기 허용, 쓰기 차단 (`allow write: if false`) | P1 | BE Blake |
| 7 | `initApp()`에 `loadModelLabels()` 추가 — 초기 1회 Map 캐시 | P1 | FE Avery |
| 8 | `computeModelStats()` 폴백 로직: `entry.modelLabel → cache.get(entry.model) → entry.model` | P1 | FE Avery |
| 9 | Sprint 8 킥오프 시 GA4 DAU + Firestore 피드백 누적량 확인 → FEEDBACK_MIN_SAMPLE 복원 여부 결정 | P2 | PM Jordan |
| 10 | Auth 검증 추가 후 프로덕션 전체 E2E 동작 확인 | P0 | QA Morgan/Quinn |

### 제외 (이연)

| 항목 | 이연 사유 |
|------|-----------|
| `api/log.js` Auth 검증 추가 | rate limit(30/min)으로 충분. 로그 데이터는 민감 정보 아님 |
| 전체 익명 집계 (모든 사용자 통합 통계) | Firestore 보안 규칙 변경 + Cloud Function 설계 별도 필요. 사용자 수 증가 후 재검토 |
| 사용자 레이블 선택 설정 UI | 서버 자동 배정 현행 유지. 풀 선택 UI는 Sprint 9 이후 후보 |
| Vite / 빌드 파이프라인 도입 | TypeScript 마이그레이션 필요 또는 기여자 2인 이상 조건 미충족 시 유보 |
| P2 이벤트 전체 추가 | DAU 50+ 달성 조건 미충족 시 이연 유지 |

---

## 수용 기준 (Acceptance Criteria)

- [x] 유효한 Firebase ID Token 없는 `/api/chat` 요청은 401을 반환한다
- [x] 위조/만료 토큰 요청은 401을 반환한다
- [x] 유효 토큰 요청은 기존과 동일하게 OpenRouter 호출로 진행된다
- [x] `FIREBASE_SERVICE_ACCOUNT` 환경변수가 하드코딩 없이 Vercel에서 로드된다
- [x] 클라이언트가 로그인 상태에서 `getIdToken()`으로 토큰을 발급해 헤더에 첨부한다
- [ ] Firestore `model_labels` 컬렉션에 현재 운용 모델 6개가 seeding되어 있다
- [ ] 인증된 사용자는 `model_labels`를 읽을 수 있고, 쓰기는 차단된다
- [ ] 앱 초기화 시 `loadModelLabels()`가 1회 실행되어 Map 캐시에 저장된다
- [ ] Sprint 6 이전 레거시 entry(`modelLabel` 없음)가 대시보드 통계에 포함된다 (폴백 로직 동작 확인)
- [x] DAU + 피드백 누적량 확인 후 FEEDBACK_MIN_SAMPLE 복원 여부가 문서화된다
- [ ] 배포 후 프로덕션 도메인에서 일기 작성 → AI 응답 → 피드백 → 대시보드 전체 플로우가 오류 없이 동작한다

---

## 액션 아이템

**BE (Blake)**
- [x] `FIREBASE_SERVICE_ACCOUNT` 환경변수 Vercel 등록 (Preview + Production)
- [x] Firebase Admin SDK 설치 및 `api/chat.js` 초기화
- [x] Bearer 토큰 검증 로직 구현 — 401 반환
- [ ] Firestore `model_labels` 컬렉션 seeding (모델 6개)
- [ ] `firestore.rules` 읽기 허용 + 쓰기 차단 규칙 추가

**FE (Avery)**
- [x] 클라이언트 `getIdToken()` → `Authorization: Bearer` 헤더 첨부
- [ ] `initApp()`에 `loadModelLabels()` 추가
- [ ] `computeModelStats()` 폴백 로직 추가 (레거시 데이터 포함)

**PM (Jordan)**
- [x] GA4 DAU + 피드백 누적량 확인 → FEEDBACK_MIN_SAMPLE 복원 여부 결정 및 문서화
  - **결정:** `FEEDBACK_MIN_SAMPLE = 1` 현행 유지 (복원 없음). 데이터 수집 민감도 우선.

**QA (Morgan / Quinn)**
- [x] Auth 검증 후 E2E 동작 확인 (일기 작성 → 피드백 → 대시보드) — preview 환경 확인 완료
- [ ] 레거시 entry 폴백 로직 검증 (Sprint 6 이전 데이터 대시보드 포함 여부)
- [ ] CORS 제한 후 프로덕션 도메인 정상 동작 확인 (Sprint 7 이월)

---

## Open Questions

| 질문 | 담당 | 기한 | 상태 |
|------|------|------|------|
| FEEDBACK_MIN_SAMPLE 복원 기준(DAU 50+ 또는 2주치 피드백) 충족 여부 | PM Jordan + BE Blake | Sprint 8 킥오프 | ✅ 결정: `FEEDBACK_MIN_SAMPLE = 1` 현행 유지 (데이터 수집 민감도 우선) |
| `FIREBASE_SERVICE_ACCOUNT` JSON 문자열 Vercel 등록 방식 — Preview/Production 환경변수 분리 필요 여부 | BE Blake | Sprint 8 킥오프 | ✅ 결정: 동일 환경변수를 Preview + Production 양쪽에 등록 |
| Auth 검증 실패 시 클라이언트 재시도 전략 — 자동 토큰 갱신 후 1회 재시도 vs 에러 메시지 표시 | FE Avery + UX Riley | Sprint 8 구현 전 | ✅ 결정: 자동 갱신 후 1회 재시도, 재실패 시 에러 메시지 |
| `model_labels` seeding 대상 모델 목록 최종 확인 (현재 6개 — 정확한 modelId 목록 확정 필요) | BE Blake + AI Sage | Sprint 8 킥오프 | ⚠️ Open |

---

## 비고

### 리스크

- **토큰 만료 처리:** Firebase ID Token 유효 시간은 1시간. 장시간 세션에서 토큰 만료 시 API 호출 실패 가능. 클라이언트 재시도 로직 없으면 UX 단절 발생.
- **`FIREBASE_SERVICE_ACCOUNT` 환경변수 누락:** Vercel Preview 환경에 등록 누락 시 배포 후 즉시 401 반환. 킥오프 전 등록 완료 체크 필수.
- **레거시 데이터 폴백 미검증:** Sprint 6 이전 entry에 `model` 필드 형식이 현재 `modelId`와 다를 경우 `cache.get(entry.model)` 폴백도 실패. Firestore 실데이터 샘플 확인 필요.
- **싱글 HTML 구조 제약:** `firebase-admin` SDK는 Node.js 전용 → `api/chat.js`에서만 사용. 클라이언트 `index.html`은 일반 Firebase SDK(`getIdToken()`). 구조 혼동 없이 분리 유지.

### 제외 범위

(위 제외 범위 테이블 참고)

---

*회의록 작성: TS Alex | 다음 회의: Sprint 8 리뷰*
