# Sprint 2 킥오프 회의록 — MythGraph

**날짜:** 2026-08-07  
**참석자:** PM Jordan, FE Avery, BE Blake, QA Morgan, QA Quinn, TS Alex, PERF Chase  
**진행자:** PM Jordan

---

## Sprint 2 목표

> **Foundation 고도화 및 검색 기능 통합**  
> Bloom 레이아웃 구현, 엣지 시각화 개선, 키워드 검색 UI 구축으로 그래프 인터랙션 완성

---

## Sprint 1 완료 검증

Sprint 1에서 정의한 모든 P0 항목과 주요 P1 항목을 완료하였다.

**Sprint 1 성과:**
- Next.js + GraphQL Yoga 통합 및 Neo4j 보안 구현 완료
- Entity 검색 및 1단계 그래프 조회 Resolver 구현 완료
- React Flow 그래프 시각화 기본 기능 완료 (노드 < 100)
- Seed 데이터 50-80 Entity 로드 완료
- GraphQL 입력 검증 및 E2E 테스트 기본 커버리지 확보
- 검색 응답 < 500ms, 그래프 렌더링 < 1s 성능 목표 달성
- Unit 테스트 커버리지 > 70% 달성
- Vercel 배포 성공 및 안정화

**이월 항목:**
- 의미론적 검색 (Vector Index 기초 설계만 완료 → 구현은 Sprint 2)
- 최단 경로 기본 구현만 완료 → 고도화는 Sprint 2

---

## Sprint 2 확정 스코프

### P0 — 완료 필수 항목

| # | 항목 | 담당 |
|---|------|------|
| 1 | Bloom 레이아웃 구현 (Zeus 중심 동심원 배치) | FE Avery |
| 2 | 엣지 시각화 개선 (라벨 & 화살표 마커 추가) | FE Avery |
| 3 | 키워드 검색 UI 구현 (엔티티명/설명 검색) | FE Avery |
| 4 | Apollo Client GraphQL 최적화 | FE Avery |
| 5 | 콘솔 로그 정리 & 경고 해결 | FE Avery |

### P1 — 스프린트 내 완료 목표

| # | 항목 | 담당 |
|---|------|------|
| 6 | fitView 반응형 동작 구현 | FE Avery |
| 7 | 글자 크기 가독성 개선 | FE Avery |
| 8 | GraphQL 검색 쿼리 최적화 | BE Blake |
| 9 | Neo4j full-text index 활용 | BE Blake |
| 10 | Hybrid search 백엔드 준비 (UI는 Sprint 3) | BE Blake |

---

## 수용 기준 (Acceptance Criteria)

- [x] Bloom 레이아웃 구현 (Zeus 중심 동심원 배치)
- [x] 엣지 라벨 & 화살표 표시 (관계 방향 명확화)
- [x] 키워드 검색 UI 구현 (엔티티명/설명 검색)
- [x] 검색 결과 자동 관계 로드
- [x] fitView 반응형 동작 (노드 개수 변경 시)
- [x] 글자 크기 가독성 개선 (text-base)
- [x] 콘솔 로그 정리 (불필요한 debug 제거)
- [x] GraphQL 검색 쿼리 최적화 (Neo4j int 타입 수정)
- [x] Apollo Client 캐싱 최적화

---

## 액션 아이템

**BE (Blake)**
- [ ] Myth/Event 노드 스키마 추가 (현재 Entity만 구현)
- [ ] 연쇄 탐색 Resolver 구현 (Entity → Myth → Event → Entity)
- [ ] 최단 경로 알고리즘 선택 (A*/Dijkstra/BFS) 및 구현
- [ ] 경로 길이/노드 상한 설정 (복잡도 폭발 방지)
- [ ] 벡터 임베딩 공급자 평가 및 선택 (OpenAI/DeepSeek/Ollama)
- [ ] 벡터 임베딩 통합 인터페이스 설계
- [ ] 하이브리드 검색 쿼리 로직 구현 (Keyword 가중치 + Vector 유사도)
- [ ] GraphQL 깊이/복잡도 제한 강화
- [ ] 관계 유형 검증 자동화 스크립트 구현
- [ ] Neo4j 인덱스 최적화 (Vector Index 포함)

**FE (Avery)**
- [ ] React Flow 노드 memoization 강화
- [ ] 대용량 그래프 렌더링 최적화 (노드 200+ 대응)
- [ ] 가상화 기법 검토 (동적 레이아웃 조정)
- [ ] Myth/Event 탐색 UI 표현 (필터링 추가)
- [ ] 검색 결과 연쇄 탐색 UX 개선
- [ ] 모바일 반응형 그래프 성능 최적화

