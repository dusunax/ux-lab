# Sprint 1 킥오프 회의록 — MythGraph

**날짜:** 2026-08-07  
**참석자:** PM Jordan, FE Avery, BE Blake, QA Morgan, QA Quinn, TS Alex, PERF Chase  
**진행자:** PM Jordan

---

## Sprint 1 목표

> **그리스·로마 신화 지식그래프의 Foundation 구축**  
> Next.js + GraphQL Yoga 통합, Entity 검색 및 1단계 관계 그래프 탐색

---

## 이전 스프린트 완료 검증

신규 프로젝트 첫 스프린트이므로 이전 스프린트 완료 게이트는 적용하지 않는다.

---

## Sprint 1 확정 스코프

### P0 — 완료 필수 항목

| # | 항목 | 담당 |
|---|------|------|
| 1 | Next.js + GraphQL Yoga 통합 | BE Blake |
| 2 | Neo4j 드라이버 & 자격증명 보안 | BE Blake |
| 3 | GraphQL Schema 설계 | BE Blake |
| 4 | Entity 검색 & 조회 Resolver | BE Blake |
| 5 | 1단계 그래프 조회 (Cypher + Mapper) | BE Blake |
| 6 | React Flow 렌더링 | FE Avery |
| 7 | Apollo Client 설정 | FE Avery |
| 8 | Full-text Index & Constraints | BE Blake |

### P1 — 스프린트 내 완료 목표

| # | 항목 | 담당 |
|---|------|------|
| 9 | Seed 데이터 (50-80 Entity) | PM Jordan |
| 10 | GraphQL 입력 검증 | BE Blake |
| 11 | E2E 테스트 | QA Morgan/Quinn |
| 12 | Vercel 배포 | BE Blake |
| 13 | Performance 최적화 | PERF Chase |
| 14 | Entity 라벨 전략 결정 | BE Blake |
| 15 | 임베딩 공급자 선정 | BE Blake |
| 16 | React Flow 레이아웃 튜닝 | FE Avery |

---

## 수용 기준 (Acceptance Criteria)

- [ ] Entity 검색 & 필터링 기능 동작 (UI)
- [ ] 1단계 그래프 시각화 (React Flow)
- [ ] 노드 확장 인터랙션 구현
- [ ] 노드 중복 제거 로직
- [ ] 성능 목표: 검색 < 500ms, 그래프 렌더링 < 1s
- [ ] Neo4j 자격증명 미노출 (환경변수)
- [ ] Vercel 배포 성공 및 헬스 체크
- [ ] Unit 테스트 커버리지 > 70%
- [ ] GraphQL API 문서화
- [ ] Seed 데이터 로드 스크립트 완성
- [ ] 최단 경로 기본 구현
- [ ] 의미론적 검색 기초 (Vector Index 구조 설계)

---

## 액션 아이템

**BE (Blake)**
- [ ] Next.js + GraphQL Yoga 통합 구조 설계
- [ ] Neo4j 드라이버 인스턴스화 및 Session 관리 패턴 구현
- [ ] GraphQL Schema 정의 (Entity, Relationship, Connection types)
- [ ] Entity 검색 Resolver: full-text search + 필터링
- [ ] Entity 조회 Resolver: 단일 Node 및 관계 포함 상세 조회
- [ ] 1단계 그래프 조회 Resolver: Cypher 쿼리 + 응답 매핑
- [ ] Full-text Index 생성 및 Constraints 설정
- [ ] 임베딩 공급자 선정 의사 결정 (OpenAI/DeepSeek/local)
- [ ] Entity 라벨 전략 확정 (신, 인간, 사건 등)
- [ ] Neo4j dev/prod 계정 분리 전략 수립
- [ ] GraphQL 복잡도 공격 방어 (depth/limit 상한) 구현
- [ ] GraphQL API 문서 작성 (Schema 주석)

**FE (Avery)**
- [ ] Apollo Client 설정 및 cache configuration
- [ ] Entity 검색 폼 UI 구현
- [ ] 검색 결과 리스트 UI
- [ ] React Flow 라이브러리 통합
- [ ] 그래프 노드와 엣지 렌더링
- [ ] 노드 클릭 시 상세 정보 패널
- [ ] 노드 확장 인터랙션 (1단계 관계 표시)
- [ ] 노드 중복 제거 로직 구현
- [ ] React Flow 레이아웃 엔진 선택 및 튜닝 (hierarchical/force-directed)
- [ ] 모바일/데스크톱 반응형 그래프 렌더링
- [ ] 검색 결과 없음, 로딩 상태 UI

