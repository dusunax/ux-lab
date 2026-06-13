# Sprint quiz-drill-ai/1 킥오프 회의록

**날짜:** 2026-06-13
**프로젝트:** quiz-drill-ai (CSV 기반 개인 시험 대비 퀴즈 학습 도구)
**참석자:** PM Jordan, FE Avery, BE Blake, QA Morgan, QA Quinn, TS Alex
**진행자:** PM Jordan

---

## Sprint quiz-drill-ai/1 목표

> **CSV 파일 하나로 즉시 시험 대비 퀴즈를 시작할 수 있는 최소 학습 도구 — 입력, 파싱, 랜덤 출제, 정답 확인, 해설까지 완전 동작.**

---

## 안건

| # | 구분 | 항목 |
|---|------|------|
| 1 | Open Question | 앱 위치를 `apps/quiz-drill-ai`로 신설할지, 기존 앱 구조에 편입할지 |
| 2 | Open Question | CSV 텍스트 붙여넣기와 파일 업로드 중 MVP에서 둘 다 지원할지, 하나만 지원할지 |
| 3 | Open Question | 세션 완료 후 동작 — 재시작(리셔플) 즉시 제공 vs 별도 메뉴로 이동 |
| 4 | Open Question | `answer` 필드 값이 `3`(인덱스)인지 `option3`(키)인지 예시 기준 확정 필요 |
| 5 | 확정 | Sprint quiz-drill-ai/1 스코프 및 수용 기준 확정 |

---

## 결정 사항 요약

| # | 결정 내용 | 담당 |
|---|-----------|------|
| 1 | 앱 위치: `apps/quiz-drill-ai` monorepo 신설 | Avery + Blake |
| 2 | CSV 입력: 파일 업로드 + 텍스트 붙여넣기 둘 다 지원 | Avery |
| 3 | 세션 완료 후: 결과 화면에 [다시 풀기] + [오답만 풀기] 버튼 즉시 표시 | Avery |
| 4 | `answer` 필드: 1-based 인덱스 (answer=3 → option3) | Avery |

---

## Sprint quiz-drill-ai/1 확정 스코프

| # | ID | 항목 |
|---|----|------|
| 1 | INIT-1 | Vite + React + TypeScript + Tailwind 프로젝트 초기 세팅 (`apps/quiz-drill-ai`) |
| 2 | CSV-1 | CSV 업로드 UI — 파일 선택 또는 텍스트 붙여넣기 입력 |
| 3 | CSV-2 | CSV 파서 구현 — `id, category, question, option1~4, answer, explanation` 스키마 파싱 및 zod 검증 |
| 4 | CSV-3 | 파싱 오류 처리 — 필수 필드 누락, 포맷 불일치 시 사용자 친화적 에러 메시지 표시 |
| 5 | QUIZ-1 | 랜덤 문제 출제 엔진 — 전체 문항 셔플 후 순차 제공 |
| 6 | QUIZ-2 | 퀴즈 화면 구현 — 문항 번호, 카테고리, 질문, 4지선다 보기 렌더링 |
| 7 | QUIZ-3 | 정답 확인 로직 — 선택지 클릭 시 정답/오답 즉시 표시 |
| 8 | QUIZ-4 | 해설 표시 — 정답 확인 후 `explanation` 필드 노출 |
| 9 | QUIZ-5 | 진행 상태 표시 — 현재 문제 번호 / 전체 문제 수, 정답률 표시 |
| 10 | SESSION-1 | 세션 완료 화면 — 전체 풀이 완료 시 결과 요약 |

---

## 수용 기준 (Acceptance Criteria)

- [x] 올바른 포맷의 CSV 파일을 업로드하면 파싱 오류 없이 문제 목록이 로드된다
- [x] 포맷 오류가 있는 CSV 업로드 시, 어느 행·필드가 문제인지 명시한 에러 메시지가 표시된다
- [x] 문제는 매 세션마다 랜덤 순서로 제공된다 (직전 세션과 동일 순서 반복 없음)
- [x] 보기를 선택하면 정답/오답 여부가 즉시 시각적으로 구분된다 (색상 또는 아이콘)
- [x] 정답 확인 후 해당 문항의 해설(`explanation`)이 표시된다
- [x] 현재 문제 번호와 전체 문제 수가 항상 화면에 표시된다
- [x] 전체 문항 완료 시 세션 결과 요약(정답 수 / 전체 수)이 표시된다
- [x] 빌드 오류 없이 `vite build` 성공, TypeScript strict 모드 에러 없음

---

## 액션 아이템

