---
name: mythgraph_tech_decisions
description: MythGraph Sprint 2 기술 결정 — 벡터 임베딩 (OpenAI) vs 최단 경로 (Dijkstra)
type: project
---

# MythGraph 기술 결정 기록 (2026-08-07)

## OQ-6: 벡터 임베딩 공급자 선택

**결정:** OpenAI text-embedding-3-small

**근거:**
- **한글 성능:** Multilingual embedding에서 한국어 우수, 신화 한글 텍스트 의미 이해도 높음
- **응답 속도:** 안정적으로 <200ms 응답, SLA 1.5초 충분한 여유
- **비용:** $50-200/월 (text-embedding-3-small $0.02/1M 토큰)
- **커뮤니티:** 최풍부한 한국 개발자 문서 및 운영 사례
- **안정성:** 다수 한국 프로덕션 서비스 검증됨

**차선 대안:** DeepSeek (가격 저렴 $20-80, 한글 지원도 좋음, 하지만 응답속도 150-300ms, 중국 정책 불확실성)

**구현 핵심:**
- API 키: 환경변수로 관리 (프로덕션: AWS Secrets Manager)
- 배치 처리: 신화 데이터 백필 시 100개 배치로 일괄 임베딩
- 캐싱: Redis (entity_id → embedding), TTL 24시간
- 폴백: 2초 이상 응답 없으면 기본 전문 검색으로 대체
- 모니터링: 평균 응답시간, 캐시 히트율, API 에러율

---

## OQ-7: 최단 경로 알고리즘 선택

**결정:** Dijkstra 알고리즘 (Neo4j GDS 네이티브 구현)

**근거:**
- **가중치 지원:** 관계마다 다른 의미적 거리 정확히 반영 (부모-자식 1.0, 동료 2.5 등)
- **정확도:** 항상 weighted shortest path 보장. A*의 휴리스틱 오버헤드 불필요
- **Neo4j 최적화:** `gds.shortestPath.dijkstra` 함수 인메모리 실행, P95 <500ms
- **구현:** Cypher 한 줄로 구현 가능, 개발 속도 빠름
- **응답:** 70개 entity 규모에서 SLA 2초 충분히 달성

**A* vs Dijkstra 트레이드오프:**
- A*는 휴리스틱(좌표/거리)이 필요한데, 신화 entity 간 좌표 정의가 의미론적이지 않음
- A*의 탐색 공간 축소 이득이 신화 그래프 소규모에선 미미
- 따라서 A*의 추가 복잡성이 정당화되지 않음

**구현 핵심:**
- 관계 가중치: PARENT(1.0), SIBLING(1.5), MYTH_RELATED(2.0)
- GDS 프로젝션: 앱 시작 시 로드, 변경 시 30초 배치 재구성
- 필터링: 여러 프로젝션 관리 (lineage, mythology, historical 등)
- 캐싱: Redis key `dijkstra:${fromId}:${toId}:${filterType}`, TTL 1시간
- 모니터링: 경로 길이 분포, GDS 실행시간, 캐시 히트율

---

## 두 결정의 시너지

**Hybrid 검색 가능:**
- 벡터 임베딩 (OpenAI): 의미론적 유사도 계산
- Dijkstra 경로: 구조적 거리 계산
- 결합: "Zeus와 관련된 신" → 의미 유사 entity 찾고 → Zeus까지 경로 표시

**구현 로드맵:**
1. Phase 1 (주 1-2): OpenAI 임베딩 + Redis 캐시
2. Phase 2 (주 2-3): Dijkstra 경로 탐색 통합
3. Phase 3 (주 3-4): 통합 테스트, 성능 튜닝, 가중치 재조정

**리스크 관리:**
- OpenAI 과금 폭증 → 월 토큰 제한, 캐시 TTL 조정
- Dijkstra 응답시간 초과 → 경로 깊이 제한(max_hops=8), 경로 사전계산
- 가중치 부정확 → 사용자 피드백 기반 A/B 테스트

**Why:** 의미론적 검색과 관계 탐색은 Spring 2 핵심 기능. 프로덕션 안정성과 한글 지원이 최우선.

**How to apply:** 향후 신화 데이터 추가/수정 시 이 기술 스택 고려. 벡터 임베딩 부하 증가 시 배치 최적화. Dijkstra 성능 저하 시 경로 깊이/캐시 재조정.