**QA (Morgan/Quinn)**
- [ ] Entity 검색 기능 E2E 테스트 (happy path + edge cases)
- [ ] 그래프 렌더링 성능 체크 (노드 100개 기준)
- [ ] 노드 클릭, 확장, 상세 정보 조회 플로우
- [ ] 모바일 반응형 테스트 (그래프 PAN/ZOOM)
- [ ] GraphQL 입력 검증 테스트 (depth limit, rate limit)
- [ ] Neo4j 연결 누수 테스트 (Session 종료 확인)
- [ ] Vercel 배포 헬스 체크

**PERF (Chase)**
- [ ] 검색 응답 시간 성능 측정 (목표 < 500ms)
- [ ] 그래프 렌더링 성능 측정 (목표 < 1s)
- [ ] React Flow 노드 memoization 검증
- [ ] Neo4j 쿼리 성능 분석 및 인덱스 최적화
- [ ] 번들 크기 측정 (Apollo + React Flow 포함)

**PM (Jordan)**
- [ ] Seed 데이터셋 설계 (50-80 Entity, 관계 정의)
- [ ] Seed 데이터 수집 및 문헌 기준 문서화
- [ ] Seed 데이터 로드 스크립트 작성 (Neo4j import)
- [ ] Myth/Event 노드 포함 여부 결정

**TS (Alex)**
- [ ] Sprint 1 일정 및 의존성 추적
- [ ] 팀 간 리뷰 및 결정사항 회의 운영

---

## Open Questions

| # | 질문 | 담당 | 기한 | 상태 |
|---|------|------|------|------|
| OQ-1 | Entity 라벨 전략 (신, 인간, 사건 등) | BE Blake | Sprint 1 Day 1 | ⚠️ Open |
| OQ-2 | Myth/Event 노드 포함 여부 | PM Jordan | Sprint 1 Day 1 | ⚠️ Open |
| OQ-3 | 벡터 임베딩 공급자 (OpenAI/DeepSeek/local) | BE Blake | Sprint 1 Day 1 | ⚠️ Open |
| OQ-4 | React Flow 레이아웃 엔진 선택 | FE Avery | Sprint 1 Day 2 | ⚠️ Open |
| OQ-5 | Neo4j 계정 분리 (dev/prod) | BE Blake | Sprint 1 Day 1 | ⚠️ Open |
| OQ-6 | Seed 데이터 기준 문헌 | PM Jordan | Sprint 1 Day 3 | ⚠️ Open |

---

## 비고

### 리스크 & 완화 전략

| 리스크 | 완화 방법 |
|--------|-----------|
| Neo4j 연결 누수 | Driver 재사용, Session 즉시 종료 → BE 리뷰 필수 |
| GraphQL 복잡도 공격 | depth/limit 상한 강제 → 보안 체크리스트 |
| React Flow 성능 | 노드 100개 상한, memoization → PERF 검증 |
| 데이터 모델 불안정 | 관계 유형 사전화, validation script → Schema 고정화 |
| 임베딩 비용 | Sprint 1에서 제외, Seed 오프라인 구성 → 별도 예산 검토 |
| 무료 인프라 용량 | 작은 데이터셋(50-80 entities)으로 시작 → 증설 계획 수립 |

### 제외 범위 (Sprint 2 이후 이월)

| 항목 | 이연 사유 |
|------|-----------|
| 의미론적 검색 (MVP 포함이지만 구현은 Sprint 2) | 벡터 인덱싱 결정 필요 |
| 최단 경로 완전 구현 | 기본 구현만 Sprint 1 |
| 사용자 인증 & 북마크 | Sprint 3+ (MVP 제외) |
| 다국어 지원 | MVP 제외 |
| 모바일 앱 | 웹 우선 |
| 커뮤니티 기능 | Sprint 4+ |

### 참조 문서

| 파일 | 용도 |
|------|------|
| `docs/PRD/mythgraph/` | MythGraph PRD (작성 예정) |
| `packages/neo4j-seed/` | Seed 데이터 로드 스크립트 |

---

*회의록 작성: TS Alex | 다음 회의: Sprint 1 리뷰*
