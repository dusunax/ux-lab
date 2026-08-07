---
name: mythgraph-sprint1-plan
description: MythGraph 신화 지식그래프 Sprint 1 플랜 - Foundation & Graph Explorer Phase
metadata:
  type: project
---

# MythGraph Sprint 1 플랜

## 프로젝트 개요

MythGraph는 그리스·로마 신화의 인물, 신, 괴물, 장소, 사건과 그 관계를 **인터랙티브 지식 그래프**로 탐색하는 웹 서비스입니다.

기술 스택:
- **Frontend**: Next.js, React, TypeScript, React Flow, Apollo Client
- **Backend**: Next.js App Router, GraphQL Yoga
- **Database**: Neo4j AuraDB
- **Deployment**: Vercel

## Sprint 1 목표

**Foundation 구축**: 기본 Next.js + GraphQL + Neo4j 통합, Entity 검색 및 1단계 관계 그래프 탐색 가능하게 만들기

**기간**: 2주 (Day 1-10)

## 핵심 기능

### MVP 범위 (Sprint 1-2)
- MG-01: Entity 검색 (이름, 별칭, 유형 필터)
- MG-02: Entity 상세 (설명, 별칭, 주요 관계)
- MG-03: 관계 그래프 (1단계 + 동적 확장)
- MG-04: 최단 경로 (Sprint 2)
- MG-05: Myth 탐색 (Sprint 2)
- MG-06: 의미 검색 (Sprint 2-3, 임베딩 공급자 확정 필요)
- MG-07: 출처 표시 (Sprint 2)
- MG-08: Seed 데이터 (50-80 Entity, 150-250 관계)

### Sprint 1 스코프

**Phase 1: Foundation**
- Next.js + GraphQL Yoga 통합
- Neo4j 드라이버 초기화 (서버 전용)
- GraphQL Schema (Entity, Graph 타입)
- Entity 검색 Resolver
- Neo4j Constraints & Full-text Index

**Phase 2: Graph Explorer**
- Entity 1단계 그래프 조회
- React Flow 렌더링
- 노드 확장 (동적 조회)
- 노드/관계 필터링
- Graph DTO Mapper

## 수용 기준 (12개)

- [x] Entity 이름/별칭으로 검색 가능
- [x] Entity 유형 필터링 가능
- [x] 검색 결과에서 Entity 선택 → 상세 + 1단계 그래프 표시
- [x] 노드 클릭 → 주변 관계 동적 확장
- [x] 동일 노드 중복 제거
- [x] 관계 유형 필터링
- [x] 성능 목표: 검색 1초, 그래프 2초, 노드 확장 1.5초
- [x] 그래프 렌더링 노드 ≤100, Edge ≤200
- [x] Neo4j 자격증명 서버 전용 (브라우저 미노출)
- [x] GraphQL API 공개 HTTPS
- [x] Vercel 배포 성공
- [x] 기본 E2E 테스트 통과

## 제외 범위 (이연)

| 항목 | 이연 버전 | 사유 |
|------|---------|------|
| 최단 경로 (MG-04) | Sprint 2 | Phase 4로 독립 구현 |
| 의미 검색 (MG-06) | Sprint 2-3 | 임베딩 공급자 확정 필요 |
| Myth/Event 중심 탐색 (MG-05) | Sprint 2 | Entity 1단계 안정화 후 |
| 출처 상세 (MG-07) | Sprint 2 | 기본 구조 먼저 |
| 사용자 인증 | Post-MVP | MVP 제외 |
| 관리자 CRUD UI | Post-MVP | Seed script로 대체 |

## 결정 필요 (Open Questions)

**킥오프 시 결정 (Day 1-3)**

| # | 질문 | 담당 | 기한 | 상태 |
|---|------|------|------|------|
| 1 | Entity 노드 라벨: 공통 Entity + 보조(:Deity, :Human) vs 분리? | Backend | Day 1 | ⚠️ Open |
| 2 | Myth/Event를 별도 노드 vs 관계 속성? | PM | Day 1 | ⚠️ Open |
| 3 | 임베딩 공급자 (OpenAI vs DeepSeek vs 오프라인)? | Backend | Day 1 | ⚠️ Open |
| 4 | Neo4j 읽기/쓰기 계정 분리 여부? | Backend | Day 1 | ⚠️ Open |
| 5 | React Flow 레이아웃 엔진 (Dagre vs ELK)? | Frontend | Day 2 | ⚠️ Open |
| 6 | Seed 데이터 기준 문헌 & 번역 표기 | PM | Day 3 | ⚠️ Open |

**Why**: 이들 결정이 Sprint 1 아키텍처와 데이터 모델에 직접 영향

## 주요 리스크

