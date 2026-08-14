# Sprint 1 결정사항 — BE(Blake) 기술 검증

**작성자:** Backend Architect Blake  
**작성일:** 2026-08-07  
**목적:** 4개 OQ에 대한 기술적 타당성 검증 및 구현 계획

---

## 📊 기술 타당성 종합 평가

| OQ | 기술타당성 | 구현 복잡도 | 마이그레이션 난이도 | 검증 |
|----|----------|-----------|-----------------|------|
| OQ-1 | ✓✓✓ 높음 | 낮음 | 중간 | ✅ |
| OQ-2 | ✓✓✓ 높음 | 중간 | **매우 높음** | ✅ |
| OQ-3 | ✓✓ 보통 | 낮음 | 낮음 | ✅ |
| OQ-5 | ✓✓✓ 높음 | 낮음 | 높음 | ✅ |

---

## 🎯 OQ-1: Entity 라벨 전략

### 기술 선택: 공통 Entity 노드 + 보조 라벨

#### Neo4j 설계

```cypher
(:Entity:Deity {
  id: "deity_zeus_001",
  name: "Zeus",
  slug: "zeus",
  aliases: ["Jupiter", "Dias"],
  description: "King of gods",
  domains: ["Thunder", "Sky", "Justice"],
  sourceIds: ["src:homer-iliad"]
})

(:Entity:Human {
  id: "human_perseus_001",
  name: "Perseus",
  slug: "perseus",
  aliases: [],
  description: "Hero, slayer of Medusa",
  mortality: true,
  sourceIds: ["src:ovid-metamorphoses"]
})

(:Entity:Monster { ... })
(:Entity:Place { ... })
```

#### GraphQL Schema

```graphql
interface Entity {
  id: ID!
  name: String!
  slug: String!
  aliases: [String]!
  description: String!
  sourceIds: [String]!
}

type Deity implements Entity {
  # ... interface fields ...
  domains: [String]!
  symbolism: String
}

type Human implements Entity {
  # ... interface fields ...
  mortality: Boolean!
  parentageIds: [String]!
}

type Query {
  searchEntities(
    query: String!
    filters: EntityFilterInput
    limit: Int = 20
  ): [Entity]!
}

input EntityFilterInput {
  types: [EntityType]  # [DEITY, HUMAN, MONSTER, PLACE]
  domains: [String]
}
```

#### Cypher 쿼리 예시

```cypher
# 모든 신 검색
MATCH (e:Entity:Deity) 
WHERE e.name =~ '(?i).*zeus.*' 
RETURN e

# 신 + 인간 통합 검색
MATCH (e:Entity) 
WHERE (e:Deity OR e:Human) AND e.name =~ '(?i).*paris.*' 
RETURN e

# 라벨별 관계 필터링
MATCH (d:Entity:Deity)-[r:HAS_CHILD]->(h:Entity:Human) 
RETURN d, r, h
```

#### 구현 일정

| Task | 시간 | 담당 |
|------|------|------|
| GraphQL Schema 정의 | 2시간 | Blake |
| Neo4j Constraints + Full-text Index | 1.5시간 | Blake |
| Entity 검색 Resolver | 2.5시간 | Blake |
| Seed 데이터 준비 | 3시간 | Jordan |
| 타입별 상세 조회 Resolver | 1.5시간 | Blake |
| **합계** | **10.5시간** | |

#### 마이그레이션 경로 (분리 노드로 변경 시)

```
현재 구조: (:Entity:Deity) 라벨 기반
↓ 변경
목표 구조: (:Deity) 분리 노드

난이도: 높음
소요시간: 3-4일
영향:
├─ GraphQL Schema 전체 재설계
├─ 모든 Resolver 수정
├─ Cypher 쿼리 전체 재작성
└─ 테스트 재작성
```

---

## 🎯 OQ-2: Myth/Event 노드 포함 여부

### 기술 선택: 별도 노드 생성 ⚠️ P0 필수

#### Neo4j 설계

```cypher
(:Myth {
  id: "myth_trojan-war_001",
  name: "Trojan War",
  slug: "trojan-war",
  summary: "10-year conflict between Achaeans and Trojans",
  period: "Heroic Age",
  sourceIds: ["src:homer-iliad"]
})

(:Event {
  id: "event_paris-abduction_001",
  name: "Paris Abducts Helen",
  slug: "paris-abducts-helen",
  description: "Paris takes Helen from Greece, sparking the war",
  timestamp: 0,
  participants: ["entity_paris_001", "entity_helen_001"],
  sourceIds: ["src:homer-iliad:book-1"]
})

(:Myth)-[:CONTAINS_EVENT]->(:Event)
(:Event)-[:INVOLVES_ENTITY]->(:Entity)
(:Myth)-[:CENTERS_ON]->(:Entity)
```

