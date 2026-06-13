# Sprint quiz-drill-ai/2 킥오프 회의록

**날짜:** 2026-06-13
**프로젝트:** quiz-drill-ai (CSV 기반 개인 시험 대비 퀴즈 학습 도구)
**참석자:** PM Jordan, FE Avery, BE Blake, QA Morgan, QA Quinn, TS Alex
**진행자:** PM Jordan

---

## Sprint quiz-drill-ai/2 목표

> **Sprint 1에서 동작 증명된 퀴즈 루프에 "기억과 습관"을 더한다 — 학습 이력 저장, 누적 통계, 키보드 단축키, Vercel 배포로 실사용 가능한 학습 도구로 완성한다.**

---

## 안건

| # | 구분 | 항목 |
|---|------|------|
| 1 | Open Question | 누적 이력의 최대 보존 기간 또는 건수 제한 설정 여부 (LocalStorage 용량 한계 고려) |
| 2 | Open Question | 문제별 소요 시간 표시 위치 — 퀴즈 카드 내부 vs 타이머 헤더 배치 |
| 3 | Open Question | Vercel 프로젝트 연결 방식 — monorepo root 설정 vs `apps/quiz-drill-ai` 독립 프로젝트 |
| 4 | 확정 | Sprint quiz-drill-ai/2 스코프 및 수용 기준 확정 |

---

## 결정 사항 요약

| # | 결정 내용 | 담당 |
|---|-----------|------|
| 1 | ⚠️ Open — 누적 이력 보존 한계 설정 여부 미결 | 사용자 확인 후 결정 |
| 2 | ⚠️ Open — 문제별 소요 시간 표시 위치 미결 | 사용자 확인 후 결정 |
| 3 | ⚠️ Open — Vercel 연결 방식 미결 | 사용자 확인 후 결정 |

---

## Sprint quiz-drill-ai/2 확정 스코프

| # | ID | 항목 |
|---|----|------|
| 1 | STORE-1 | LocalStorage에 퀴즈 결과(정답/오답) 저장 — 세션 종료 시 자동 persist |
| 2 | STORE-2 | 오답 다시 풀기 세션 지속 — 저장된 오답 목록 기반으로 retryWrong 세션 재개 |
| 3 | STAT-1 | 세션 결과 화면에 정답률·소요 시간 통계 표시 |
| 4 | STAT-2 | 누적 학습 이력 뷰 — 총 풀이 수, 정답률 추이, CSV별 이력 |
| 5 | UX-1 | Enter 키 단축키 — 답 선택 후 Enter로 "다음 문제" / "결과 보기" 트리거 |
| 6 | UX-2 | 풀이 시간 표시 — 세션 총 소요 시간 + 문제별 경과 시간 |
| 7 | DEPLOY-1 | Vercel 정적 배포 — `apps/quiz-drill-ai` 빌드 설정 및 배포 파이프라인 |

---

## 수용 기준 (Acceptance Criteria)

**저장 (STORE)**
- [ ] 세션 완료 시 각 문제의 정답 여부와 선택지가 LocalStorage에 기록된다
- [ ] 브라우저를 새로고침해도 이전 세션 결과가 유지된다
- [ ] 오답만 풀기 실행 시 직전 세션의 오답 목록이 정확히 불러와진다
- [ ] 저장 키 충돌 방지를 위해 CSV 파일명 또는 해시를 namespace로 사용한다

**통계 (STAT)**
- [ ] 세션 결과 화면에 총 문항 수, 정답 수, 오답 수, 정답률(%)이 표시된다
- [ ] 세션 소요 시간이 분:초 형식으로 표시된다
- [ ] 누적 이력 뷰에서 과거 세션 목록(날짜·정답률)을 확인할 수 있다

**UX (키보드·시간)**
- [ ] 보기를 선택한 상태에서 Enter를 누르면 "다음 문제" 또는 "결과 보기"가 실행된다
- [ ] 보기를 선택하지 않은 상태에서는 Enter가 무시된다
- [ ] 퀴즈 화면에 현재 문제의 경과 시간(초 단위)이 실시간으로 표시된다