**QA (Morgan/Quinn)**
- [ ] 관계 유형 데이터 무결성 검증 테스트
- [ ] 최단 경로 경계 테스트 (길이 제한, 순환 검증)
- [ ] 하이브리드 검색 결과 정확도 검증
- [ ] GraphQL 통합 테스트 (깊이/복잡도 제한 테스트)
- [ ] E2E 테스트 확대 (Myth/Event 탐색 플로우)
- [ ] 성능 회귀 테스트 (응답 <2초 SLA)

**PERF (Chase)**
- [ ] 최단 경로 알고리즘 성능 벤치마크 (목표 <2초)
- [ ] 하이브리드 검색 응답 시간 측정 (목표 <1.5초)
- [ ] React Flow 대용량 렌더링 성능 측정 (노드 200+ 기준)
- [ ] 벡터 임베딩 API 호출 지연 측정
- [ ] 메모리 누수 테스트 (장시간 그래프 탐색)
- [ ] 번들 크기 영향도 측정 (Vector Index 라이브러리)

**PM (Jordan)**
- [ ] Seed 데이터 확대 (150+ entities 목표)
- [ ] 추가 문헌 기준 선정 및 데이터 수집
- [ ] Entity-Myth-Event 관계 구조 정의
- [ ] Seed 데이터 로드 스크립트 업데이트
- [ ] 데이터 품질 검증 체크리스트 작성

**TS (Alex)**
- [ ] Sprint 2 일정 및 의존성 추적
- [ ] OQ 결정 회의 운영 (벡터 임베딩, 최단 경로 알고리즘 선택)
- [ ] 팀 간 기술 리뷰 운영

---

## Open Questions

| # | 질문 | 담당 | 기한 | 상태 |
|---|------|------|------|------|
| OQ-6 | 벡터 임베딩 공급자 선택 (OpenAI vs DeepSeek vs Ollama) | Blake | Sprint 2 Day 1 | ⚠️ Open |
| OQ-7 | 최단 경로 알고리즘 선택 (A* vs Dijkstra vs BFS) | Blake | Sprint 2 Day 1 | ⚠️ Open |
| OQ-8 | 하이브리드 검색 가중치 (keyword/vector 비율) | Jordan | Sprint 2 Day 2 | ⚠️ Open |
| OQ-9 | Seed 데이터 확대 문헌 선정 | Jordan | Sprint 2 Day 2 | ⚠️ Open |
| OQ-10 | 그래프 시각화 레이아웃 고정 여부 | Alex | Sprint 2 Day 3 | ⚠️ Open |

---

## 비고

### 리스크 & 완화 전략

| 리스크 | 완화 방법 |
|--------|-----------|
| **벡터 임베딩 비용** | 월 $50-300 증가 가능 → 로컬 Ollama 대체 검토 가능 |
| **Neo4j 쿼리 복잡도** | 최단 경로 계산 폭발 → 경로 길이/노드 상한 설정 필수 |
| **그래프 렌더링 성능** | 200+ 노드에서 프리징 가능 → memoization 강화, 가상화 검토 |
| **Seed 데이터 품질** | 관계 오류 신뢰도 저하 → 자동 검증, Peer review 필수 |
| **API 응답시간** | 복합 쿼리 SLA 위반 → 조기 성능 벤치마크 (Day 15) |
| **벡터 인덱싱 안정성** | 대용량 임베딩 계산 시간초과 → 배치 처리, 타임아웃 설정 |

### 성능 목표 (SLA)

| 지표 | 목표 | 검증 방법 |
|------|------|-----------|
| Entity 검색 응답 | <500ms | k6 부하 테스트 (1000 req/s) |
| 최단 경로 계산 | <2초 | 다양한 경로 길이 테스트 |
| 하이브리드 검색 | <1.5초 | Vector + Keyword 조합 테스트 |
| 그래프 렌더링 (200노드) | 60fps | React DevTools Profiler |
| API 99%ile 응답 | <3초 | 성능 모니터링 (New Relic 검토) |

### 제외 범위 (Sprint 3 이후 이월)

| 항목 | 이연 사유 |
|------|-----------|
| 사용자 인증 & 북마크 | Sprint 3 (개인화 기능) |
| 커뮤니티 기능 (댓글, 토론) | Sprint 4+ |
| 다국어 지원 | MVP 제외 |
| 모바일 앱 | Post-MVP (웹 우선) |
| 고급 분석 (중심성 지표, PageRank) | Sprint 3+ |
| 임베딩 캐싱 & CDN | Sprint 3 (비용 최적화) |

### 참조 문서

| 파일 | 용도 |
|------|------|
| `docs/meetings/mythgraph/decisions-be-technical.md` | Sprint 1-2 기술 결정사항 |
| `docs/meetings/mythgraph/decisions-pm-perspective.md` | Sprint 1-2 PM 의사결정 |
| `docs/meetings/mythgraph/seed-data-resources.md` | Seed 데이터 문헌 자료 |
| `packages/neo4j-seed/` | Seed 데이터 로드 스크립트 |

---

*회의록 작성: TS Alex | 다음 회의: Sprint 2 리뷰*
