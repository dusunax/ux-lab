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
| 1 | 확정 | 누적 이력 보존 — 최근 50세션 유지, 초과분 자동 삭제 |
| 2 | 확정 | 문제별 소요 시간 — 퀴즈 카드 내부 표시 |
| 3 | 확정 | Vercel 연결 — `apps/quiz-drill-ai` 독립 프로젝트, rootDirectory 설정 |
| 4 | 확정 | Sprint quiz-drill-ai/2 스코프 및 수용 기준 확정 |

---

## 결정 사항 요약

| # | 결정 내용 | 담당 |
|---|-----------|------|
| 1 | ✅ 결정: LocalStorage 이력 최근 50세션 유지 — 초과 시 오래된 세션 자동 삭제 | Avery |
| 2 | ✅ 결정: 문제별 소요 시간 — 퀴즈 카드 내부 표시 (카드 상단 또는 하단 인라인) | Avery |
| 3 | ✅ 결정: Vercel `apps/quiz-drill-ai` 독립 프로젝트 — rootDirectory 설정 | Avery + Chase |

---

## Sprint quiz-drill-ai/2 확정 스코프

| # | ID | 항목 |
|---|----|------|
| 1 | STORE-1 | LocalStorage에 퀴즈 결과(정답/오답) 저장 — 세션 종료 시 자동 persist |
| 2 | STORE-2 | 오답 다시 풀기 세션 지속 — 저장된 오답 목록 기반으로 retryWrong 세션 재개 |
| 3 | STAT-1 | 세션 결과 화면에 정답률·소요 시간 통계 표시 |
| 4 | STAT-2 | 누적 학습 이력 뷰 — 총 풀이 수, 정답률 추이, CSV별 이력 |
| 5 | UX-1 | 키보드 단축키 — 숫자키로 답 선택, 답변 후 Enter/Space로 "다음 문제" / "결과 보기" 트리거 |
| 6 | UX-2 | 풀이 시간 표시 — 세션 총 소요 시간 + 문제별 경과 시간 |
| 7 | DEPLOY-1 | Vercel 정적 배포 — `apps/quiz-drill-ai` 빌드 설정 및 배포 파이프라인 |
| 8 | CSV-EXT-1 | TSV 지원 — 탭 구분자 파일(`.tsv`) 업로드 및 텍스트 붙여넣기 시 구분자 자동 감지 |
| 9 | CSV-SAMPLE-1 | 내장 샘플 데이터 — `mobile-programming-149.csv`, `data-processing-100.csv` 로드 버튼 제공 |
| 10 | CSV-VALID-1 | CSV 오류 진단 — 잘못된 헤더·행·필드 값 표시, 오류 시 시작 비활성화 |
| 11 | QUIZ-RANDOM-1 | 문제별 보기 순서 랜덤화 — 세션 시작/재시작/오답 재시작마다 정답 인덱스 재계산 |
| 12 | AUDIO-1 | 정답/오답 효과음 — 선택 즉시 Web Audio API 기반 피드백 제공 |
| 13 | HISTORY-1 | 학습 이력 오답 재시작 — 이력 항목의 오답 다시 풀기 버튼으로 저장된 오답 세션 시작 |

---

## 수용 기준 (Acceptance Criteria)

**저장 (STORE)**
- [x] 세션 완료 시 각 문제의 정답 여부와 선택지가 LocalStorage에 기록된다
- [x] 브라우저를 새로고침해도 이전 세션 결과가 유지된다
- [x] 오답만 풀기 실행 시 저장된 세션의 오답 목록이 정확히 불러와진다
- [x] 저장 키 충돌 방지를 위해 CSV 파일명 또는 해시를 namespace로 사용한다

**통계 (STAT)**
- [x] 세션 결과 화면에 총 문항 수, 정답 수, 오답 수, 정답률(%)이 표시된다
- [x] 세션 소요 시간이 분:초 형식으로 표시된다
- [x] 누적 이력 뷰에서 과거 세션 목록(날짜·정답률)을 확인할 수 있다

**UX (키보드·시간)**
- [x] 보기를 선택한 상태에서 Enter 또는 Space를 누르면 "다음 문제" 또는 "결과 보기"가 실행된다
- [x] 보기를 선택하지 않은 상태에서는 Enter 또는 Space가 무시된다
- [x] 숫자키 입력으로 현재 문제의 선택지를 고를 수 있다
- [x] 퀴즈 화면에 현재 문제의 경과 시간(초 단위)이 실시간으로 표시된다
- [x] 문제를 맞추거나 틀렸을 때 서로 다른 효과음이 재생된다

**배포 (DEPLOY)**
- [x] `pnpm build` 후 Vercel 정적 서빙이 정상 동작한다
- [x] 배포 URL에서 CSV 업로드부터 세션 완료까지 전체 플로우가 동작한다 — https://quiz-drill-ai.vercel.app