**배포 (DEPLOY)**
- [ ] `pnpm build` 후 Vercel 정적 서빙이 정상 동작한다
- [ ] 배포 URL에서 CSV 업로드부터 세션 완료까지 전체 플로우가 동작한다

---

## 액션 아이템

**FE (Avery)**
- [ ] LocalStorage 저장 스키마 설계 — CSV namespace, 버전 키 포함 (STORE-1 선행) — STORE-1
- [ ] 세션 완료 시 결과 자동 persist 구현 — STORE-1
- [ ] 저장된 오답 목록 기반 retryWrong 세션 재개 구현 — STORE-2
- [ ] 세션 결과 화면에 정답률·소요 시간 통계 표시 — STAT-1
- [ ] 누적 학습 이력 뷰 구현 — 과거 세션 목록(날짜·정답률), CSV별 이력 — STAT-2
- [ ] Enter 키 단축키 구현 — 보기 선택 시 다음 문제/결과 보기 트리거, 미선택 시 무시 — UX-1
- [ ] 퀴즈 화면 문제별 경과 시간 실시간 표시 구현 — UX-2
- [ ] Vercel 정적 배포 빌드 설정 및 배포 파이프라인 구성 — DEPLOY-1

**BE (Blake)**
- 해당 없음 (Sprint 2는 클라이언트 사이드 LocalStorage 중심, 서버사이드 작업 없음)

**QA (Morgan / Quinn)**
- [ ] 수용 기준 전체 항목 검증 (브라우저 E2E 검증)
- [ ] LocalStorage 저장/복원 — 새로고침 후 데이터 유지 검증
- [ ] 오답만 풀기 — 직전 세션 오답 목록 정확도 검증
- [ ] Enter 단축키 — 선택 시 트리거, 미선택 시 무시 경계 케이스 검증
- [ ] 배포 URL에서 CSV 업로드 → 세션 완료 전체 플로우 검증

---

## Open Questions

| 질문 | 담당 | 기한 | 상태 |
|------|------|------|------|
| 누적 이력의 최대 보존 기간 또는 건수 제한 설정 여부 (LocalStorage 용량 한계 고려) | 사용자 | Sprint 킥오프 | ⚠️ Open |
| 문제별 소요 시간 표시 위치 — 퀴즈 카드 내부 vs 타이머 헤더 배치 | 사용자 | 구현 착수 전 | ⚠️ Open |
| Vercel 프로젝트 연결 방식 — monorepo root 설정 vs `apps/quiz-drill-ai` 독립 프로젝트 | 사용자 | DEPLOY-1 착수 전 | ⚠️ Open |

---

## 비고

### 리스크

- **LocalStorage 설계 선행 필요:** STORE-1이 STORE-2·STAT-2의 기반. 저장 스키마(namespace, 버전 키)를 Sprint 초반에 확정하지 않으면 중반 이후 마이그레이션 비용 발생.
- **시간 측정 정확도:** setInterval 기반 타이머는 백그라운드 탭 진입 시 throttling으로 오차 발생 가능. MVP에서는 허용 오차로 처리하되 명시적으로 기록.
- **Vercel monorepo 빌드 설정:** rootDirectory 설정과 빌드 커맨드 경로 사전 검증 필요. DEPLOY-1을 Sprint 후반이 아닌 중반에 배치 권장.

### 제외 범위

| 항목 | 이연 사유 |
|------|-----------|
| 카테고리/태그 필터 | 문항 볼륨이 충분해야 필터 효용 발생 — Sprint 3+ |
| AI 채팅 해설 (OpenRouter) | 퀴즈 UX 안정화 이후 연동 — Sprint 3 |
| 모바일 반응형 전체 최적화 | 기능 완성 선행 — Sprint 3+ |
| 멀티 CSV 동시 관리 | 복잡도 상승, 단일 CSV 패턴 먼저 안정화 |
| 사용자 계정·서버 동기화 | LocalStorage 로컬 저장으로 충분한 MVP 단계 |

---

*회의록 작성: TS Alex | 다음 회의: Sprint quiz-drill-ai/2 리뷰*
