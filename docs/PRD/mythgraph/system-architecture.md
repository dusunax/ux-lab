# MythGraph System Architecture

| 항목 | 내용 |
| --- | --- |
| 프로젝트명 | MythGraph |
| 문서 유형 | System Architecture |
| 작성일 | 2026-08-07 |
| 상태 | Draft |
| 대상 버전 | MVP |
| 런타임 | Next.js Node.js Runtime |
| 호스팅 | Vercel |
| 데이터베이스 | Neo4j AuraDB |
| API | GraphQL Yoga |
| 시각화 | React Flow |
| 인증 | MVP 제외 |

---

## 1. Architecture Overview

### 1-1. 목적

본 문서는 MythGraph MVP를 구현하기 위한 시스템 경계, 런타임 구성, 데이터 모델, GraphQL 계층, Neo4j 접근 방식, Vector Search 흐름 및 배포 구조를 정의한다.

핵심 원칙은 다음과 같다.

1. Neo4j 자격 증명과 Driver는 서버에서만 사용한다.
2. 브라우저는 GraphQL API 외에 Neo4j를 직접 호출하지 않는다.
3. GraphQL Schema는 제품 도메인을 표현하고, Cypher 구현 세부사항을 숨긴다.
4. React Flow는 그래프 표현과 상호작용만 담당한다.
5. 그래프 조회는 무제한 순회를 허용하지 않는다.
6. MVP 데이터 변경은 관리자 UI가 아니라 seed script로 수행한다.
7. Vector Search 결과는 구조적 그래프 탐색으로 연결한다.

---

## 2. High-Level Architecture

```text
┌─────────────────────────────────────────────────────┐
│ Browser                                             │
│                                                     │
│ Next.js Client Components                           │
│ ├─ React Flow                                       │
│ ├─ Search UI                                        │
│ ├─ Detail Panel                                     │
│ └─ Apollo Client                                    │
└──────────────────────────┬──────────────────────────┘
                           │ HTTPS / GraphQL
                           ▼
┌─────────────────────────────────────────────────────┐
│ Vercel / Next.js                                    │
│                                                     │
│ App Router                                          │
│ ├─ Server Components                                │
│ └─ /api/graphql Route Handler                       │
│      └─ GraphQL Yoga                                │
│          ├─ Schema                                  │
│          ├─ Resolvers                               │
│          ├─ Validation / Limits                     │
│          ├─ Cypher Repository                       │
│          └─ DTO Mapper                              │
└──────────────────────────┬──────────────────────────┘
                           │ Bolt over TLS
                           ▼
┌─────────────────────────────────────────────────────┐
│ Neo4j AuraDB                                        │
│                                                     │
│ ├─ Graph Nodes                                      │
│ ├─ Relationships                                    │
│ ├─ Constraints                                      │
│ ├─ Full-text Index                                  │
│ └─ Vector Index                                     │
└─────────────────────────────────────────────────────┘

                           ┌───────────────────────────┐
                           │ Embedding Provider        │
                           │ 또는 Local Seed Pipeline  │
                           └───────────────────────────┘
```

---

## 3. Technology Decisions

### Decision 1. Next.js App Router를 프론트엔드와 BFF로 사용한다

#### 이유

- React 기반 UI와 서버 API를 하나의 프로젝트에서 관리할 수 있다.
- Vercel에 프론트엔드와 GraphQL API를 함께 배포할 수 있다.
- Neo4j 자격 증명을 서버 환경변수로 제한할 수 있다.
- Server Component와 Client Component의 역할을 구분할 수 있다.

#### 대안

- React SPA + 별도 Node.js 백엔드
- Remix
- NestJS GraphQL 서버

#### Trade-off

**장점**

- 배포 단위가 단순하다.
- 초기 개발 속도가 빠르다.
- 서버와 클라이언트 타입을 한 저장소에서 공유하기 쉽다.

**단점**

- API와 UI 배포 수명주기가 결합된다.
- 장시간 실행되는 그래프 작업에는 서버리스 런타임이 불리할 수 있다.
- 프로젝트가 커질 경우 별도 API 서비스로 분리할 가능성이 있다.

---

### Decision 2. Neo4j AuraDB를 기본 데이터베이스로 사용한다

#### 이유

- 도메인의 핵심이 Entity 간 관계와 경로 탐색이다.
- 관계 속성과 방향을 직접 모델링할 수 있다.
- Cypher로 N단계 관계와 최단 경로를 표현할 수 있다.
- Full-text 및 Vector Index를 동일 그래프 데이터와 연결할 수 있다.

#### 대안

- PostgreSQL + adjacency list + recursive CTE
- Supabase + pgvector
- Firestore

#### Trade-off

**장점**

- 지식 그래프와 도메인 모델의 표현이 자연스럽다.
- 관계 중심 기능을 단순한 쿼리로 구현할 수 있다.
- Vector Search 결과를 즉시 그래프 탐색으로 확장할 수 있다.