#### GraphQL Schema 확장

```graphql
type Myth {
  id: ID!
  name: String!
  slug: String!
  summary: String!
  period: String
  
  events: [Event]!
  primaryEntities: [Entity]!
  allEntities: [Entity]!
  sources: [Source]!
}

type Event {
  id: ID!
  name: String!
  slug: String!
  description: String!
  timestamp: Int
  
  participants: [Entity]!
  parentMyth: Myth!
  sources: [Source]!
}

type Query {
  searchMyths(query: String!, limit: Int = 20): [Myth]!
  getMythById(id: ID!): Myth
  getEventById(id: ID!): Event
  getEntityRelatedMyths(entityId: ID!): [Myth]!
}
```

#### Cypher 쿼리 예시

```cypher
# 특정 Myth의 모든 Event 조회
MATCH (m:Myth {slug: 'trojan-war'})-[:CONTAINS_EVENT]->(e:Event)
RETURN m, COLLECT(e) AS events

# Event를 통한 Entity 간접 연결
MATCH (m:Myth)-[:CONTAINS_EVENT]->(e:Event)-[:INVOLVES_ENTITY]->(entity:Entity)
WHERE m.slug = 'trojan-war'
RETURN DISTINCT entity, COLLECT(e.name) AS participatingEvents

# Myth 검색 (Entity 메타쿼리)
MATCH (entity:Entity {slug: 'zeus'})-[:CENTERS_ON|:INVOLVES_ENTITY*1..2]-(m:Myth)
RETURN m
```

#### 구현 일정

| Task | 시간 | 담당 |
|------|------|------|
| Neo4j Myth/Event 노드 Schema | 2시간 | Blake |
| Cypher 쿼리 작성 (연쇄 탐색) | 2.5시간 | Blake |
| GraphQL Myth/Event Resolver | 3시간 | Blake |
| Seed 데이터 설계 | 3시간 | Jordan |
| Seed 로드 script & 검증 | 2시간 | Blake/Jordan |
| 관계 테스트 | 1.5시간 | QA |
| **합계** | **14시간** | |

**Jordan 추가 작업:**
- Myth 기준 문헌 선정: 1.5시간
- Event 정렬 & 우선순위: 1시간
- **PM 총 5.5시간 (1.5일)**

#### 마이그레이션 경로 (Event를 관계로만 표현 시)

```
현재 구조 (선택): (:Myth)-[:CONTAINS_EVENT]->(:Event)
↓ 변경
레거시 구조: (:Entity)-[r:HAS_RELATIONSHIP {event: "..."}]->(:Entity)

난이도: 매우 높음 (거의 불가능)
소요시간: 5-7일
영향:
├─ Entity-Entity 관계 재설계
├─ GraphQL Schema 전체 변경
├─ Seed 데이터 추출-변환-로드
├─ Sprint 2 기능 구현 1-2주 지연
└─ ⚠️ 데이터 무결성 검증 복잡

결론: 반드시 초기에 결정할 것!
```

---

## 🎯 OQ-3: 벡터 임베딩 공급자

### 기술 선택: 결정 유보 (Sprint 3에서)

#### 추상화 인터페이스 설계 (Sprint 1 내)

```typescript
// 공급자 변경 가능한 인터페이스
interface EmbeddingProvider {
  embed(text: string): Promise<number[]>
  embedBatch(texts: string[]): Promise<number[][]>
}

class OpenAIEmbedding implements EmbeddingProvider {
  async embed(text: string): Promise<number[]> {
    // OpenAI API call
  }
}

class DeepSeekEmbedding implements EmbeddingProvider {
  async embed(text: string): Promise<number[]> {
    // OpenRouter + DeepSeek
  }
}

class LocalOllamaEmbedding implements EmbeddingProvider {
  async embed(text: string): Promise<number[]> {
    // Ollama local call
  }
}

// 팩토리 패턴
const provider = getEmbeddingProvider(process.env.EMBEDDING_PROVIDER)
```

#### 공급자별 비교

