# Sprint 6 킥오프 회의록

**날짜:** 2026-05-21
**참석자:** PM Jordan, FE Avery, BE Blake, QA Morgan, QA Quinn, TS Alex, AI Sage
**진행자:** PM Jordan

---

## Sprint 6 목표

> **피드백 수집 인프라를 완성한다. 좋아요/싫어요 피드백 UI, Firestore 저장, 이벤트 로깅, 모델 추적을 구현하여 Sprint 7 대시보드의 데이터 기반을 마련한다.**

---

## 안건

| # | 구분 | 항목 |
|---|------|------|
| 1 | Open Question 결정 | OQ-1: 피드백 토글 허용 여부 |
| 2 | Open Question 결정 | OQ-2: 대시보드 데이터 범위 |
| 3 | Open Question 결정 | OQ-3: 모델명 UI 노출 여부 |
| 4 | Open Question 결정 | OQ-4: 대시보드 구현 시점 |
| 5 | 확정 | Sprint 6 스코프 및 수용 기준 확정 |

---

## 논의 내용

### OQ-1 — 피드백 토글 허용 여부

**각 역할 의견:**

- **FE (Avery):** 토글 허용 시 Firestore update 로직이 단순하고 사용자 실수 수정이 가능하다. 한 번만 허용 시 버튼 비활성화 처리가 필요하나 구현이 더 명확하다.
- **BE (Blake):** Firestore update는 두 방향 모두 동일한 비용. 단, 토글 허용 시 로그 이벤트가 여러 번 발생할 수 있어 집계 시 "마지막 값 기준" 집계 방식을 명확히 해야 한다.
- **QA (Morgan):** 토글 허용 시 중복 이벤트 집계 방지 로직이 QA 항목에 추가된다. 한 번만 허용 시 QA 범위가 단순해진다.
- **AI (Sage):** 모델 비교 데이터 관점에서 토글은 노이즈를 줄이는 효과가 있다. 사용자가 반응을 바꿨다면 마지막 피드백이 더 신뢰할 수 있는 신호다.

**결정:** **토글 허용 (변경 가능).** 로그 이벤트는 변경 시마다 발화하되, 집계는 entry당 최신 feedback 값 기준으로 한다.

---

### OQ-2 — 대시보드 데이터 범위

**각 역할 의견:**

- **FE (Avery):** 본인 데이터만으로도 모델별 비교는 가능하다. 단, 초기에 entry가 적으면 의미 있는 패턴이 나오기 어렵다.
- **BE (Blake):** 전체 익명 집계는 Firestore 보안 규칙 변경이 필요하다. 현재 규칙은 본인 데이터만 읽기 가능으로 설정되어 있다. 별도 집계 Cloud Function이 필요할 수 있어 Sprint 6 범위를 초과할 수 있다.
- **PM (Jordan):** 프라이버시 리스크와 구현 복잡도를 고려해 1차는 본인 데이터로 시작한다.

**결정:** **본인 데이터만 (Firestore 현행 규칙 유지).** 전체 익명 집계는 사용자 수가 늘면 별도 검토한다.

---

### OQ-3 — 모델명 UI 노출 여부

**각 역할 의견:**

- **FE (Avery):** 각 row에 모델 태그를 보여주면 정보 밀도가 높아져 Excel 미학이 흐트러질 수 있다. 대시보드에서만 집계 형태로 보여주는 편이 자연스럽다.
- **AI (Sage):** 사용자에게 모델명을 노출하면 특정 모델에 편향된 피드백이 생길 수 있다. 내부 데이터로만 유지하는 게 더 객관적인 데이터 수집에 유리하다.
- **UX (Riley):** 대시보드에서 모델별 만족도 통계로만 노출하는 것이 가장 clean하다.

**결정:** **내부 데이터만 저장. UI에 직접 노출하지 않음.** 대시보드에서 모델별 집계 통계로만 표시한다.

---

### OQ-4 — 대시보드 구현 시점

**각 역할 의견:**

- **BE (Blake):** 피드백 + 모델 데이터가 먼저 쌓여야 대시보드가 의미 있다. Sprint 6에서 수집 인프라를 완성하고, 2주 후 데이터가 쌓이면 Sprint 7에서 시각화.
- **FE (Avery):** 대시보드 포함 시 Sprint 6 스코프가 무거워진다. 분리하는 편이 각 기능의 완성도가 높다.

**결정:** **Sprint 6: 피드백 수집 + 모델 추적만. 대시보드는 Sprint 7** (데이터 2주치 이후).

---

### 안건 5 — Sprint 6 스코프 및 수용 기준 확정

4개 OQ 결정을 기반으로 Sprint 6 포함/제외 항목을 확정했다. 세부 수용 기준은 아래 섹션에 명시.

---

## 결정 사항 요약

| # | 결정 내용 | 담당 |
|---|-----------|------|
| 1 | 피드백 토글 허용. 로그는 변경마다 발화, 집계는 entry당 최신 값 기준 | PM |
| 2 | 대시보드 데이터 범위: 본인 데이터만 (Firestore 현행 규칙 유지) | PM |
| 3 | 모델명 UI 직접 노출 금지. 내부 저장 후 대시보드 집계 통계로만 표시 | PM |
| 4 | 대시보드 구현: Sprint 7로 이연 (데이터 2주치 이후) | PM |
| 5 | Sprint 6 스코프: 피드백 수집 + 모델 추적 인프라 완성 | 전원 |

---

## Sprint 6 확정 스코프

### 포함

