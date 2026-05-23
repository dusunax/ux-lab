# Sprint 7 킥오프 회의록

**날짜:** 2026-05-23
**참석자:** PM Jordan, FE Avery, BE Blake, QA Morgan, QA Quinn, TS Alex, AI Sage, UX Riley
**진행자:** PM Jordan

---

## Sprint 7 목표

> **피드백 및 모델 추적 데이터(Sprint 6 이후 2주치)를 기반으로 모델별 만족도 대시보드를 구현하고, `api/chat.js` CORS 정책을 강화하여 보안 기술 부채를 해소한다.**

---

## 안건

| # | 구분 | 항목 |
|---|------|------|
| 1 | Open Question 결정 | 만족도 대시보드 시각화 방식 (차트 vs 숫자 테이블, 라이브러리 사용 여부) |
| 2 | Open Question 결정 | 모델 익명화 레이블 방식 (모델 A/B vs 해시 vs 내부 코드명) |
| 3 | Open Question 결정 | `api/chat.js` CORS 강화 — 프로덕션 도메인 제한 적용 여부 |
| 4 | 확정 | Sprint 7 스코프 및 수용 기준 확정 |

---

## 결정 사항 요약

| # | 결정 내용 | 담당 |
|---|-----------|------|
| 1 | 대시보드 시각화: CSS/SVG 기반 바 차트 (CDN 라이브러리 없이, 싱글 HTML 구조 호환) | FE + UX |
| 2 | 모델 익명화: 해시 기반 숏코드 (`MDL-xxxx`). Firestore에 `model`(실제 ID) + `modelLabel`(표시용) 이중 필드 저장 | AI + PM |
| 3 | CORS 정책: `api/log.js` 패턴으로 도메인 제한 적용 + 한계 주석 명시 (Auth 검증 미존재 TODO 삽입) | BE |
| 4 | `api/chat.js`에 Firebase Auth 검증 없음 확인 — 이번 스프린트 CORS 제한으로 일부 보완, 완전한 Auth 방어는 Sprint 8 후보 등록 | BE + PM |

---

## Sprint 7 확정 스코프

### 포함

| # | 항목 |
|---|------|
| 1 | 만족도 대시보드 UI 구현 — Firestore entry 조회 → 클라이언트 사이드 모델별 그룹핑 → 만족도(%) 계산 |
| 2 | 대시보드 시각화: CSS/SVG 기반 바 차트 (CDN 없이 구현) |
| 3 | 데이터 부족 상태 UI — `feedback: null` 제외, 피드백 5개 미만 모델은 "데이터 부족" 표시 |
| 4 | 모델 익명화: sha256 해시 4자리 숏코드, `config.js`에 매핑 상수 추가, Firestore `modelLabel` 필드 저장 |
| 5 | `api/chat.js` CORS 제한 + 한계 주석 명시 + Firebase Auth TODO 삽입 |
| 6 | 대시보드 QA — 0건, `feedback: null` 혼재, 모델별 데이터 편중 시나리오 검증 |
| 7 | `emotion_feedback_recorded` 집계 로직 검증 — 토글 시 최신 값 기준 집계 동작 확인 |

### 제외 (이연)

| 항목 | 이연 사유 |
|------|-----------|
| 전체 익명 집계 (모든 사용자 통합 통계) | Firestore 보안 규칙 변경 + Cloud Function 설계 필요. 사용자 수 증가 후 별도 스프린트에서 처리 |
| P2 이벤트 전체 추가 | DAU 50+ 달성 조건 미충족 시 이연 유지 |
| 모바일 카드 뷰 | GA4 기기 유형별 이탈률 2주치 미확보 시 UX 제안 보류 |
| Vite / 빌드 파이프라인 도입 | TypeScript 마이그레이션 필요 또는 기여자 2인 이상 조건 미충족 |

---

## 수용 기준 (Acceptance Criteria)

- [x] 대시보드에서 본인 entry 기준 모델별 만족도(%)가 CSS/SVG 바 차트로 표시됨
- [x] `feedback: null`인 entry는 만족도 계산에서 제외됨 (분모: positive + negative만)
- [x] 데이터가 0건이거나 피드백 있는 entry가 없을 때 "데이터가 아직 충분하지 않습니다" 상태가 표시됨
- [x] 피드백 5개 미만 모델은 "데이터 부족" 상태로 표시됨
- [x] 모델명이 사용자에게 직접 노출되지 않음 — `MDL-xxxx` 해시 숏코드로만 표시
- [x] Firestore entry에 `modelLabel` 필드가 저장됨 (AI 응답 수신 시)
- [x] 토글로 변경된 피드백은 마지막(최신) 값만 집계에 반영됨
- [x] `api/chat.js` CORS가 프로덕션 도메인 + localhost로 제한됨 (`api/log.js` 패턴 적용)
- [x] `api/chat.js`에 Auth 검증 부재 한계를 주석으로 명시하고 TODO가 삽입됨
- [x] 대시보드 모든 엣지 케이스(0건, 혼재, 편중)에서 UI 오류 없이 렌더링됨

