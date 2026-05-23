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
| 사용자가 모델 라벨 직접 선택 | 현재 서버 해시 기반 자동 배정. 사용자가 레이블 풀에서 원하는 이름을 고를 수 있는 설정 UI (Sprint 8 이후 후보) |
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
| `model_labels` Firestore 컬렉션 분리 — 레이블 변경 시 재배포 없이 적용 가능하도록 | BE Blake | Sprint 8 검토 | ⚠️ Open (BE 설계 검토 완료, Sprint 8 구현 후보) |

---

## 비고

### 리스크

- **데이터 충분성:** Sprint 6 완료(2026-05-21) 기준 2주치 피드백이 쌓이는 시점은 2026-06-04 전후. 피드백 0개일 때만 "데이터 부족" 상태로 표시 (FEEDBACK_MIN_SAMPLE = 1로 완화, 2026-05-24 변경).
- **집계 로직:** 토글 시 중복 이벤트 발화 → "최신 값 기준" 집계. `feedback: null`은 분모에서 제외. 킥오프에서 BE + AI Sage 재확인 완료.
- **`api/chat.js` 보안 공백:** Auth 검증 없음 확인. CORS 제한으로 브라우저 오리진 차단, curl/서버 직접 호출은 여전히 가능. Sprint 8에서 Firebase ID Token 검증 추가 예정.
- **`modelLabel` 하위 호환:** 기존 Firestore entry에는 `modelLabel` 필드 없음. 대시보드는 `modelLabel` 없는 entry는 "이전 데이터" 처리 또는 `model` 필드에서 실시간 변환으로 대응.

### 모델 라벨 풀 (2026-05-24 확정)

서버(`api/chat.js`)가 모델 ID의 sha256 해시로 아래 풀 중 하나를 결정론적으로 선택. 같은 모델은 항상 같은 라벨.

**채택: 셀 참조 계열** — 절대참조 스타일 (`$열$행`)

| 라벨 | | | | |
|------|--|--|--|--|
| `$A$1` | `$B$2` | `$C$3` | `$D$4` | `$E$5` |
| `$F$6` | `$G$7` | `$H$8` | `$I$9` | `$J$10` |
| `$A$2` | `$B$1` | `$C$2` | `$D$3` | `$E$4` |

**기타 후보**

| 계열 | 예시 |
|------|------|
| 엑셀 함수명 | `=IF`, `=SUM`, `=MAX` |
| 날짜/시간 함수 | `=NOW`, `=DATE`, `=TODAY` |
| 수학 함수 | `=SQRT`, `=RAND`, `=EVEN` |
| 텍스트 함수 | `=TRIM`, `=EXACT`, `=CLEAN` |
| 에러 코드 | `#N/A`, `#REF!`, `#VALUE!` |

**미래 후보**: 사용자가 풀에서 직접 라벨 선택하는 설정 UI (Sprint 8 이후)

### `model_labels` 컬렉션 분리 설계 (2026-05-24 BE 검토)

PM 질의: "모델이름과 모델 라벨을 별도 테이블로 관리하면 레이블 변경 시 재배포 없이 적용 가능하지 않나?"

**BE(Blake) 검토 결과:**

**제안 스키마** — `model_labels/{modelId}`

```
- label: string        // "$A$1"
- isActive: boolean    // 현재 FALLBACKS에 있는지 여부
- createdAt / updatedAt
```

접근 권한: 인증된 사용자 읽기 가능, 클라이언트 쓰기 차단 (`allow write: if false`)

**현행 하드코딩 vs 별도 컬렉션 비교:**

| 항목 | 현행 하드코딩 | 별도 컬렉션 |
|------|-------------|------------|
| 레이블 변경 | 재배포 필요 | Console에서만 변경, 재배포 불필요 |
| 구 entry 통계 포함 | `modelLabel` 없으면 제외 | 폴백으로 포함 가능 |
| 운영 복잡도 | 낮음 | seeding + rules 변경 필요 |

**Sprint 8 권장 구현 (3개 파일, 30줄 이내):**

1. Firebase Console에서 현재 모델 6개 `model_labels` 수동 seeding
2. `firestore.rules`에 읽기 권한 추가
3. `initApp()`에 `loadModelLabels()` — 초기 1회 Map 캐시
4. `computeModelStats()`에 폴백: `e.modelLabel || modelLabelsCache.get(e.model)` → Sprint 6 이전 데이터도 통계 포함

**이후로 미루는 것:** `api/chat.js` 하드코딩 제거는 Firebase ID Token 검증(Auth) 선행 후 Admin SDK 도입 시 함께 처리.

### 다음 단계 방향성

- BE Blake: `api/chat.js` CORS 제한 + `modelLabel` 생성 로직 구현 우선
- FE Avery: 대시보드 탭 구조 설계 후 CSS/SVG 바 차트 구현
- Sprint 8 후보: Firebase ID Token 검증 완전 방어 (`api/chat.js`)
- Sprint 8 후보: `model_labels` 컬렉션 분리 + `computeModelStats()` 폴백 처리 (레거시 데이터 통계 포함)

---

*회의록 작성: TS Alex | 다음 회의: Sprint 7 리뷰*