**FE (Avery)**
- [x] `apps/quiz-drill-ai/` Vite + React + TypeScript + Tailwind 프로젝트 신설 (pnpm workspace 연동) — INIT-1
- [x] CSV 업로드 UI 구현 — 파일 선택 + 텍스트 붙여넣기 입력 컴포넌트 — CSV-1
- [x] CSV 파서 구현 — zod 스키마 검증 포함 (`id, category, question, option1~4, answer, explanation`) — CSV-2
- [x] 파싱 오류 처리 — 행·필드 단위 에러 메시지 표시 — CSV-3
- [x] 랜덤 문제 출제 엔진 — 전체 문항 셔플 유틸리티 구현 (Fisher-Yates) — QUIZ-1
- [x] 퀴즈 화면 구현 — 문항 번호, 카테고리, 질문, 4지선다 렌더링 — QUIZ-2
- [x] 정답 확인 로직 — 선택지 클릭 시 즉시 시각적 피드백(색상/아이콘) — QUIZ-3
- [x] 해설 표시 — 정답 확인 후 `explanation` 노출 — QUIZ-4
- [x] 진행 상태 표시 — 문제 번호 / 전체 수 / 정답률 상시 표시 — QUIZ-5
- [x] 세션 완료 화면 — 결과 요약 (정답 수 / 전체 수) — SESSION-1

**BE (Blake)**
- [x] 신규 앱 신설에 따른 monorepo 구성 검토 (`pnpm workspace`) — INIT-1 지원 (`@ux-lab/quiz-drill-ai` 등록 완료)

**QA (Morgan / Quinn)**
- [x] 수용 기준 전체 항목 검증 (브라우저 E2E 검증 완료)
- [x] 올바른 CSV / 오류 CSV 케이스별 파싱 동작 검증
- [x] 랜덤 셔플 — 직전 세션과 동일 순서 반복 없음 검증
- [x] 정답/오답 시각적 구분 및 해설 표시 검증
- [x] `vite build` + TypeScript strict 모드 에러 없음 확인

---

## Open Questions

| 질문 | 담당 | 기한 | 상태 |
|------|------|------|------|
| 앱 위치를 `apps/quiz-drill-ai`로 신설할지, 기존 앱 구조에 편입할지 | Jordan / 사용자 확인 | Sprint quiz-drill-ai/1 킥오프 | ✅ 결정: monorepo 패턴 — `apps/quiz-drill-ai` 신설 |
| CSV 텍스트 붙여넣기와 파일 업로드 중 MVP에서 둘 다 지원할지, 하나만 지원할지 | Jordan / 사용자 확인 | Sprint quiz-drill-ai/1 킥오프 | ✅ 결정: 둘 다 지원 |
| 세션 완료 후 동작 — 재시작(리셔플) 즉시 제공 vs 별도 메뉴로 이동 | Jordan / 사용자 확인 | Sprint quiz-drill-ai/1 킥오프 | ✅ 결정: 결과 화면에 [다시 풀기] + [오답만 풀기] 버튼 즉시 표시 |
| `answer` 필드 값이 `3`(인덱스)인지 `option3`(키)인지 예시 기준 확정 필요 | Jordan / 사용자 확인 | Sprint quiz-drill-ai/1 킥오프 | ✅ 결정: 1-based 인덱스 (answer=3 → option3) |

---

## 비고

### 리스크

- **CSV 포맷 유연성**: 실제 사용자 데이터는 따옴표 처리, 줄바꿈 포함 셀 등 엣지 케이스를 가져올 수 있음. 파서 라이브러리(`papaparse`) 도입 여부를 킥오프 전 결정 필요.
- **`answer` 필드 인덱스 기준 불명확**: 예시 CSV에서 `answer=3`이 1-based인지 0-based인지 명세가 없음. 파서 구현 전 확정하지 않으면 정답 판정 로직 전체 재작업 가능성.
- **신규 앱 세팅 비용**: Vite 프로젝트 신설 시 monorepo 구성(`pnpm workspace`, `turbo`) 연동 설정이 예상 외로 시간을 소모할 수 있음. 기존 앱 구조 참조 필수.

### 제외 범위

| 항목 | 이연 사유 |
|------|-----------|
| 정답/오답 LocalStorage 저장 | Sprint 2 — 통계 기능과 함께 설계해야 의미 있음 |
| 오답 다시 풀기 | Sprint 2 — 저장 기능 선행 필요 |
| 카테고리/필터 기능 | Sprint 2 — 문항 볼륨이 충분해야 필터 효용 발생 |
| 통계 및 학습 이력 표시 | Sprint 2 |
| AI 채팅 (OpenRouter 연동) | Sprint 3 — 퀴즈 UX 안정화 이후 연동 |
| AI 채팅 로그 저장 | Sprint 3 |
| 모바일 반응형 최적화 | Sprint 2 이후 — 우선 데스크탑 기준 동작 확인 |

### Sprint 2 후보 (Sprint 1 리뷰에서 추가)

| 항목 | 내용 |
|------|------|
| 풀이 시간 표시 | 세션 총 소요 시간 또는 문제별 풀이 시간 표시 |
| Enter 키 단축키 | 답 선택 후 Enter로 "다음 문제" / "결과 보기" 버튼 트리거 |
| Vercel 배포 | `apps/quiz-drill-ai` Vercel 정적 배포 설정 |

---

*회의록 작성: TS Alex | 다음 회의: Sprint quiz-drill-ai/1 리뷰*