**단점**

- 관계형 DB 학습은 본 프로젝트의 범위에서 제외된다.
- 범용 CRUD 서비스보다 그래프 도메인에 특화된다.
- 운영 도구와 호스팅 선택지가 PostgreSQL보다 제한될 수 있다.

---

### Decision 3. GraphQL Yoga를 Next.js Route Handler에 구성한다

#### 이유

- GraphQL Schema와 Resolver를 직접 설계할 수 있다.
- Next.js App Router와 결합하기 쉽다.
- 핵심 Query에 직접 Cypher를 연결할 수 있다.
- 자동 생성 GraphQL API에 의존하지 않고 GraphQL 실행 구조를 학습할 수 있다.

#### 대안

- Apollo Server
- Neo4j GraphQL Library만 사용
- REST Route Handler

#### Trade-off

**장점**

- Schema, Resolver, Context, Error Handling을 직접 구성할 수 있다.
- React 클라이언트에서 단일 API 계약을 사용할 수 있다.
- 도메인 단위 Query 설계가 가능하다.

**단점**

- CRUD, pagination, validation을 직접 구현해야 한다.
- Query complexity 및 depth 제한을 별도로 추가해야 한다.

---

### Decision 4. Neo4j GraphQL Library는 선택적으로 사용한다

#### 기본 방침

MVP 핵심 Query는 직접 Resolver와 Cypher로 작성한다.

Neo4j GraphQL Library는 반복적인 CRUD 또는 관계 매핑이 실제로 필요해질 때 도입한다.

#### 이유

- 본 프로젝트의 학습 목표는 GraphQL Resolver와 Cypher의 경계를 직접 경험하는 것이다.
- 자동 생성 Schema에 의존하면 도메인 API가 DB 구조에 지나치게 결합될 수 있다.
- MVP에는 관리자 CRUD가 없으므로 자동 생성 Mutation의 필요성이 낮다.

---

### Decision 5. React Flow는 그래프 렌더링 엔진으로만 사용한다

#### 책임

- 노드와 Edge 렌더링
- 선택, 드래그, 줌, 패닝
- 노드 확장 이벤트
- 관계 및 Entity 유형 필터
- 선택 경로 강조
- 레이아웃 결과 반영

#### 비책임

- Neo4j Query 실행
- 도메인 관계 추론
- 검색 랭킹
- 권한 검증
- 데이터 영속화

---

### Decision 6. Neo4j Driver는 서버 전용 singleton으로 재사용한다

#### 원칙

- Driver는 모듈 범위에서 재사용한다.
- Session은 요청 또는 Resolver 실행 단위로 생성하고 종료한다.
- Transaction Function을 사용한다.
- Client Component에서 Neo4j 모듈을 import하지 않는다.
- 서버 모듈에는 `server-only`를 적용한다.

---

### Decision 7. 인증과 데이터 편집은 MVP에서 제외한다

#### 처리

- 모든 GraphQL Query는 공개 읽기 전용이다.
- GraphQL Mutation은 MVP에서 제공하지 않는다.
- 데이터 변경은 로컬 또는 CI seed script로 수행한다.
- Neo4j 계정은 최소 권한 원칙에 따라 가능하면 읽기용과 seed용을 분리한다.

#### 향후

- 사용자 인증
- 관리자 Role
- 쓰기 Mutation
- 검수 워크플로
- 감사 로그

---

### Decision 8. 의미 검색은 Vector Search와 구조 탐색을 분리한 뒤 결합한다

#### 흐름

1. 검색어 임베딩 생성
2. Vector Index에서 후보 Entity 또는 Chunk 조회
3. 유형 및 점수 필터 적용
4. 선택 결과의 그래프 관계를 별도 Query로 조회
5. Post-MVP에서 두 단계를 하나의 Hybrid Query로 통합

#### 이유

MVP에서 검색과 그래프 탐색을 분리하면 구현과 디버깅이 단순하다.

---

## 4. Runtime Boundaries

### 4-1. Client Component

다음 기능은 Client Component에서 수행한다.

- React Flow 렌더링
- 그래프 로컬 상태
- 노드 선택
- 노드 확장 요청
- 필터 상태
- 검색 입력
- Apollo Client Query 실행
- 패널 열기 및 닫기

```text
Client Component
├─ UI interaction
├─ Apollo cache
├─ React Flow nodes/edges
└─ view state
```

Client에는 다음 정보가 존재하지 않아야 한다.

- NEO4J_URI
- NEO4J_USERNAME
- NEO4J_PASSWORD
- Neo4j Driver
- Cypher Query 원문
- 임베딩 API Secret

---

### 4-2. Server Component

다음 기능에 선택적으로 사용한다.

- 페이지 최초 데이터 조회
- Metadata 생성
- 추천 Entity 초기 렌더링
- URL 파라미터 기반 초기 Entity 확인