---

## 액션 아이템

**BE (Blake)**
- [x] `api/chat.js` — CORS를 `api/log.js` 패턴으로 변경 (프로덕션 도메인 + localhost 제한)
- [x] `api/chat.js` — Auth 검증 부재 한계 주석 + Firebase ID Token 검증 TODO 삽입
- [x] `api/chat.js` — AI 응답 시 `modelLabel` 생성 로직 추가 (sha256 4자리 해시)
- [x] Firestore entry 저장 시 `modelLabel` 필드 포함

**FE (Avery)**
- [x] 대시보드 탭/섹션 추가 — Firestore entry 조회 → 모델별 집계 → 만족도(%) 계산
- [x] CSS/SVG 기반 바 차트 렌더링 구현 (CDN 없이)
- [x] 데이터 부족 상태 UI 구현 (0건, 피드백 5개 미만 분기)
- [x] `config.js` — 모델 익명화 레이블 매핑 상수 추가

**QA (Morgan / Quinn)**
- [x] 수용 기준 전체 항목 검증
- [x] 0건 / `feedback: null` 혼재 / 데이터 편중 시나리오 검증
- [ ] CORS 제한 후 프로덕션 도메인에서 정상 동작 확인 (배포 후 확인 필요)
- [x] `modelLabel` 필드가 Firestore에 올바르게 저장되는지 확인 (코드 검증 완료)

---

## Open Questions

| 질문 | 담당 | 기한 | 상태 |
|------|------|------|------|
| 만족도 대시보드 시각화 방식 (차트 vs 숫자 테이블, 라이브러리 사용 여부) | FE Avery + UX Riley | Sprint 7 킥오프 | ✅ Resolved (CSS/SVG 바 차트, CDN 없이) |
| 모델 익명화 레이블 방식 (모델 A/B vs 해시 vs 내부 코드명) | PM Jordan + AI Sage | Sprint 7 킥오프 | ✅ Resolved (sha256 해시 숏코드 `MDL-xxxx`, 이중 필드 저장) |
| `api/chat.js` CORS 강화 — 프로덕션 도메인 제한 적용 여부 | BE Blake | Sprint 7 킥오프 | ✅ Resolved (도메인 제한 적용 + Auth 미존재 주석 + TODO 삽입) |
| `api/chat.js` Firebase Auth 검증 완전 방어 | BE Blake + PM | Sprint 8 검토 | ⚠️ Open (이번 스프린트 범위 외, Sprint 8 후보) |

---

## 비고

### 리스크

- **데이터 충분성:** Sprint 6 완료(2026-05-21) 기준 2주치 피드백이 쌓이는 시점은 2026-06-04 전후. 피드백 있는 entry가 모델별 5개 미만이면 대시보드가 "데이터 부족" 상태로 표시. 최소 기준 5개로 킥오프에서 확정함.
- **집계 로직:** 토글 시 중복 이벤트 발화 → "최신 값 기준" 집계. `feedback: null`은 분모에서 제외. 킥오프에서 BE + AI Sage 재확인 완료.
- **`api/chat.js` 보안 공백:** Auth 검증 없음 확인. CORS 제한으로 브라우저 오리진 차단, curl/서버 직접 호출은 여전히 가능. Sprint 8에서 Firebase ID Token 검증 추가 예정.
- **`modelLabel` 하위 호환:** 기존 Firestore entry에는 `modelLabel` 필드 없음. 대시보드는 `modelLabel` 없는 entry는 "이전 데이터" 처리 또는 `model` 필드에서 실시간 변환으로 대응.

### 다음 단계 방향성

- BE Blake: `api/chat.js` CORS 제한 + `modelLabel` 생성 로직 구현 우선
- FE Avery: 대시보드 탭 구조 설계 후 CSS/SVG 바 차트 구현
- Sprint 8 후보: Firebase ID Token 검증 완전 방어 (`api/chat.js`)

---

*회의록 작성: TS Alex | 다음 회의: Sprint 7 리뷰*