| # | 항목 |
|---|------|
| 1 | 좋아요/싫어요 피드백 버튼 UI (커스텀 SVG, 이모지 금지) |
| 2 | 피드백 클릭 → Firestore update + logEvent (`emotion_feedback_recorded`) |
| 3 | 토글 허용: 재클릭 시 반전, Firestore 업데이트 |
| 4 | `/api/chat.js` 응답에 `model` 필드 추가 |
| 5 | Firestore entry 스키마 확장: `feedback`, `model` 필드 |
| 6 | `api/log.js` ALLOWED_EVENTS에 `emotion_feedback_recorded` 추가 |

### 제외 (Sprint 7)

| 항목 | 이연 사유 |
|------|-----------|
| 만족도 대시보드 시각화 | 데이터 2주치 축적 후 Sprint 7에서 처리 |

---

## 수용 기준 (Acceptance Criteria)

- [ ] AI 응답이 있는 행에만 피드백 버튼 렌더링 (응답 없는 행에 미표시)
- [ ] 좋아요 클릭 → Firestore `feedback: 'positive'` 저장 + `emotion_feedback_recorded` 이벤트 발화
- [ ] 싫어요 클릭 → Firestore `feedback: 'negative'` 저장 + 이벤트 발화
- [ ] 토글: 이미 선택된 값 재클릭 시 `feedback: null`로 초기화
- [ ] 반전: 좋아요 선택 후 싫어요 클릭 시 `feedback: 'negative'`로 변경
- [ ] 선택된 버튼 시각적 구분 (색상/상태), 미선택 버튼 dimming
- [ ] 피드백 없는 row는 hover 시에만 버튼 표시, 피드백 있는 row는 항상 표시
- [ ] `/api/chat.js` 응답 바디에 `model: string` 포함 (누락 시 `"unknown"` fallback)
- [ ] Firestore entry에 `model` 저장 (AI 응답 수신 시)
- [ ] Vercel Runtime Log에서 `emotion_feedback_recorded` 이벤트 수신 확인
- [ ] 피드백 버튼: 이모지 금지, 커스텀 SVG 사용

---

## 액션 아이템

**BE (Blake)**
- [ ] `/api/chat.js` — OpenRouter 응답에서 `model` 필드 추출 후 클라이언트에 전달, 누락 시 `"unknown"` fallback
- [ ] `api/log.js` — ALLOWED_EVENTS에 `emotion_feedback_recorded` 추가
- [ ] `api/log.js` — ALLOWED_PARAM_KEYS에 `feedback`, `model` 추가

**FE (Avery)**
- [ ] `ui.js` — 커스텀 SVG 피드백 버튼 `buildRow`에 추가 (AI 응답 있는 행만)
- [ ] `styles/sheet.css` — 피드백 버튼 CSS (hover, selected-pos, selected-neg, dim 상태)
- [ ] `index.html` — 피드백 버튼 클릭 이벤트 핸들러 (Firestore update + logEvent)
- [ ] `index.html` / Firestore — AI 응답 수신 시 `model` 값 entry에 저장

**QA (Morgan / Quinn)**
- [ ] 수용 기준 전체 항목 검증
- [ ] 토글 시나리오: null → positive → null, null → positive → negative
- [ ] 모델명 누락 시 `"unknown"` fallback 처리 확인
- [ ] Vercel Runtime Log에서 `emotion_feedback_recorded` 수신 확인

---

## Open Questions

| 질문 | 담당 | 기한 | 상태 |
|------|------|------|------|
| OQ-1: 피드백 토글 허용 여부 | PM | Sprint 6 킥오프 | Resolved (토글 허용, 최신 값 기준 집계) |
| OQ-2: 대시보드 데이터 범위 | PM | Sprint 6 킥오프 | Resolved (본인 데이터만) |
| OQ-3: 모델명 UI 노출 여부 | PM | Sprint 6 킥오프 | Resolved (UI 노출 금지, 내부 저장 후 집계 통계로만 표시) |
| OQ-4: 대시보드 구현 시점 | PM | Sprint 6 킥오프 | Resolved (Sprint 7 이연) |
| 만족도 대시보드 시각화 | FE + BE | Sprint 7 | ⚠️ Open (데이터 2주치 축적 후) |
| 전체 익명 집계 도입 여부 | PM + BE | 미정 | ⚠️ Open (사용자 수 증가 후 별도 검토) |

---

## 비고

**기술 부채**

- `api/chat.js` CORS는 Firebase Auth 토큰으로 방어 중이므로 Sprint 6에서도 변경하지 않음. Sprint 7에서 재검토.
- Firestore 보안 규칙은 현행(본인 데이터만 읽기 가능) 유지. 전체 익명 집계 도입 시 Cloud Function 설계가 필요하며 별도 스프린트로 처리.

**리스크**

- 토글 시 중복 이벤트 발화: 집계 로직이 "최신 값 기준"임을 대시보드 구현 전 BE와 AI가 사전 합의 필요.
- `model` 필드 누락 시 `"unknown"` fallback이 없으면 대시보드 집계 오염 가능성. BE가 fallback 처리 필수.
- 피드백 버튼 SVG 미구현 시 이모지 임시 대체 금지. 커스텀 SVG 완성 후 릴리스.

**다음 단계 방향성**

- Sprint 6 완료 후: 피드백 수집 + 모델 추적 인프라 완성 → 데이터 2주치 축적 대기
- Sprint 7 후보: 모델별 만족도 집계 대시보드 시각화 (본인 데이터 기준)
- 전체 익명 집계는 사용자 수 증가 시 별도 검토 (Cloud Function 설계 포함)

---

*회의록 작성: TS Alex | 다음 회의: Sprint 6 리뷰*