React Flow 자체는 Client Component로 분리한다.

---

### 4-3. Route Handler

`/api/graphql`은 Node.js Runtime을 사용한다.

```ts
export const runtime = "nodejs";
```

책임:

- GraphQL 요청 처리
- Context 생성
- 입력 검증
- Resolver 실행
- 에러 매핑
- Neo4j Session 관리
- Embedding Provider 호출

---

## 5. Suggested Project Structure

```text
src/
├─ app/
│  ├─ api/
│  │  └─ graphql/
│  │     └─ route.ts
│  ├─ explore/
│  │  └─ page.tsx
│  ├─ entity/
│  │  └─ [id]/
│  │     └─ page.tsx
│  ├─ myth/
│  │  └─ [id]/
│  │     └─ page.tsx
│  ├─ path/
│  │  └─ page.tsx
│  └─ search/
│     └─ page.tsx
│
├─ components/
│  ├─ graph/
│  │  ├─ MythGraph.tsx
│  │  ├─ GraphCanvas.tsx
│  │  ├─ EntityNode.tsx
│  │  ├─ RelationEdge.tsx
│  │  ├─ GraphToolbar.tsx
│  │  └─ GraphLegend.tsx
│  ├─ entity/
│  │  ├─ EntitySearch.tsx
│  │  ├─ EntityResultItem.tsx
│  │  └─ EntityDetailPanel.tsx
│  ├─ myth/
│  │  └─ MythDetailPanel.tsx
│  └─ search/
│     └─ SemanticSearch.tsx
│
├─ graphql/
│  ├─ schema/
│  │  ├─ index.ts
│  │  ├─ entity.graphql
│  │  ├─ graph.graphql
│  │  ├─ myth.graphql
│  │  ├─ path.graphql
│  │  └─ search.graphql
│  ├─ resolvers/
│  │  ├─ entity.resolver.ts
│  │  ├─ graph.resolver.ts
│  │  ├─ myth.resolver.ts
│  │  ├─ path.resolver.ts
│  │  └─ search.resolver.ts
│  ├─ context.ts
│  └─ errors.ts
│
├─ server/
│  ├─ neo4j/
│  │  ├─ driver.ts
│  │  ├─ session.ts
│  │  ├─ repositories/
│  │  │  ├─ entity.repository.ts
│  │  │  ├─ graph.repository.ts
│  │  │  ├─ myth.repository.ts
│  │  │  ├─ path.repository.ts
│  │  │  └─ search.repository.ts
│  │  └─ mappers/
│  │     ├─ entity.mapper.ts
│  │     ├─ graph.mapper.ts
│  │     └─ path.mapper.ts
│  ├─ embeddings/
│  │  ├─ client.ts
│  │  └─ service.ts
│  └─ validation/
│     └─ graph-limits.ts
│
├─ features/
│  ├─ graph-explorer/
│  ├─ entity-search/
│  ├─ semantic-search/
│  └─ path-finder/
│
├─ generated/
│  └─ graphql.ts
│
├─ lib/
│  ├─ apollo-client.ts
│  └─ graph-layout.ts
│
└─ types/
   ├─ graph.ts
   └─ entity.ts

scripts/
├─ seed.ts
├─ reset-db.ts
├─ create-indexes.ts
├─ generate-embeddings.ts
└─ validate-seed.ts

data/
├─ entities.json
├─ relationships.json
├─ myths.json
├─ events.json
└─ sources.json
```

---

## 6. Graph Data Model

### 6-1. Node Labels

#### `Entity`

모든 탐색 가능한 대상을 나타내는 공통 라벨이다.

공통 속성:

```text
id
slug
name
displayName
summary
description
aliases
greekName
romanName
createdAt
updatedAt
```

Entity는 다음 보조 라벨을 가질 수 있다.

```text
:Entity:Deity
:Entity:Human
:Entity:Creature
:Entity:Place
:Entity:Artifact
:Entity:Concept
```

#### `Myth`

```text
id
slug
title
summary
description
period
embedding
```

#### `Event`

```text
id
slug
name
summary
sequence
embedding
```

#### `Source`

```text
id
title
author
sourceType
publicationYear
referenceUrl
```

#### `KnowledgeChunk`

```text
id
content
chunkType
embedding
metadata
```

KnowledgeChunk는 의미 검색 정확도를 높이기 위한 선택적 노드다.

---

### 6-2. Relationship Model

예시:

```text
(:Entity)-[:PARENT_OF]->(:Entity)
(:Entity)-[:SIBLING_OF]->(:Entity)
(:Entity)-[:HELPED]->(:Entity)
(:Entity)-[:KILLED]->(:Entity)
(:Entity)-[:PARTICIPATED_IN]->(:Event)
(:Entity)-[:APPEARS_IN]->(:Myth)
(:Event)-[:PART_OF]->(:Myth)
(:Event)-[:OCCURRED_AT]->(:Entity:Place)
(:Myth)-[:RECORDED_IN]->(:Source)
(:KnowledgeChunk)-[:DESCRIBES]->(:Entity)
(:KnowledgeChunk)-[:DESCRIBES]->(:Myth)
```