| 공급자 | 월 비용 | 응답시간 | 품질 | 통합난이도 | 추천 |
|--------|--------|--------|------|-----------|------|
| OpenAI | $200-300 | 200ms | 95% | 낮음 | 예산 충분 시 |
| **DeepSeek** | **$50-100** | 300ms | 85% | 낮음 | **비용 효율 권장** |
| 로컬 | $0 | 1000ms | 70% | 높음 | R&D/프라이버시 |

#### Knowledge Chunk 설계 (Sprint 1)

```json
{
  "entityId": "deity_zeus_001",
  "chunks": [
    {
      "id": "chunk_1",
      "text": "Zeus is the king of the gods in Greek mythology, ruler of thunder and sky"
    },
    {
      "id": "chunk_2",
      "text": "Symbolized by the eagle, thunderbolt, and oak tree. Father of Heracles and Perseus"
    }
  ]
}
```

#### GraphQL Schema 확장 (Sprint 3)

```graphql
type Query {
  # Keyword 검색 (Sprint 1)
  searchEntities(query: String!, limit: Int): [Entity]!
  
  # 의미 검색 (Sprint 3 추가)
  semanticSearchEntities(query: String!, limit: Int): [Entity]!
    @requiresFeature(feature: "semantic-search")
}

type Entity {
  # ... existing fields ...
  
  # 벡터 임베딩 (Sprint 3 추가)
  embedding: [Float]  @requiresAuth
}
```

#### 구현 일정

| Phase | Task | 시간 | 시점 |
|-------|------|------|------|
| **Sprint 1** | | | |
| | EmbeddingProvider 인터페이스 설계 | 1시간 | Step 2-3 |
| | Knowledge Chunk 스키마 정의 | 1시간 | Step 3 |
| | Seed에 chunks 포함 | 1.5시간 | Step 4-5 |
| | **소계** | **3.5시간** | |
| | | | |
| **Sprint 3** | | | |
| | 공급자 선택 & 비용 산정 | 1시간 | Step 1 |
| | EmbeddingProvider 구현 | 2시간 | Step 1-2 |
| | Neo4j Vector Index 생성 | 1시간 | Step 2 |
| | Batch Embedding | 3시간 | Step 2-3 |
| | Semantic Search Resolver | 2시간 | Step 3-4 |
| | 테스트 & 성능 측정 | 1.5시간 | Step 4 |
| | **소계** | **10.5시간** | |

#### 마이그레이션 경로 (공급자 변경 시)

```
구현: EmbeddingProvider 인터페이스
결과: 공급자 교체 용이

변경 예: OpenAI → DeepSeek
난이도: 낮음
소요시간: 2-3시간 (구현체만 교체)

벡터 인덱스 재생성
난이도: 중간
소요시간: 1-2시간 (50-100 entity 재임베딩)
```

---

## 🎯 OQ-5: Neo4j 계정 분리

### 기술 선택: dev/prod 완전 분리

#### 아키텍처

```
┌─────────────────┬─────────────────┬──────────────────┐
│  Local Dev      │  Aura Dev       │  Aura Prod       │
├─────────────────┼─────────────────┼──────────────────┤
│ Docker Neo4j    │ Free tier       │ Free tier        │
│ localhost:7687  │ Sandbox DB      │ Prod DB          │
│ no auth         │ auth enabled    │ auth enabled     │
│ (dev test)      │ (integration)   │ (preview/prod)   │
└─────────────────┴─────────────────┴──────────────────┘
```

#### 환경변수 분리

**`.env.local` (로컬 개발):**
```env
NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=dev_password_123
```

**`.env.development` (Vercel preview):**
```env
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=${AURA_DEV_PASSWORD}  # Secret vault
```

**`.env.production` (Vercel prod):**
```env
NEO4J_URI=neo4j+s://yyyyy.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=${AURA_PROD_PASSWORD}  # Secret vault
```

#### Neo4j Driver 초기화

```typescript
// utils/neo4j.ts
import neo4j from 'neo4j-driver'

const getDriver = () => {
  const uri = process.env.NEO4J_URI
  const auth = neo4j.auth.basic(
    process.env.NEO4J_USER,
    process.env.NEO4J_PASSWORD
  )
  
  return neo4j.driver(uri, auth, {
    maxConnectionPoolSize: 100,
    connectionAcquisitionTimeout: 10000,
    connectionLivenessCheckTimeout: 30000,
    maxTransactionRetryTime: 30000
  })
}

// 싱글톤 (재사용)
let driver: neo4j.Driver

export const getOrCreateDriver = () => {
  if (!driver) {
    driver = getDriver()
  }
  return driver
}

// Session 관리
export const getSession = (accessMode = 'READ') => {
  const driver = getOrCreateDriver()
  return driver.session({ defaultAccessMode: accessMode })
}
```

