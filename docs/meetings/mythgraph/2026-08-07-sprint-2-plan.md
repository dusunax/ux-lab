# Sprint 2 플랜

**문서 작성:** 2026-08-07  
**기간:** 2주 (Day 11-20)  
**상태:** 플랜 작성 중  
**배경:** Sprint 1 Foundation 완료. 고급 기능 & 안정성 강화 단계

---

## 목표

> **의미론적 검색 · 최단 경로 고도화 · 데이터 안정성 확보**  
> Foundation 위에서 검색 고급화, 관계 탐색 정교화, 테스트·성능 최적화로 MVP 완성도 제고

---

## 주요 작업 (백로그)

| # | 항목 | 영역 | 예상 일정 |
|---|------|------|---------|
| 1 | MG-05: Myth 탐색 기능 (Myth/Event 중심 탐색) | 기능 | Day 11-12 |
| 2 | MG-04: 최단 경로 고도화 (가중치, 경로 필터링) | 기능 | Day 11-14 |
| 3 | MG-06-A: 벡터 임베딩 공급자 최종 선택 & 인터페이스 설계 | 기능 | Day 11 |
| 4 | MG-06-B: 의미론적 검색 (Keyword + Vector 하이브리드) | 기능 | Day 13-16 |
| 5 | 관계 유형 검증 & 데이터 무결성 스크립트 | 안정성 | Day 12-13 |
| 6 | 그래프 시각화 성능 최적화 (노드 ≤200, memoization) | 성능 | Day 14-15 |
| 7 | GraphQL Resolver 통합 테스트 (깊이 제한, 복잡도 상한) | 테스트 | Day 15-17 |
| 8 | E2E 테스트 커버리지 확대 (검색, 그래프, 최단 경로) | 테스트 | Day 16-18 |
| 9 | 성능 벤치마크 & 모니터링 (응답시간, 메모리) | 성능 | Day 17-19 |
| 10 | Seed 데이터 확대 & 검증 (80 → 150+ entities) | 데이터 | Day 18-19 |

---

## 수용 기준 (Acceptance Criteria)

**기능 (7개)**
- [ ] Myth/Event 노드 조회 API 구현 (Myth → Event → Entity 연쇄 탐색)
- [ ] 최단 경로 알고리즘 (A*, Dijkstra) 구현 및 옵션 선택 가능
- [ ] 벡터 임베딩 공급자 추상화 인터페이스 완성
- [ ] Keyword + Vector 하이브리드 검색 API 구현
- [ ] 검색 성능 기준 달성 (평균 <1초)
- [ ] 최단 경로 성능 기준 달성 (평균 <2초)
- [ ] Myth 탐색 성능 기준 달성 (평균 <1.5초)

**안정성 (4개)**
- [ ] 관계 유형 검증 자동화 (무효한 관계 감지 0개)
- [ ] 데이터 무결성 스크립트 통과 (orphaned nodes 0개)
- [ ] GraphQL 쿼리 깊이 제한 + 복잡도 상한 테스트 완료
- [ ] Seed 데이터 150+ entities 로드 & 검증 완료

**성능 (3개)**
- [ ] React Flow 그래프 렌더링 60fps (노드 ≤200)
- [ ] API 응답시간 99 percentile <3초
- [ ] 메모리 사용량 안정성 (메모리 누수 0개)

**테스트 (3개)**
- [ ] 통합 테스트 커버리지 70% 이상
- [ ] E2E 테스트 (검색, 그래프, 최단 경로, Myth 탐색) 각 3개 이상
- [ ] 성능 테스트 (부하 시뮬레이션, 느린 네트워크) 완료

---

## 제외 범위 (Out of Scope)

| 항목 | 이연 사유 |
|------|----------|
| 사용자 인증 (회원가입, 로그인) | Sprint 3 (개인화 기능 준비) |
| 북마크 & 개인 컬렉션 | Sprint 3 (사용자 데이터 필요) |
| 커뮤니티 기능 (댓글, 토론) | Sprint 4+ (협업 기능) |
| 다국어 지원 (i18n) | MVP 제외 (콘텐츠 우선) |
| 모바일 앱 (iOS/Android) | Post-MVP (웹 우선 전략) |
| 고급 분석 (그래프 통계, 중심성 지표) | Sprint 3+ (학술 기능) |
| 관계 방향 시각화 (화살표) | Sprint 2 말 (우선순위 낮음) |