관계 공통 속성:

```text
id
summary
confidence
disputed
sourceNote
createdAt
```

참여 관계 속성 예시:

```text
role
side
importance
```

---

### 6-3. Source와 Claim

MVP 기본안:

- 관계에 `sourceIds` 배열을 저장하지 않는다.
- 관계에서 Source로 직접 연결하거나, 관계 속성에 최소 출처 정보를 둔다.
- 관계 자체를 별도 Claim 노드로 승격하는 구조는 Post-MVP로 둔다.

확장안:

```text
(:Claim)-[:SUBJECT]->(:Entity)
(:Claim)-[:OBJECT]->(:Entity)
(:Claim)-[:PREDICATE]->(:RelationType)
(:Claim)-[:SUPPORTED_BY]->(:Source)
```

문헌 충돌이 주요 기능이 되는 시점에 Claim 모델을 도입한다.

---

## 7. Constraints and Indexes

### 7-1. Constraints

```cypher
CREATE CONSTRAINT entity_id_unique IF NOT EXISTS
FOR (e:Entity)
REQUIRE e.id IS UNIQUE;

CREATE CONSTRAINT entity_slug_unique IF NOT EXISTS
FOR (e:Entity)
REQUIRE e.slug IS UNIQUE;

CREATE CONSTRAINT myth_id_unique IF NOT EXISTS
FOR (m:Myth)
REQUIRE m.id IS UNIQUE;

CREATE CONSTRAINT event_id_unique IF NOT EXISTS
FOR (e:Event)
REQUIRE e.id IS UNIQUE;

CREATE CONSTRAINT source_id_unique IF NOT EXISTS
FOR (s:Source)
REQUIRE s.id IS UNIQUE;
```

### 7-2. Search Indexes

- Entity name 및 aliases Full-text Index
- Myth title 및 summary Full-text Index
- KnowledgeChunk embedding Vector Index
- 필요 시 Entity 또는 Myth embedding Vector Index

### 7-3. Index 선택 원칙

- exact lookup: unique constraint
- 이름 검색: full-text index
- 의미 검색: vector index
- 관계 탐색: Neo4j relationship traversal
- 속성 조건이 자주 사용될 경우 별도 property index 검토

---

## 8. GraphQL Schema Boundary

### 8-1. 핵심 타입

```graphql
enum EntityType {
  DEITY
  HUMAN
  CREATURE
  PLACE
  ARTIFACT
  CONCEPT
}

type Entity {
  id: ID!
  slug: String!
  name: String!
  displayName: String!
  type: EntityType!
  summary: String!
  description: String
  aliases: [String!]!
  greekName: String
  romanName: String
  relatedMyths(limit: Int = 10): [Myth!]!
}

type Myth {
  id: ID!
  slug: String!
  title: String!
  summary: String!
  description: String
  entities(limit: Int = 30): [Entity!]!
}

type GraphNode {
  id: ID!
  label: String!
  entityType: EntityType
  nodeType: String!
  summary: String
}

type GraphEdge {
  id: ID!
  source: ID!
  target: ID!
  relationType: String!
  label: String!
  directed: Boolean!
  properties: JSON
}

type KnowledgeGraph {
  nodes: [GraphNode!]!
  edges: [GraphEdge!]!
  truncated: Boolean!
}

type PathResult {
  found: Boolean!
  graph: KnowledgeGraph
  length: Int
}

type SemanticSearchResult {
  id: ID!
  resultType: String!
  title: String!
  summary: String!
  score: Float!
}

scalar JSON
```

### 8-2. 핵심 Query

```graphql
type Query {
  searchEntities(
    keyword: String!
    types: [EntityType!]
    limit: Int = 20
  ): [Entity!]!

  entity(id: ID, slug: String): Entity

  graphAroundEntity(
    entityId: ID!
    depth: Int = 1
    relationTypes: [String!]
    entityTypes: [EntityType!]
    maxNodes: Int = 100
  ): KnowledgeGraph!

  myth(id: ID, slug: String): Myth

  graphAroundMyth(
    mythId: ID!
    maxNodes: Int = 100
  ): KnowledgeGraph!

  shortestPath(
    sourceId: ID!
    targetId: ID!
    maxDepth: Int = 6
  ): PathResult!

  semanticSearch(
    query: String!
    resultTypes: [String!]
    limit: Int = 10
    minScore: Float = 0.6
  ): [SemanticSearchResult!]!
}
```

### 8-3. Mutation

MVP에서는 제공하지 않는다.

```graphql
type Mutation {
  _empty: Boolean
}
```

실제 Schema에서는 Mutation 자체를 생략할 수 있다.

---

## 9. Resolver Architecture