**파일 포맷 확장 (CSV-EXT)**
- [x] `.tsv` 파일 업로드 시 탭 구분자로 파싱되어 CSV와 동일하게 동작한다
- [x] 텍스트 붙여넣기 시 탭이 포함되면 자동으로 탭 구분자로 전환된다
- [x] CSV 형태가 맞지 않을 때 문제 된 헤더·행·필드 값이 사용자에게 표시된다
- [x] CSV 파싱 오류가 있으면 시작하기 버튼이 비활성화된다

**샘플·출제 (SAMPLE / RANDOM)**
- [x] `mobile-programming-149.csv` 샘플을 버튼으로 불러올 수 있다
- [x] `data-processing-100.csv` 샘플을 버튼으로 불러올 수 있다
- [x] 선택된 샘플 데이터 버튼이 활성 상태로 표시된다
- [x] 각 문제의 보기는 매 세션 랜덤 순서로 출력되고 정답 인덱스가 함께 재계산된다

---

## 액션 아이템

**FE (Avery)**
- [x] LocalStorage 저장 스키마 설계 — CSV namespace, 버전 키 포함 (STORE-1 선행) — STORE-1
- [x] 세션 완료 시 결과 자동 persist 구현 — STORE-1
- [x] 저장된 오답 목록 기반 retryWrong 세션 재개 구현 — STORE-2
- [x] 세션 결과 화면에 정답률·소요 시간 통계 표시 — STAT-1
- [x] 누적 학습 이력 뷰 구현 — 과거 세션 목록(날짜·정답률), CSV별 이력 — STAT-2
- [x] 키보드 단축키 구현 — 숫자키 답 선택, 답변 후 Enter/Space 이동, 미선택 시 무시 — UX-1
- [x] 퀴즈 화면 문제별 경과 시간 실시간 표시 구현 — UX-2
- [x] Vercel 정적 배포 빌드 설정 및 배포 파이프라인 구성 — DEPLOY-1 (https://quiz-drill-ai.vercel.app)
- [x] `parseQuizCsv.ts` 구분자 자동 감지 로직 추가 — 첫 줄 탭 포함 여부로 `,` vs `\t` 판별 — CSV-EXT-1
- [x] `.tsv` 파일 확장자 허용 및 파일 업로드 accept 속성 업데이트 — CSV-EXT-1
- [x] CSV 오류 값 표시 및 오류 시 시작 비활성화 구현 — CSV-VALID-1
- [x] 샘플 CSV 2종 로드 버튼 및 선택 상태 표시 구현 — CSV-SAMPLE-1
- [x] 보기 순서 랜덤화 및 정답 인덱스 재계산 구현 — QUIZ-RANDOM-1
- [x] 정답/오답 효과음 구현 — AUDIO-1
- [x] 학습 이력 항목의 오답 다시 풀기 버튼 구현 — HISTORY-1

**BE (Blake)**
- 해당 없음 (Sprint 2는 클라이언트 사이드 LocalStorage 중심, 서버사이드 작업 없음)

**QA (Morgan / Quinn)**
- [x] 수용 기준 전체 항목 검증 (브라우저 E2E 검증)
- [x] LocalStorage 저장/복원 — 새로고침 후 데이터 유지 검증
- [x] 오답만 풀기 — 직전 세션 및 학습 이력 오답 목록 정확도 검증
- [x] 키보드 단축키 — 숫자키 답 선택, Enter/Space 이동, 미선택 시 무시 경계 케이스 검증
- [x] 배포 URL에서 CSV 업로드 → 세션 완료 전체 플로우 검증
- [x] TSV 파일 업로드 및 텍스트 붙여넣기 — CSV와 동일 동작 검증 (CSV-EXT-1)
- [x] 샘플 데이터 2종 로드, CSV 오류 표시, 보기 랜덤화, 효과음 검증

---

## Open Questions

| 질문 | 담당 | 기한 | 상태 |
|------|------|------|------|
| 누적 이력의 최대 보존 기간 또는 건수 제한 설정 여부 (LocalStorage 용량 한계 고려) | 사용자 | Sprint 킥오프 | ✅ 결정: 최근 50세션 유지 |
| 문제별 소요 시간 표시 위치 — 퀴즈 카드 내부 vs 타이머 헤더 배치 | 사용자 | 구현 착수 전 | ✅ 결정: 퀴즈 카드 내부 표시 |
| Vercel 프로젝트 연결 방식 — monorepo root 설정 vs `apps/quiz-drill-ai` 독립 프로젝트 | 사용자 | DEPLOY-1 착수 전 | ✅ 결정: 독립 프로젝트 (rootDirectory) |

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
