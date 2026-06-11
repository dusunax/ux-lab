# Sprint ai-musician/1 킥오프 회의록

**날짜:** 2026-06-07
**프로젝트:** ai-musician (AI 뮤지션 페르소나 기반 음원 생성 PoC)
**참석자:** PM Jordan, FE Avery, BE Blake, AI Sage, QA Morgan, QA Quinn, TS Alex
**진행자:** PM Jordan

---

## Sprint ai-musician/1 목표

> **AI 뮤지션 페르소나 정의 + 페르소나 기반 음원 생성 흐름의 PoC 완성 — 한 명의 뮤지션이 한 곡을 만들 수 있는 최소 경로를 검증한다.**

---

## 안건

| # | 구분 | 항목 |
|---|------|------|
| 1 | Open Question | Suno API 공개 접근 여부 — API 연동 vs 수동 프롬프트 복사 방식 결정 |
| 2 | Open Question | 페르소나 데이터 저장 방식 — localStorage / JSON 파일 / DB 중 선택 |
| 3 | Open Question | 커버아트 처리 방식 — 외부 이미지 URL 입력으로 Sprint 1 대체 여부 |
| 4 | Open Question | 출력 포맷 요구사항 — 유튜브 업로드 제약이 Sprint 1에 영향을 주는가 |
| 5 | 확정 | Sprint ai-musician/1 스코프 및 수용 기준 확정 |

---

## 논의 내용

### 안건 1 — Suno API 접근 방식
Suno AI는 공개 REST API를 제공하지 않으므로 Sprint 1에서는 프롬프트 생성 + 수동 복사 방식으로 PoC를 진행한다. 페르소나 → 텍스트 프롬프트 변환 품질이 Sprint 1의 핵심 기술 가치가 된다.

**현재 상태:** 프롬프트 엔지니어링 방식으로 진행 확정. Sprint 2에서 API 연동 재검토.

---

### 안건 2 — 페르소나 데이터 저장
Sprint 1은 빠른 PoC 검증이 목표이므로 localStorage로 단순화한다. 멀티유저·공유 기능은 Sprint 3 이후 재검토.

**현재 상태:** localStorage 방식으로 진행.

---

### 안건 3 — 커버아트
AI 이미지 생성 API 연동은 음원 생성 흐름 검증 이후 별도 스프린트로 분리한다. Sprint 1에서는 외부 이미지 URL 입력으로 대체.

**현재 상태:** URL 입력 방식으로 Sprint 1 진행.

---

### 안건 4 — 출력 포맷
유튜브 업로드 자동화는 OAuth 비용이 크므로 Sprint 1 제외. 앨범 메타데이터 JSON 다운로드를 최소 출력 포맷으로 정의.

**현재 상태:** JSON 다운로드를 Sprint 1 출력 기준으로 확정.

---

### 안건 5 — 스코프 및 수용 기준 확정

Open Question 결정 이후 스코프 및 수용 기준 확정 예정. 세부 내용은 아래 섹션에 명시.

---

## 결정 사항 요약

| # | 결정 내용 | 담당 |
|---|-----------|------|
| 1 | Suno API 미연동 — 프롬프트 생성 + 수동 방식으로 Sprint 1 진행 | 전원 |
| 2 | 페르소나 데이터: localStorage 저장 | Avery |
| 3 | 커버아트: 외부 URL 입력으로 Sprint 1 대체 | Avery |
| 4 | 출력 포맷: 앨범 메타데이터 JSON 다운로드 | Avery + Blake |
| 5 | Sprint ai-musician/1 스코프 확정 | 전원 |

---

## Sprint ai-musician/1 확정 스코프

| # | 항목 |
|---|------|
| 1 | [INIT-1] `apps/ai-musician` Next.js 앱 초기화 — monorepo 설정, Tailwind, tsconfig |
| 2 | [PERSONA-1] AI 뮤지션 페르소나 데이터 모델 설계 (이름, 장르, 작가관, 시그니처 사운드, 앨범 컨셉) |
| 3 | [PERSONA-2] 페르소나 생성/편집 UI 구현 + localStorage 저장 |
| 4 | [GEN-1] 페르소나 → 음원 생성 프롬프트 변환 로직 구현 (Suno 입력 형식) |
| 5 | [GEN-2] 프롬프트 미리보기 + 클립보드 복사 기능 구현 |
| 6 | [TRACK-1] 트랙 메타데이터 구조 정의 + 단일 트랙 결과 뷰어 (오디오 플레이어 임베드) |
| 7 | [PERSONA-3] 페르소나 전환 시 프롬프트 변화 비교 프리뷰 화면 구현 |
| 8 | [OUTPUT-1] 앨범 메타데이터 JSON 다운로드 기능 |