```text
GraphQL Resolver
    │
    ├─ Input validation
    ├─ Limit normalization
    ├─ Repository call
    ├─ Domain error mapping
    └─ DTO return
          │
          ▼
Neo4j Repository
    │
    ├─ Cypher query
    ├─ Parameter binding
    ├─ Session / transaction
    └─ Neo4j record return
          │
          ▼
Mapper
    │
    ├─ Neo4j Integer normalization
    ├─ Node property mapping
    ├─ Relationship mapping
    └─ duplicate removal
```

### Resolver가 하지 않는 일

- React Flow 좌표 계산
- Neo4j Record를 그대로 반환
- 문자열 연결로 Cypher 생성
- 사용자 입력을 관계 유형이나 Label에 직접 삽입
- 무제한 depth 허용

---

## 10. Cypher Query Principles

### 10-1. Parameter Binding

사용자 입력은 항상 파라미터로 전달한다.

```cypher
MATCH (e:Entity {id: $entityId})
RETURN e
```

금지:

```text
"MATCH (e:Entity {id: '" + entityId + "'}) RETURN e"
```

### 10-2. Dynamic Relationship Type

관계 유형 필터는 허용 목록으로 검증한다.

가능하면 관계 전체를 조회한 뒤 `type(r) IN $relationTypes` 형태를 사용한다.

```cypher
MATCH (root:Entity {id: $entityId})-[r]-(neighbor)
WHERE size($relationTypes) = 0 OR type(r) IN $relationTypes
RETURN root, r, neighbor
LIMIT $limit
```

### 10-3. Depth Limit

가변 길이 경로는 서버 상수 범위 내에서만 허용한다.

```text
MIN_DEPTH = 1
MAX_GRAPH_DEPTH = 3
MAX_PATH_DEPTH = 8
```

Cypher 문법상 depth를 파라미터화하기 어려운 경우, 검증된 숫자만 Query Builder가 삽입한다.

### 10-4. Result Limit

모든 그래프 Query는 다음을 제한한다.

- maxNodes
- maxEdges
- maxDepth
- result rows
- timeout 또는 서버 함수 실행 시간

### 10-5. Read Transaction

읽기 Query는 `session.executeRead`를 사용한다.

Seed 및 Index 생성은 별도 script에서 `executeWrite`를 사용한다.

---

## 11. Graph DTO

서버는 React Flow 형식이 아니라 도메인 중립적인 Graph DTO를 반환한다.

```ts
export type KnowledgeGraphDTO = {
  nodes: Array<{
    id: string;
    label: string;
    nodeType: "ENTITY" | "MYTH" | "EVENT" | "SOURCE";
    entityType?: EntityType;
    summary?: string;
    properties?: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    relationType: string;
    label: string;
    directed: boolean;
    properties?: Record<string, unknown>;
  }>;
  truncated: boolean;
};
```

클라이언트에서 React Flow 형식으로 변환한다.

```text
KnowledgeGraphDTO
    ↓
toReactFlowNodes()
toReactFlowEdges()
    ↓
React Flow
```

### 이유

- API가 특정 UI 라이브러리에 종속되지 않는다.
- 향후 다른 시각화 도구로 교체할 수 있다.
- GraphQL 테스트에서 좌표와 렌더링 상태를 제외할 수 있다.

---

## 12. Client State Architecture

### 12-1. Server State

Apollo Client가 관리한다.

- Entity 검색 결과
- Entity 상세
- 그래프 조회 결과
- Myth 상세
- 최단 경로
- 의미 검색 결과

### 12-2. UI State

React local state 또는 feature store가 관리한다.

- selectedNodeId
- hoveredNodeId
- relationFilters
- entityTypeFilters
- panel state
- viewport
- layout direction
- expandedNodeIds
- path mode

### 12-3. Graph Merge

노드 확장 시 기존 그래프와 새 그래프를 병합한다.

원칙:

```text
node key = node.id
edge key = edge.id
```

Edge ID가 DB에 없을 경우 다음 조합으로 안정적으로 생성한다.

```text
sourceId + relationType + targetId + relationIdentity
```

병합 후 레이아웃은 새로 추가된 노드를 중심으로 부분 계산하는 방식을 우선 검토한다.

---

## 13. React Flow Architecture

### 13-1. Node Types

- DeityNode
- HumanNode
- CreatureNode
- PlaceNode
- ArtifactNode
- MythNode
- EventNode

MVP에서는 시각적 변형이 크지 않다면 `EntityNode` 하나에 type variant를 적용할 수 있다.

### 13-2. Edge Types

- DirectedRelationEdge
- UndirectedRelationEdge
- HighlightedPathEdge

### 13-3. Layout

초기 후보:

- Dagre
- ELK
- D3 force layout

선택 기준:

- 방향성 관계 가독성
- 점진적 노드 추가 대응
- 가계도 형태 지원
- 100개 이하 노드 성능
- 클라이언트 번들 크기