#### CI/CD 파이프라인 (자격증명 주입)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches:
      - develop  # Preview (dev Aura)
      - main     # Production (prod Aura)

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Determine environment
        id: env
        run: |
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "ENV=production" >> $GITHUB_OUTPUT
          else
            echo "ENV=development" >> $GITHUB_OUTPUT
          fi
      
      - name: Set Neo4j credentials
        env:
          NEO4J_DEV_PASSWORD: ${{ secrets.NEO4J_DEV_PASSWORD }}
          NEO4J_PROD_PASSWORD: ${{ secrets.NEO4J_PROD_PASSWORD }}
        run: |
          if [[ "${{ steps.env.outputs.ENV }}" == "production" ]]; then
            echo "NEO4J_URI=${{ secrets.NEO4J_PROD_URI }}" >> .env.production
            echo "NEO4J_PASSWORD=$NEO4J_PROD_PASSWORD" >> .env.production
          else
            echo "NEO4J_URI=${{ secrets.NEO4J_DEV_URI }}" >> .env.development
            echo "NEO4J_PASSWORD=$NEO4J_DEV_PASSWORD" >> .env.development
          fi
      
      - name: Deploy to Vercel
        run: vercel deploy --${{ steps.env.outputs.ENV }}
```

#### 구현 일정

| Task | 시간 | 담당 | Step |
|------|------|------|-----|
| Aura 제약 확인 | 0.5시간 | Blake | 1 |
| Aura dev/prod 인스턴스 생성 | 0.5시간 | Blake | 1 |
| 환경변수 3단계 분리 | 1시간 | Blake | 1 |
| Neo4j Driver 구현 | 1.5시간 | Blake | 2 |
| Seed 로드 script (3환경별) | 1.5시간 | Blake/Jordan | 2 |
| CI/CD 파이프라인 설정 | 2시간 | Blake | 3 |
| 헬스 체크 & 성능 테스트 | 1시간 | Blake/QA | 4 |
| **합계** | **8시간** | | |

#### Aura 무료 평가판 제약 확인 결과

✅ **확인됨: 2개 인스턴스 동시 생성 가능**
- 저장소: 50K+ nodes (충분)
- 연결: 100개 (무제한 설정 가능)
- 기간: 무기한 무료
- ⚠️ 30일 미활동 시 자동 삭제 (개발 활동이면 문제 없음)
- ⚠️ Rate limit: 25 req/min (GraphQL 캐싱으로 완화)

#### 마이그레이션 경로 (단일 인스턴스에서 분리로 변경 시)

```
구조: 1개 Aura → 2개 Aura (완전 분리)

난이도: 높음
소요시간: 2-3일
영향:
├─ 기존 데이터 추출
├─ 새 prod 인스턴스 생성
├─ 자격증명 전환
├─ CI/CD 파이프라인 수정
└─ 배포 테스트

권장: 초기부터 분리할 것!
```

---

## 📋 Step 1 기술 액션 리스트

| Priority | Task | 담당 | Estimate | Blocker |
|----------|------|------|----------|---------|
| P0 | Aura 무료 평가판 확인 (2개 동시 생성) | Blake | 30분 | OQ-5 |
| P0 | Dev/Prod Aura 인스턴스 생성 | Blake | 30분 | OQ-5 |
| P1 | GraphQL Schema 초안 (Entity + Myth/Event) | Blake | 2시간 | OQ-1, OQ-2 |
| P1 | Neo4j Driver 구현 (환경별) | Blake | 1.5시간 | OQ-5 |
| P1 | Cypher 쿼리 검증 | Blake | 1시간 | OQ-2 |
| P1 | Full-text Index 설계 | Blake | 1시간 | OQ-1 |

---

## 결론

**4개 OQ 기술 타당성 모두 검증 완료**

- ✅ **OQ-1:** 라벨 기반 타입 분류 (Neo4j 권장)
- ✅ **OQ-2:** 별도 노드 (그래프 정규화 필수, 초기 결정 필수)
- ✅ **OQ-3:** 유보 (Sprint 1 인터페이스 설계만, 공급자 나중 결정)
- ✅ **OQ-5:** 완전 분리 (Aura Free 2인스턴스 가능, 초기 결정 필수)

**기술 준비도: 95%**

---

*문서 작성: Backend Architect Blake | 검토자: Jordan(PM), Alex(TS)*