---

## 수용 기준 (Acceptance Criteria)

- [x] `apps/ai-musician`이 `pnpm --filter ai-musician dev`로 독립 실행된다
- [x] 페르소나 폼에 값을 입력하면 Suno 호환 텍스트 프롬프트가 자동 생성된다
- [x] 두 개 이상의 페르소나를 전환했을 때 프롬프트 출력이 각각 다르게 나타난다
- [x] 생성된 트랙 1개가 메타데이터(트랙명, 태그, 생성 프롬프트)와 함께 화면에 표시된다
- [x] 오디오 파일 URL 또는 임베드 링크를 입력하면 플레이어에서 재생된다
- [x] 페르소나 데이터가 새로고침 후에도 유지된다 (localStorage)
- [x] 앨범 메타데이터가 JSON 파일로 다운로드된다

---

## 액션 아이템

**FE (Avery)**
- [x] [INIT-1] `apps/ai-musician` Next.js 앱 초기화
- [x] [PERSONA-1] 페르소나 데이터 모델 TypeScript 타입 정의
- [x] [PERSONA-2] 페르소나 생성/편집 UI + localStorage 연동
- [x] [GEN-1][GEN-2] 프롬프트 변환 로직 + 미리보기 + 클립보드 복사
- [x] [TRACK-1] 트랙 결과 뷰어 + 오디오 플레이어
- [x] [PERSONA-3] 페르소나 전환 비교 프리뷰

**BE (Blake)**
- [x] [OUTPUT-1] 앨범 메타데이터 JSON 다운로드 API 또는 클라이언트 유틸 구현

**AI (Sage)**
- [x] [GEN-1] Suno 프롬프트 엔지니어링 가이드 작성 — 페르소나 필드 → 프롬프트 변환 전략

**QA (Morgan / Quinn)**
- [x] 페르소나 전환 시 프롬프트 변화 일관성 검증
- [x] localStorage 지속성 테스트 (새로고침/탭 재오픈 시나리오)

---

## Open Questions

| 질문 | 담당 | 기한 | 상태 |
|------|------|------|------|
| Suno API 공개 접근 여부 | Sage | Sprint ai-musician/1 킥오프 | ✅ 결정: 수동 프롬프트 방식 |
| 페르소나 데이터 저장 방식 | Avery | Sprint ai-musician/1 킥오프 | ✅ 결정: localStorage |
| 커버아트 처리 방식 | Avery | Sprint ai-musician/1 킥오프 | ✅ 결정: 외부 URL 입력 |
| 출력 포맷 Sprint 1 범위 | 전원 | Sprint ai-musician/1 킥오프 | ✅ 결정: JSON 다운로드 |
| Sprint 2에서 Udio vs Suno 다중 제공자 비교 진행 여부 | 사용자 | Sprint ai-musician/2 킥오프 | ✅ 결정: 진행 — 동일 페르소나로 두 플랫폼 비교, 작가관 표현 적합도 판단 기준으로 활용 |

---

## 디자인 방향

| 항목 | 결정 |
|------|------|
| UI 모티프 | Spotify — 다크 배경, 사이안 액센트, 앨범 카드 그리드, 플레이어 바 하단 고정 레이아웃 참조 |

---

## 비고

### 리스크
- **Suno/Udio API 접근 불확실성** — 공개 API가 없어 프롬프트 생성 + 수동 복사 방식 채택. Sprint 1의 기술 가치는 프롬프트 엔지니어링 품질에 집중됨.
- **monorepo 앱 초기화 오버헤드** — 기존 `projection-art` 설정 참조로 최소화하나, pnpm workspace 충돌 시 초기화 작업 지연 가능.
- **페르소나 → 프롬프트 변환 품질 기준 불명확** — 킥오프 전 샘플 페르소나 1개와 기대 프롬프트 예시를 Sage가 사전 작성 권장.

### 제외 범위
| 항목 | 이연 사유 |
|------|-----------|
| 앨범 단위 구성 UI (트랙 순서 편집) | 단일 트랙 PoC 검증 후 Sprint 2 |
| 유튜브/외부 플랫폼 업로드 자동화 | OAuth 연동 비용 과다, PoC 단계 불필요 |
| 사용자 인증 / 멀티유저 지원 | 개인 프로젝트 초기 단계 |
| AI 커버아트 생성 | 이미지 생성 API 연동은 별도 스프린트 |
| Udio API 연동 | Suno 단일 방식으로 Sprint 1 범위 제한 |

---

*회의록 작성: TS Alex | 다음 회의: Sprint ai-musician/1 리뷰*

---