MVP에서는 Dagre 또는 ELK 기반 고정 레이아웃을 우선 검토한다.

### 13-4. Rendering Limits

- 기본 노드 최대 100개
- 기본 Edge 최대 200개
- depth 기본 1
- depth 최대 3
- 경로 탐색 최대 depth 6, 서버 상한 8

상한 초과 시 `truncated: true`를 반환하고 UI에 안내한다.

---

## 14. Search Architecture

### 14-1. Lexical Search

용도:

- Entity 이름
- 별칭
- 그리스명
- 로마명
- Myth 제목

처리:

```text
GraphQL searchEntities
    ↓
Neo4j Full-text Index
    ↓
score + Entity
```

### 14-2. Semantic Search

```text
User query
    ↓
GraphQL semanticSearch
    ↓
EmbeddingService.embed(query)
    ↓
Neo4j Vector Index
    ↓
candidate nodes/chunks
    ↓
minScore / type filter
    ↓
SemanticSearchResult
```

### 14-3. Embedding Storage

권장 기본안:

```text
(:KnowledgeChunk {
  id,
  content,
  chunkType,
  embedding
})-[:DESCRIBES]->(:Entity|Myth)
```

이유:

- 긴 Entity 설명을 여러 의미 단위로 분리할 수 있다.
- 검색 결과에서 어떤 문장이 매칭되었는지 설명할 수 있다.
- Entity 자체에 여러 embedding을 넣는 문제를 피할 수 있다.

### 14-4. Embedding Generation

Seed 단계:

1. Source data 정규화
2. Chunk 생성
3. Embedding 생성
4. KnowledgeChunk 저장
5. DESCRIBES 관계 생성
6. Vector Index 조회 검증

Runtime:

- 사용자 검색어만 임베딩 생성
- 결과 데이터 임베딩은 미리 생성

---

## 15. Neo4j Connection Management

### 15-1. Driver

```ts
import "server-only";
import neo4j, { type Driver } from "neo4j-driver";

let driver: Driver | undefined;

export function getNeo4jDriver(): Driver {
  if (driver) return driver;

  const uri = process.env.NEO4J_URI;
  const username = process.env.NEO4J_USERNAME;
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !username || !password) {
    throw new Error("Neo4j configuration is missing.");
  }

  driver = neo4j.driver(
    uri,
    neo4j.auth.basic(username, password)
  );

  return driver;
}
```

### 15-2. Session

```ts
const session = getNeo4jDriver().session({
  database: process.env.NEO4J_DATABASE ?? "neo4j",
});

try {
  return await session.executeRead((tx) =>
    tx.run(cypher, params)
  );
} finally {
  await session.close();
}
```

### 15-3. Environment Variables

```env
NEO4J_URI=
NEO4J_USERNAME=
NEO4J_PASSWORD=
NEO4J_DATABASE=neo4j

EMBEDDING_API_KEY=
EMBEDDING_MODEL=
EMBEDDING_DIMENSION=
```

금지:

```env
NEXT_PUBLIC_NEO4J_URI=
NEXT_PUBLIC_NEO4J_PASSWORD=
```

---

## 16. GraphQL Safety

MVP가 공개 API이므로 인증이 없어도 방어가 필요하다.

### 적용 항목

- Query depth 제한
- Alias 수 제한
- maxNodes 상한
- maxDepth 상한
- keyword 길이 제한
- semantic search query 길이 제한
- limit 상한
- Introspection 운영 정책 검토
- 에러 메시지에서 내부 Query와 자격 증명 제거
- 기본 Rate Limit 검토
- Vercel 로그에 민감정보 미출력

### 입력 상한 예시

| 입력 | 기본 | 최대 |
| --- | ---: | ---: |
| 검색 결과 limit | 20 | 50 |
| 의미 검색 limit | 10 | 30 |
| graph depth | 1 | 3 |
| path maxDepth | 6 | 8 |
| graph maxNodes | 100 | 150 |
| 검색어 길이 | - | 200자 |
| 의미 검색 문장 | - | 1,000자 |

---

## 17. Error Model

GraphQL Error `extensions.code`를 사용한다.

| 코드 | 의미 |
| --- | --- |
| ENTITY_NOT_FOUND | Entity를 찾을 수 없음 |
| MYTH_NOT_FOUND | Myth를 찾을 수 없음 |
| PATH_NOT_FOUND | 제한 범위 내 경로 없음 |
| INVALID_GRAPH_DEPTH | 허용하지 않는 depth |
| GRAPH_LIMIT_EXCEEDED | 그래프 결과 제한 초과 |
| INVALID_RELATION_TYPE | 허용되지 않는 관계 유형 |
| SEARCH_QUERY_TOO_LONG | 검색어 길이 초과 |
| EMBEDDING_FAILED | 임베딩 생성 실패 |
| DATABASE_UNAVAILABLE | Neo4j 연결 실패 |
| INTERNAL_SERVER_ERROR | 예상하지 못한 오류 |