---

## Open Questions

| 질문 | 담당 | 기한 | 상태 |
|------|------|------|------|
| OQ-6 | 벡터 임베딩 공급자 최종 선택 (OpenAI vs DeepSeek vs Ollama) | Blake (BE) | Day 11 | ⚠️ Open |
| OQ-7 | 최단 경로 알고리즘 선택 (A* vs Dijkstra vs BFS) | Blake (BE) | Day 11 | ⚠️ Open |
| OQ-8 | 하이브리드 검색 가중치 설정 (keyword 30% vs vector 70%) | Jordan (PM) | Day 12 | ⚠️ Open |
| OQ-9 | Seed 데이터 확대 문헌 선정 (Appolodorus, Pausanias 추가?) | Jordan (PM) | Day 12 | ⚠️ Open |
| OQ-10 | 그래프 시각화 레이아웃 고정 여부 (Dagre vs ELK vs 드래그 가능) | Alex (TS) | Day 13 | ⚠️ Open |

**회의 일정:** Sprint 2 킥오프 (Day 11, 1.5시간)

---

## 리스크

| 리스크 | 영향 | 완화 방법 |
|--------|------|----------|
| **벡터 임베딩 비용** (실제 구현 시) | 월 $50-300 증가 | Sprint 3 도입 선택 유보 가능; 로컬 Ollama 대체 검토 |
| **Neo4j 쿼리 복잡도** (연쇄 탐색) | 최단 경로 계산 폭발 | 경로 길이 상한 (≤10), 노드 수 상한 (≤100) 설정 |
| **그래프 렌더링 성능** (200+ 노드) | 브라우저 프리징 | memoization 강화, 가상화 (React Flow Pro) 검토 |
| **Seed 데이터 품질** (관계 오류) | 사용자 신뢰도 저하 | 검증 자동화, Peer review (PM + QA) |
| **백터 임베딩 품질** (의미 오류) | 검색 정확도 악화 | Sprint 3 검증 필요, 초기는 keyword 기반 주도 |
| **API 응답시간** (복합 쿼리) | SLA 위반 (>3초) | 쿼리 최적화, Redis 캐시 (임시), Neo4j 인덱스 강화 |

**완화 전략:** 
- Day 11-13: 대체 방안 미리 준비 (비용/성능 트레이드오프)
- Day 15: 성능 벤치마크 조기 실행, 병목 지점 조기 식별
- Day 19: 성능 목표 미달 시 Sprint 3 일정 조정

---

## 기술 검증 (Pre-Sprint)

### Day 11 액션: OQ 6-10 신속 결정

**OQ-6: 벡터 임베딩 공급자 (Blake)**
- **선택지:** OpenAI ($200-300/월, 95% 품질) vs DeepSeek ($50-100/월, 85%) vs Ollama (비용 0, 70%)
- **권장:** DeepSeek (비용 효율) — 단, API 레이트 제약 확인 필수
- **예상 시간:** 1시간

**OQ-7: 최단 경로 알고리즘 (Blake)**
- **선택지:** A* (정확도 높음, 계산 비용 높음) vs Dijkstra (균형) vs BFS (단순, 가중치 미지원)
- **권장:** Dijkstra (균형잡힌 선택, Neo4j 내장 지원)
- **예상 시간:** 1시간

**OQ-8: 하이브리드 검색 가중치 (Jordan)**
- **선택지:** Keyword 우선 (30% keyword + 70% vector) vs Vector 우선 (50% 각각) vs Keyword 단독 (Sprint 3 연기)
- **권장:** Keyword 우선 (Sprint 1 keyword 인덱스 활용, Vector는 보조)
- **예상 시간:** 1시간

**OQ-9: Seed 데이터 확대 문헌 (Jordan)**
- **선택지:** Homer 계속 + Apollodorus vs Homer + Pausanias vs 모두 포함 (시간 부족)
- **권장:** Homer + Apollodorus (범위 균형)
- **예상 시간:** 1.5시간 (문헌 조사)