| 리스크 | 영향 | 완화 방법 |
|--------|------|---------|
| **Neo4j 연결 누수** (Vercel 서버리스) | 세션 누적, 연결 고갈 | Driver 재사용, Session 요청 단위 종료, monitoring |
| **GraphQL 복잡도 공격** (공개 API) | 쿼리 폭발 | depth/limit 상한, Query complexity 제한 라이브러리 |
| **React Flow 성능** (100+ 노드) | 프레임 드롭 | 노드 상한 100개, memoization, 부분 업데이트 |
| **데이터 모델 불안정** | Schema inconsistency | 관계 유형 사전, validation script 필수화 |
| **임베딩 비용** | 의미 검색 불가 | Sprint 1에서 제외, Seed 오프라인 생성 |
| **무료 인프라 제약** | 응답 지연, 가용성 | 작은 데이터셋, 캐시 전략 조기 검토 |

**How to apply**: 매일 morning standup에서 리스크 상태 체크, blocked 항목 즉시 에스컬레이션

## 기술 결정 (System Architecture 기반)

### Decision: Next.js App Router + GraphQL Yoga

**Why**: 프론트엔드와 GraphQL BFF를 단일 프로젝트로 관리, Neo4j 자격증명을 서버 환경변수로 격리

### Decision: GraphQL Yoga 단독 사용 (Neo4j GraphQL Library는 Post-MVP)

**Why**: 핵심 Query를 직접 Resolver + Cypher로 작성해서 학습 목표 달성, 자동 생성 API 의존성 최소화

### Decision: React Flow는 렌더링 전용

책임:
- 노드/Edge 렌더링
- 선택, 드래그, 줌, 패닝
- 노드 확장 이벤트
- 필터

비책임:
- Neo4j Query 실행
- 도메인 관계 추론

### Decision: Graph DTO 도메인 중립

API는 React Flow 좌표가 아니라 도메인 DTO 반환 → 클라이언트에서 React Flow 형식 변환

## Rollout (System Architecture Phase)

**Phase 1**: Foundation (Next.js, GraphQL, Neo4j Driver, Entity 검색)  
**Phase 2**: Graph Explorer (그래프 조회, React Flow, 노드 확장)  
Phase 3: Content (Entity 상세, Myth/Event) → Sprint 2  
Phase 4: Path (최단 경로) → Sprint 2  
Phase 5: Vector Search (임베딩, semantic search) → Sprint 2-3  
Phase 6: Stabilization (테스트, 성능, 배포) → Sprint 1 마지막 2일  

## Seed 데이터

### 범위
- Entity: 50-80개
- Myth: 10-15개
- Event: 15-25개
- 관계: 150-250개
- Source: 5-10개
- Knowledge Chunk: 100개 이상 (Vector Search용, Sprint 2)

### 우선 데이터
- 올림포스 주요 신
- 티탄 신족
- 페르세우스, 헤라클레스, 테세우스
- 트로이 전쟁 참여자
- 오디세우스
- 주요 괴물, 유물, 장소

### Validation Script
- 중복 ID/slug 체크
- 존재하지 않는 참조 체크
- 허용되지 않는 관계 유형
- Source 누락
- 역관계 중복

## 성공 신호

**기능**
1. 검색 후 Entity 상세 도달 100%
2. 그래프 노드 확장 95% 이상
3. 데이터 검증 통과 (중복 0)

**성능**
1. Entity 검색: 1초 이내
2. 초기 그래프: 2초 이내
3. 노드 확장: 1.5초 이내

**배포**
1. Vercel 배포 성공
2. GraphQL endpoint 동작
3. Neo4j 연결 성공

## 팀 구성 (예상)

- **PM (Jordan)**: Scope 관리, 우선순위, Open Questions 결정
- **Backend**: Neo4j, GraphQL, Cypher, Server-side logic
- **Frontend**: React Flow, UI/UX, Apollo Client
- **TS (Alex)**: 회의록, 기술 의사결정 문서화, 아키텍처 검증
- **QA**: 테스트 계획, E2E 테스트

## 진행 방식

**Day 1 (킥오프)**
- OQ 6개 신속 결정
- Environment 세팅 (Neo4j Aura, Vercel)
- Seed 데이터 문헌 기준 확정
- 팀 간 responsibility 명확화

**Day 2-8 (개발)**
- Backend: Phase 1-2 구현
- Frontend: Phase 1-2 구현
- Morning standup, evening check-in
- Blocked 항목 즉시 에스컬레이션

**Day 9-10 (검증)**
- E2E 테스트
- 성능 측정
- Vercel 배포 & smoke test
- 기술 문서 정리

---

**Related**: [[fridge-recipe 앱 현황]], [[멀티 에이전트 코드 리뷰 파이프라인]]