클라이언트는 DB 에러 원문을 사용자에게 노출하지 않는다.

---

## 18. Seed Pipeline

### 18-1. 입력 파일

```text
data/entities.json
data/myths.json
data/events.json
data/sources.json
data/relationships.json
```

### 18-2. 실행 순서

```text
validate source files
    ↓
create constraints/indexes
    ↓
upsert Source
    ↓
upsert Entity
    ↓
upsert Myth/Event
    ↓
upsert Relationships
    ↓
generate Knowledge Chunks
    ↓
generate embeddings
    ↓
create Vector Index
    ↓
run validation queries
```

### 18-3. Idempotency

Seed script는 반복 실행 가능해야 한다.

```cypher
MERGE (e:Entity {id: $id})
SET e += $properties
```

Relationship도 안정적인 ID 또는 고유 키를 사용해 중복 생성을 방지한다.

### 18-4. Validation

- 중복 ID
- 중복 slug
- 존재하지 않는 source/target 참조
- 허용되지 않는 관계 유형
- 자기 관계 허용 여부
- 역관계 중복
- Source 누락
- embedding dimension 불일치

---

## 19. Data Flow

### 19-1. Entity 검색

```text
Search input
    ↓
Apollo query
    ↓
searchEntities resolver
    ↓
EntityRepository.search
    ↓
Neo4j full-text search
    ↓
Entity DTO
    ↓
Search result UI
```

### 19-2. 그래프 확장

```text
Node click
    ↓
graphAroundEntity(entityId, depth: 1)
    ↓
GraphRepository.findNeighborhood
    ↓
Cypher traversal
    ↓
KnowledgeGraphDTO
    ↓
mergeGraph()
    ↓
React Flow render
```

### 19-3. 최단 경로

```text
Source + Target submit
    ↓
shortestPath resolver
    ↓
PathRepository.findShortestPath
    ↓
bounded path query
    ↓
Path mapper
    ↓
highlighted React Flow graph
```

### 19-4. 의미 검색

```text
Natural language query
    ↓
semanticSearch resolver
    ↓
Embedding Provider
    ↓
Neo4j vector query
    ↓
result mapper
    ↓
Semantic result UI
    ↓
Entity graph navigation
```

---

## 20. Caching Strategy

### MVP

- Apollo Client cache 사용
- Entity 및 Myth 상세은 ID 기반 캐시
- 그래프 확장 결과는 Query 변수 기준 캐시
- 서버 전역 캐시는 필수 아님

### 검토 대상

- 자주 조회되는 Entity 1단계 그래프
- 검색 추천 결과
- 임베딩 검색어 결과
- Vercel Data Cache 사용 가능성

주의:

그래프 병합 상태는 Apollo cache와 React Flow UI state를 혼합하지 않고 feature 계층에서 명시적으로 관리한다.

---

## 21. Performance

### 서버

- Driver 재사용
- Session 즉시 종료
- 필요한 속성만 반환
- `RETURN path` 전체를 무제한 반환하지 않음
- 결과 상한 적용
- Full-text 및 Vector Index 사용
- 복잡한 Query는 `PROFILE`로 검토

### 클라이언트

- React Flow 노드 최대치 제한
- 노드 컴포넌트 memoization
- 변경된 노드만 업데이트
- 상세 패널 lazy rendering 검토
- 레이아웃 계산 비용 모니터링
- 그래프 전체 초기화 지양

### 목표

| 작업 | 목표 |
| --- | --- |
| Entity 검색 | 1초 이내 |
| 초기 그래프 | 2초 이내 |
| 노드 확장 | 1.5초 이내 |
| 최단 경로 | 2초 이내 |
| 의미 검색 | 3초 이내 |

---

## 22. Observability

### 기록 대상

- GraphQL operation name
- Resolver duration
- Neo4j query duration
- result node/edge count
- truncation 여부
- embedding duration
- error code

### 기록 금지

- Neo4j password
- Embedding API key
- 전체 사용자 검색문 장기 저장
- Source 원문 전체
- 임베딩 벡터 전체
- 내부 Stack trace의 사용자 노출

MVP에서는 Vercel Logs를 활용하고, 필요 시 구조화 로깅 도구를 추가한다.

---

## 23. Testing Strategy

### Unit Test

- Neo4j Node → Entity DTO mapper
- Relationship → GraphEdge mapper
- Graph merge 및 중복 제거
- depth/limit validation
- relation type allowlist
- error mapping
- chunk 생성기

### Integration Test

- GraphQL Schema 실행
- Resolver → Repository 계약
- 테스트 Neo4j 또는 격리된 데이터셋 조회
- Entity 검색
- 1단계 그래프
- 최단 경로
- Vector Search

### E2E Test

- 검색 → Entity 선택 → 그래프 표시
- 노드 확장 → 새 노드 병합
- 관계 필터 변경
- 두 Entity 선택 → 경로 강조
- 의미 검색 → 결과 선택 → 그래프 이동