**OQ-10: 그래프 시각화 레이아웃 (Alex)**
- **선택지:** 고정 레이아웃 (Dagre/ELK) vs 드래그 가능 (React Flow 기본) vs 혼합
- **권장:** 드래그 가능 + 자동 레이아웃 버튼 (사용성)
- **예상 시간:** 1시간

### Day 11 킥오프 회의 (1.5시간)
- OQ 6-10 신속 결정 (30분)
- Sprint 2 일정 재확인 (30분)
- 병렬 작업 분배 (30분)

---

## 개발 일정 (병렬 진행)

### Phase 1: MG-05 + MG-04 + 벡터 준비 (Day 11-14)

**Backend (Blake)**
- Day 11: OQ 결정 + Myth/Event Resolver 구현 시작
- Day 12: 최단 경로 알고리즘 (Dijkstra) 구현 + 벡터 임베딩 인터페이스 설계
- Day 13: Keyword + Vector 하이브리드 검색 Resolver (벡터는 스텁)
- Day 14: GraphQL Schema 완성, 테스트 환경 준비

**Frontend (Avery)**
- Day 11-12: Myth/Event UI 컴포넌트 (Myth 리스트, Event 타임라인)
- Day 13: 최단 경로 시각화 (경로 하이라이트, 중간 노드 표시)
- Day 14: 하이브리드 검색 UI (keyword/vector 탭)

**PM (Jordan)**
- Day 11-12: OQ-9 문헌 조사 + Seed 150개 설계
- Day 13-14: Seed 데이터 수집 & 번역 검수

### Phase 2: 안정성 & 성능 (Day 15-19)

**Backend (Blake)**
- Day 15: 통합 테스트 작성 (Myth, 최단 경로, 검색)
- Day 16: 벡터 임베딩 실제 통합 (OpenAI/DeepSeek 선택에 따라)
- Day 17: GraphQL 복잡도 테스트, 캐싱 전략
- Day 18-19: 성능 벤치마크 & 최적화

**Frontend (Avery)**
- Day 15-16: React Flow memoization, 가상화 (큰 그래프)
- Day 17: 성능 테스트 (느린 네트워크, 부하)
- Day 18-19: UI 폴리시 (로딩 상태, 오류 처리)

**QA + PM**
- Day 15-18: E2E 테스트 (검색, Myth, 최단 경로, 그래프 확장)
- Day 18-19: 데이터 품질 검증, Peer review

### Phase 3: 마무리 & 배포 준비 (Day 20)

**All**
- Day 20: 성능 목표 재확인, 문서 정리, Vercel 배포 테스트

---

## 성공 신호

**기능**
1. Myth 중심 탐색 사용 가능 (Entity → Myth → Event → Entity 연쇄)
2. 최단 경로 2개 이상 반환 가능
3. 의미 검색 +20% 관련도 개선 (keyword vs vector 비교)

**성능**
1. 초기 그래프 렌더링: 2초 이내 (노드 ≤200)
2. 최단 경로 계산: 2초 이내 (경로 길이 ≤10)
3. 의미 검색: 1.5초 이내

**안정성**
1. 관계 검증 오류 0개
2. Seed 데이터 품질 지표: 누락/오류 <1%
3. API 에러율 <0.1%

**테스트**
1. 통합 테스트 70% 커버리지
2. E2E 테스트 통과율 100%
3. 부하 테스트 (동시 100 사용자) 성공

---

## 관련 문서

- Sprint 1 플랜: `docs/meetings/mythgraph/step-2-planning.md`
- Sprint 1 결정: `docs/meetings/mythgraph/2026-08-07-sprint-1-decisions.md`
- 기술 스택: `.agent/agent-memory/product-PM-prd-product-manager/project_mythgraph.md`

---

**다음 단계:**
1. Day 11 킥오프 회의 (OQ 신속 결정)
2. Day 11-14 병렬 개발
3. Day 15-19 안정성 & 성능 강화
4. Day 20 마무리 & Sprint 3 준비

*플랜 작성: Claude Code | 최종 승인: Jordan (PM)*