## Sprint ai-musician/1 현황 (2026-06-11 기준)

**상태:** ✅ 스코프 완료 + 추가 기능 구현

### 완료된 스코프 항목

| # | 항목 | 상태 |
|---|------|------|
| [INIT-1] | `apps/ai-musician` Next.js 앱 초기화 (port 3037, Tailwind, tsconfig, Spotify 다크 테마) | ✅ |
| [PERSONA-1] | 페르소나 TypeScript 타입 정의 — `Persona`, `Track`, `Album` | ✅ |
| [PERSONA-2] | 페르소나 생성/편집 폼 + localStorage 저장 (`ai-musician:personas`) | ✅ |
| [GEN-1] | `generatePrompt`, `generateTags`, `generateSunoStyle`, `buildSunoLyrics` 로직 구현 | ✅ |
| [GEN-2] | Suno Advanced 모드 3필드(Style / Lyrics+Prompt / Title) 미리보기 + 클립보드 복사 | ✅ |
| [TRACK-1] | 트랙 목록 + PlayerBar 하단 고정 오디오 플레이어 | ✅ |
| [PERSONA-3] | 사이드바 페르소나 전환 — 프롬프트 즉시 변경 반영 | ✅ |
| [OUTPUT-1] | 앨범 메타데이터 JSON 내보내기 (`exportAlbum`) | ✅ |

### 스코프 외 추가 구현

| 항목 | 설명 |
|------|------|
| YouTube 채널 정보 | 페르소나에 `youtubeChannelName`, `youtubeHandle` 필드 추가 |
| 트랙 필드 분리 | `lyrics` (가사)와 `prompt` 별도 저장 — Suno 제출 시 합산 |
| 한글/영어 제목 | `titleEn` 필드 추가 — 영상 자막에서 `창문 너머 새 (Le Petit Oiseau à la Fenêtre)` 형식으로 표시 |
| 트랙 수정 | `TrackEditForm` — 제목, 영어 제목, 가사, URL 인라인 수정 |
| 영상 제작 탭 | ffmpeg + `@napi-rs/canvas` 기반 1920×1080 lyric video 생성 |
| 썸네일 미리보기 | 배경색·폰트색·이미지·텍스트 레이아웃 실시간 미리보기 |
| 배경색 / 폰트색 피커 | 파스텔 프리셋 6종 + 직접 입력 (`<input type="color">`) |
| 파일 업로드 입력 | 미발행 음원 대응 — 오디오/이미지 파일 직접 업로드 (drag & drop) |
| 취소 가능 영상 생성 | `AbortController` 연동 — 생성 중 취소 지원 |
| 시드 페르소나 | `private/seed-personas.json` (gitignore) → `/api/seed` GET — 루 (Ru) 페르소나 로컬 전용 제공 |

### 화면 현황

**[트랙] 탭 — 메인 화면**

> 뮤지션 커버 이미지·이름·장르로 구성된 헤더, 탭 네비게이션, 트랙 목록. 우상단에 JSON 내보내기·트랙 추가 액션 버튼 배치. 하단 PlayerBar 고정.

**[뮤지션 편집] 탭**

> 페르소나 전체 필드 편집 폼. 작가관·시그니처 사운드·앨범 컨셉·SUNO 프롬프트 외에 YouTube 채널명·핸들 필드 포함. 저장 시 localStorage 즉시 반영.

**[프롬프트 생성] 탭**

> 페르소나 기반 Suno Advanced 3-필드 자동 생성. 한글/영어 제목 분리 입력, 트랙 스토리와 가사를 나란히 작성하면 아래 미리보기가 실시간 갱신된다.

**[영상 제작] 탭**

> ffmpeg + `@napi-rs/canvas` 기반 1920×1080 lyric video 생성. 배경색·폰트색 피커, 16:9 썸네일 실시간 미리보기, 오디오/이미지 파일 drag & drop 업로드.

### 최종 산출물 — YouTube 업로드 완료

> **엔드-투-엔드 검증 완료.** 페르소나 정의 → 프롬프트 생성 → Suno 음원 제작 → ffmpeg lyric video 렌더링 → YouTube 업로드까지 전체 파이프라인을 Sprint 1 내에 실증.

### 기술 부채 / 다음 스프린트 후보

| 항목 | 우선순위 |
|------|----------|
| 트랙 목록에서 영어 제목 표시 | P1 |
| `titleEn` → Suno Title 필드 자동 반영 | P1 |
| 영상 생성 진행률 표시 (ffmpeg 로그 streaming) | P2 |
| AI 커버아트 생성 연동 (이미지 생성 API) | P2 |
| 앨범 단위 구성 UI (트랙 순서 편집) | P3 |