### Seed Test

- 반복 실행 시 중복 없음
- 모든 관계의 source/target 존재
- 모든 임베딩 차원 일치
- 최소 데이터 수 충족
- 핵심 예시 Query 결과 확인

---

## 24. Deployment Architecture

```text
Git repository
    ↓
Vercel build
    ↓
Next.js application
    ├─ Static/Server rendered pages
    └─ Node.js GraphQL Function
             ↓
        Neo4j AuraDB
             ↓
        Vector / Full-text Index
```

### Vercel 환경

- Production
- Preview
- Development

가능하면 환경별 Neo4j Database 또는 최소한 별도 데이터셋을 사용한다.

### 배포 체크

- 환경변수 등록
- Node.js Runtime 확인
- GraphQL endpoint smoke test
- Neo4j connectivity test
- Seed version 확인
- Vector index online 상태 확인
- 브라우저 source map 또는 bundle에 secret 미포함 확인

---

## 25. Security

### 필수

- Neo4j 자격 증명은 서버 환경변수로만 저장
- 모든 Cypher 파라미터 바인딩
- 동적 label 및 relationship type allowlist
- GraphQL Query 제한
- 공개 API 요청 상한
- 내부 오류 비노출
- 읽기 전용 Query만 공개

### 권장

- 읽기 전용 Neo4j 사용자
- seed 전용 쓰기 사용자
- Preview 환경과 Production 환경 분리
- Rate Limiting
- Content Security Policy
- 의존성 취약점 점검

---

## 26. Rollout Plan

### Phase 1. Foundation

- Next.js 프로젝트
- GraphQL Yoga endpoint
- Neo4j Driver
- Constraints 및 seed
- Entity 검색

### Phase 2. Graph Explorer

- Entity 중심 Graph Query
- Graph DTO
- React Flow
- 노드 확장
- 필터

### Phase 3. Content

- Entity 상세
- Myth/Event 모델
- Source 표시

### Phase 4. Path

- 최단 경로
- 경로 강조
- limit 및 error handling

### Phase 5. Vector Search

- Knowledge Chunk
- embedding pipeline
- vector index
- semanticSearch Query

### Phase 6. Stabilization

- 테스트
- 성능 측정
- 그래프 상한 조정
- Vercel 배포
- 문서 정리

---

## 27. Architecture Risks

| 리스크 | 완화 |
| --- | --- |
| Vercel 함수에서 Neo4j 연결이 과도하게 생성됨 | Driver 모듈 재사용, Session 요청 단위 종료 |
| 그래프 순회 비용 급증 | depth, nodes, edges, limit 제한 |
| GraphQL 복잡도 공격 | depth/complexity/alias 제한, rate limit |
| React Flow 렌더 성능 저하 | 점진적 확장, 노드 상한, memoization |
| 데이터 모델이 관계 유형 증가로 불안정 | 관계 사전과 validation script |
| 상충 문헌 표현이 어려움 | Source 속성, 향후 Claim 노드 도입 |
| Vector Search 품질 저하 | Chunk 전략, score threshold, 테스트 쿼리셋 |
| 임베딩 공급자 변경 | EmbeddingService interface 분리 |
| 자동 GraphQL 도입으로 도메인 경계 약화 | 핵심 Query 직접 Resolver 유지 |

---

## 28. Open Decisions

- GraphQL Yoga 단독 사용 여부와 Neo4j GraphQL Library의 도입 시점
- GraphQL Code Generator 산출물 범위
- Apollo Client와 Server Component 데이터 요청의 역할 분리
- React Flow 레이아웃 엔진
- Entity 공통 라벨과 보조 라벨 전략
- KnowledgeChunk 도입 시점
- 임베딩 모델과 차원
- 읽기 전용 Neo4j 계정 구성
- Source와 Claim 모델의 MVP 포함 여부
- Preview 배포용 DB 분리 여부

---

## 부록 A. Architecture Checklist

- [ ] Neo4j Driver가 `server-only` 모듈에 있다.
- [ ] `/api/graphql`이 Node.js Runtime으로 실행된다.
- [ ] Client bundle에 Neo4j 모듈과 환경변수가 포함되지 않는다.
- [ ] Driver는 재사용되고 Session은 항상 종료된다.
- [ ] 모든 Cypher가 파라미터 바인딩을 사용한다.
- [ ] graph depth와 result limit이 서버에서 강제된다.
- [ ] GraphQL 내부 오류가 사용자에게 노출되지 않는다.
- [ ] Graph DTO와 React Flow 타입이 분리되어 있다.
- [ ] Seed script가 반복 실행 가능하다.
- [ ] Full-text Index와 Vector Index가 검증된다.
- [ ] 검색, 그래프, 경로, 의미 검색 테스트가 존재한다.
- [ ] Vercel Production 환경변수가 설정되어 있다.
