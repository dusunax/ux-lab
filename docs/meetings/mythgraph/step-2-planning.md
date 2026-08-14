# Step 2 진행 계획서

**기간:** 2026-08-07 ~ 2026-08-08 (2일)  
**목표:** GraphQL Schema 설계 + Neo4j Driver 구현 + Seed 데이터 수집 시작  
**총 소요시간:** 10-12시간 (병렬 작업)

---

## 📋 Step 2 액션 아이템 (우선순위별)

### Phase 1: GraphQL Schema 설계 (Blake, 4시간)

| # | 액션 | 담당 | 예상 | 체크 | 산출물 |
|----|------|------|------|------|--------|
| 1 | **GraphQL Schema 1차 설계** (Entity, Myth, Event 타입) | Blake | 2시간 | [ ] | schema.graphql (초안) |
| 2 | **Neo4j Driver 초기화** (Connection pooling 설정) | Blake | 1.5시간 | [ ] | src/server/neo4j.ts |
| 3 | **Cypher 초기화 스크립트 작성** (Index, Constraints) | Blake | 0.5시간 | [ ] | scripts/init.cypher |

### Phase 2: Seed 데이터 수집 (Jordan, 4시간)

| # | 액션 | 담당 | 예상 | 체크 | 산출물 |
|----|------|------|------|------|--------|
| 4 | **기준 문헌 최종 선정** (Homer, Ovid, Diodorus 등) | Jordan | 1시간 | [ ] | 문헌 목록 |
| 5 | **Entity 50-80개 설계** (Deity, Human, Monster, Place) | Jordan | 1.5시간 | [ ] | entities.json |
| 6 | **Myth 10-15개 설계** (Trojan War, Heracles Labors 등) | Jordan | 1시간 | [ ] | myths.json |
| 7 | **Event 15-25개 설계** (시간순 정렬, 참여자 명시) | Jordan | 0.5시간 | [ ] | events.json |

### Phase 3: 통합 & 검증 (2시간, 병렬)

| # | 액션 | 담당 | 예상 | 체크 | 산출물 |
|----|------|------|------|------|--------|
| 8 | **Neo4j Driver 테스트** (로컬 + 클라우드 연결) | Blake | 1시간 | [ ] | 연결 검증 완료 |
| 9 | **Seed 데이터 CSV 변환** (Cypher 로드용) | Jordan/Blake | 1시간 | [ ] | seed-data.csv |

---

## 🎯 각 액션 상세 가이드

### 1️⃣ GraphQL Schema 1차 설계 (Blake, 2시간)

**파일:** `src/server/graphql/schema.graphql`

**포함할 타입:**

```graphql
# Entity 기본 인터페이스
interface Entity {
  id: ID!
  name: String!
  slug: String!
  aliases: [String]!
  description: String!
  sourceIds: [String]!
  createdAt: DateTime
}

# 신 (Deity)
type Deity implements Entity {
  id: ID!
  name: String!
  slug: String!
  aliases: [String]!
  description: String!
  sourceIds: [String]!
  createdAt: DateTime
  
  # Deity 특화 필드
  domains: [String]!           # ["Thunder", "Sky", "Justice"]
  symbolism: String            # "Eagle, Thunderbolt"
  olympian: Boolean             # true/false
  
  # 관계
  children: [Entity]!           # HAS_CHILD 관계
  parents: [Entity]!            # IS_CHILD_OF 관계
  relatedMyths: [Myth]!         # CENTERS_ON 관계
  relatedEvents: [Event]!       # INVOLVES_ENTITY 관계
}

# 인물 (Human)
type Human implements Entity {
  id: ID!
  name: String!
  slug: String!
  aliases: [String]!
  description: String!
  sourceIds: [String]!
  createdAt: DateTime
  
  # Human 특화 필드
  mortality: Boolean!
  parentageIds: [String]!       # [:Deity]의 자식
  
  # 관계
  relatedMyths: [Myth]!
  relatedEvents: [Event]!
}

# 신화 (Myth)
type Myth {
  id: ID!
  name: String!
  slug: String!
  summary: String!
  period: String                # "Heroic Age"
  sourceIds: [String]!
  createdAt: DateTime
  
  # 관계
  events: [Event]!              # CONTAINS_EVENT
  primaryEntities: [Entity]!    # CENTERS_ON
  allEntities: [Entity]!        # 모든 참여 Entity
  sources: [Source]!
}

# 사건 (Event)
type Event {
  id: ID!
  name: String!
  slug: String!
  description: String!
  timestamp: Int                # 상대 연대
  sourceIds: [String]!
  createdAt: DateTime
  
  # 관계
  participants: [Entity]!       # INVOLVES_ENTITY
  parentMyth: Myth!             # CONTAINED_BY
  sources: [Source]!
}

# 출처 (Source)
type Source {
  id: ID!
  name: String!
  author: String
  year: Int
  type: String                  # "primary", "secondary"
}

# Query
type Query {
  # Entity 검색
  searchEntities(
    query: String!
    filters: EntityFilterInput
    limit: Int = 20
  ): [Entity]!
  
  getEntityById(id: ID!): Entity
  
  # Myth 검색
  searchMyths(
    query: String!
    limit: Int = 20
  ): [Myth]!
  
  getMythById(id: ID!): Myth
  
  # Event 조회
  getEventById(id: ID!): Event
  
  # 연쇄 검색
  getEntityRelatedMyths(entityId: ID!): [Myth]!
}

# Filter Input
input EntityFilterInput {
  types: [EntityType]
  domains: [String]
}

enum EntityType {
  DEITY
  HUMAN
  MONSTER
  PLACE
}

# DateTime Scalar (Apollo Server)
scalar DateTime
```

**체크리스트:**
- [ ] Entity 인터페이스 정의
- [ ] Deity, Human, Monster, Place 타입
- [ ] Myth, Event, Source 타입
- [ ] Query 루트 정의
- [ ] Input, Enum 타입

---

### 2️⃣ Neo4j Driver 초기화 (Blake, 1.5시간)

**파일:** `src/server/neo4j.ts`

```typescript
import neo4j from 'neo4j-driver'

const getDriver = () => {
  const uri = process.env.NEO4J_URI
  const username = process.env.NEO4J_USERNAME
  const password = process.env.NEO4J_PASSWORD
  
  if (!uri || !username || !password) {
    throw new Error('Neo4j 자격증명이 없습니다.')
  }
  
  return neo4j.driver(uri, neo4j.auth.basic(username, password), {
    maxConnectionPoolSize: 100,
    connectionAcquisitionTimeout: 10000,
    connectionLivenessCheckTimeout: 30000,
    maxTransactionRetryTime: 30000,
    logging: {
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
      logger: (level, message) => console.log(`[NEO4J ${level}] ${message}`),
    },
  })
}

let driver: neo4j.Driver | null = null

export const getOrCreateDriver = (): neo4j.Driver => {
  if (!driver) {
    driver = getDriver()
  }
  return driver
}

export const getSession = (accessMode: 'READ' | 'WRITE' = 'READ') => {
  const drv = getOrCreateDriver()
  return drv.session({
    defaultAccessMode: accessMode === 'READ' ? 'READ' : 'WRITE',
  })
}

export const closeDriver = async () => {
  if (driver) {
    await driver.close()
    driver = null
  }
}

// 연결 테스트
export const testConnection = async (): Promise<boolean> => {
  try {
    const session = getSession('READ')
    const result = await session.run('RETURN 1 as test')
    session.close()
    return result.records.length > 0
  } catch (err) {
    console.error('Neo4j 연결 실패:', err)
    return false
  }
}
```

**체크리스트:**
- [ ] Driver 싱글톤 구현
- [ ] getSession 헬퍼
- [ ] closeDriver 정리 함수
- [ ] testConnection 테스트 함수
- [ ] 환경변수 검증

---

### 3️⃣ Cypher 초기화 스크립트 (Blake, 0.5시간)

**파일:** `scripts/init.cypher`

```cypher
-- Full-text Index (검색용)
CREATE FULLTEXT INDEX entity_search 
  IF NOT EXISTS 
  FOR (e:Entity) ON EACH [e.name, e.aliases, e.description]

CREATE FULLTEXT INDEX myth_search 
  IF NOT EXISTS 
  FOR (m:Myth) ON EACH [m.name, m.summary]

-- Constraints (유니크성)
CREATE CONSTRAINT unique_entity_id 
  IF NOT EXISTS 
  FOR (e:Entity) REQUIRE e.id IS UNIQUE

CREATE CONSTRAINT unique_myth_id 
  IF NOT EXISTS 
  FOR (m:Myth) REQUIRE m.id IS UNIQUE

CREATE CONSTRAINT unique_event_id 
  IF NOT EXISTS 
  FOR (e:Event) REQUIRE e.id IS UNIQUE

CREATE CONSTRAINT unique_source_id 
  IF NOT EXISTS 
  FOR (s:Source) REQUIRE s.id IS UNIQUE

-- 라벨 인덱스 (쿼리 성능)
CREATE INDEX entity_labels 
  IF NOT EXISTS 
  FOR (e:Entity) ON (e:Deity, e:Human, e:Monster, e:Place)
```

**체크리스트:**
- [ ] Full-text Index 2개
- [ ] Constraint 4개
- [ ] Label Index 1개

---

### 4️⃣ 기준 문헌 선정 (Jordan, 1시간)

**최종 확정할 문헌:**

```json
{
  "primary_sources": [
    {
      "id": "src:homer-iliad",
      "author": "Homer",
      "title": "Iliad",
      "year": -8,
      "coverage": "Trojan War, Olympian Gods"
    },
    {
      "id": "src:homer-odyssey",
      "author": "Homer",
      "title": "Odyssey",
      "year": -8,
      "coverage": "Odysseus, Heroes"
    },
    {
      "id": "src:ovid-metamorphoses",
      "author": "Ovid",
      "title": "Metamorphoses",
      "year": 8,
      "coverage": "Entity transformations, Myths"
    },
    {
      "id": "src:hesiod-theogony",
      "author": "Hesiod",
      "title": "Theogony",
      "year": -700,
      "coverage": "Gods genealogy"
    },
    {
      "id": "src:diodorus-siculus",
      "author": "Diodorus Siculus",
      "title": "Library of History",
      "year": -50,
      "coverage": "Historical perspective"
    }
  ]
}
```

**체크리스트:**
- [ ] 기본 문헌 5개 선정
- [ ] 각 문헌별 커버리지 정의
- [ ] ID 포맷 통일 (src:author-title)

---

### 5️⃣ Entity 50-80개 설계 (Jordan, 1.5시간)

**구조:**

```json
{
  "entities": [
    {
      "id": "entity_zeus_001",
      "name": "Zeus",
      "slug": "zeus",
      "type": "DEITY",
      "aliases": ["Jupiter", "Dias"],
      "description": "King of gods, ruler of thunder and sky",
      "domains": ["Thunder", "Sky", "Justice"],
      "olympian": true,
      "sourceIds": ["src:homer-iliad", "src:hesiod-theogony"]
    },
    {
      "id": "entity_athena_001",
      "name": "Athena",
      "slug": "athena",
      "type": "DEITY",
      "aliases": ["Minerva"],
      "description": "Goddess of wisdom and warfare",
      "domains": ["Wisdom", "War", "Crafts"],
      "olympian": true,
      "sourceIds": ["src:homer-iliad"]
    },
    {
      "id": "entity_perseus_001",
      "name": "Perseus",
      "slug": "perseus",
      "type": "HUMAN",
      "aliases": [],
      "description": "Hero, son of Zeus, slayer of Medusa",
      "mortality": true,
      "parentageIds": ["entity_zeus_001"],
      "sourceIds": ["src:ovid-metamorphoses"]
    }
    // ... 50-80개 Entity
  ]
}
```

**분류:**
```
Deity (신): 25-30개
  ├─ Olympian: 12개
  ├─ Chthonic: 5개
  └─ Minor: 8-13개

Human (인물): 20-25개
  ├─ Heroes: 15개
  └─ Mortals: 5-10개

Monster (괴물): 5-8개
  ├─ Famous monsters: 5개
  └─ Others: 0-3개

Place (장소): 8-12개
  ├─ Olympus, Underworld
  └─ Earthly locations
```

**체크리스트:**
- [ ] Entity 50-80개 목록화
- [ ] 각 Entity별 필드 완성
- [ ] Source 참조 명시

---

### 6️⃣ Myth 10-15개 설계 (Jordan, 1시간)

**구조:**

```json
{
  "myths": [
    {
      "id": "myth_trojan-war_001",
      "name": "Trojan War",
      "slug": "trojan-war",
      "summary": "10-year conflict between Achaeans and Trojans over Helen",
      "period": "Heroic Age",
      "sourceIds": ["src:homer-iliad", "src:homer-odyssey"]
    },
    {
      "id": "myth_heracles-labors_001",
      "name": "Twelve Labors of Heracles",
      "slug": "heracles-labors",
      "summary": "Heracles completes 12 impossible tasks for redemption",
      "period": "Heroic Age",
      "sourceIds": ["src:diodorus-siculus"]
    }
    // ... 10-15개 Myth
  ]
}
```

**선정 기준:**
- 유명도 (널리 알려진 신화)
- 문헌 커버리지 (충분한 출처)
- 관계 다양성 (여러 Entity 포함)
- 이벤트 풍부성 (Event 15-25개 분산)

**필수 Myth:**
- Trojan War
- Heracles' 12 Labors
- Odyssey
- Perseus and Medusa
- Minotaur
- Jason and Argonauts
- Prometheus
- Pandora

**체크리스트:**
- [ ] Myth 10-15개 선정
- [ ] 각 Myth별 요약
- [ ] Source 참조

---

### 7️⃣ Event 15-25개 설계 (Jordan, 0.5시간)

**구조:**

```json
{
  "events": [
    {
      "id": "event_troy-begins_001",
      "name": "Trojan War Begins",
      "slug": "trojan-war-begins",
      "description": "Greek fleet sails to Troy to recover Helen",
      "timestamp": 0,
      "participants": ["entity_menelaus_001", "entity_agamemnon_001"],
      "mythIds": ["myth_trojan-war_001"],
      "sourceIds": ["src:homer-iliad:book-1"]
    },
    {
      "id": "event_trojan-horse_001",
      "name": "Trojan Horse",
      "slug": "trojan-horse",
      "description": "Greeks enter Troy through wooden horse deception",
      "timestamp": 10,
      "participants": ["entity_odysseus_001", "entity_troy_001"],
      "mythIds": ["myth_trojan-war_001"],
      "sourceIds": ["src:homer-odyssey"]
    }
    // ... 15-25개 Event
  ]
}
```

**시간순 정렬:**
- 각 Myth별 Event 2-3개
- timestamp: 상대 시간 (숫자)
- 참여자 명시 (Entity ID)

**체크리스트:**
- [ ] Event 15-25개 설계
- [ ] 시간순 정렬
- [ ] Myth 참조
- [ ] 참여자 명시

---

### 8️⃣ Neo4j Driver 테스트 (Blake, 1시간)

**테스트 절차:**

```bash
# 1. 로컬 Docker 연결 테스트
NEO4J_URI=neo4j://localhost:7687 \
NEO4J_USERNAME=neo4j \
NEO4J_PASSWORD=dev_password_123 \
npm run test:neo4j-local

# 2. 클라우드 Aura 연결 테스트
NEO4J_URI=neo4j+s://410efe52.databases.neo4j.io \
NEO4J_USERNAME=410efe52 \
NEO4J_PASSWORD=[password] \
npm run test:neo4j-cloud

# 3. Cypher 초기화 스크립트 실행
npm run neo4j:init-schema
```

**검증 체크리스트:**
- [ ] 로컬 Docker 연결 ✓
- [ ] 클라우드 Aura 연결 ✓
- [ ] Index 생성 ✓
- [ ] Constraint 생성 ✓

---

### 9️⃣ Seed 데이터 CSV 변환 (Jordan/Blake, 1시간)

**CSV 형식:**

```csv
# entities.csv
id,name,slug,type,aliases,description,domains,mortality,sourceIds
entity_zeus_001,Zeus,zeus,DEITY,"[""Jupiter"",""Dias""]",King of gods...,"[""Thunder"",""Sky""]",,src:homer-iliad
entity_perseus_001,Perseus,perseus,HUMAN,[],Hero and demigod...,,"true",src:ovid

# myths.csv
id,name,slug,summary,period,sourceIds
myth_trojan-war_001,Trojan War,trojan-war,10-year conflict...,Heroic Age,src:homer-iliad

# events.csv
id,name,slug,description,timestamp,participants,mythIds,sourceIds
event_troy-begins_001,Troy Begins,troy-begins,Greek fleet sails...,0,entity_menelaus_001,myth_trojan-war_001,src:homer-iliad
```

**Cypher 로드:**

```cypher
LOAD CSV WITH HEADERS FROM 'file:///entities.csv' AS row
CREATE (e:Entity {
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  sourceIds: split(row.sourceIds, '|')
})
SET e:[row.type]
```

**체크리스트:**
- [ ] CSV 파일 3개 생성
- [ ] 포맷 검증
- [ ] Cypher 로드 스크립트
- [ ] 데이터 무결성 확인

---

## ⏰ Step 2 타임라인

```
Day 1 (2026-08-07 오후)
├─ 14:00 ~ 16:00  Phase 1-1: GraphQL Schema 설계 (Blake)
├─ 14:00 ~ 15:00  Phase 2-1: 기준 문헌 선정 (Jordan) [병렬]
│
├─ 15:00 ~ 16:00  Phase 1-2: Neo4j Driver (Blake)
├─ 15:00 ~ 16:30  Phase 2-2: Entity 설계 (Jordan) [병렬]

Day 2 (2026-08-08 오전)
├─ 09:00 ~ 09:30  Phase 1-3: Cypher 스크립트 (Blake)
├─ 09:00 ~ 10:00  Phase 2-3/4: Myth & Event 설계 (Jordan) [병렬]
│
├─ 10:00 ~ 11:00  Phase 3-1: Neo4j Driver 테스트 (Blake)
├─ 10:00 ~ 11:00  Phase 3-2: CSV 변환 (Jordan/Blake) [병렬]
│
└─ 11:00          Step 2 완료 ✅
   다음: Step 3 (GraphQL Resolver 구현)
```

**예상 소요:** 10-12시간 (병렬화로 2일)

---

## 🚨 Critical Path (변경 불가)

```
OQ-2 (Myth/Event 노드) — P0
  ├─ Entity 설계 필수 (내부 참조)
  ├─ Myth 설계 필수
  └─ Event 설계 필수 ← Step 2에서 완료해야 함

OQ-1 (Entity 라벨) — P1
  └─ GraphQL Schema 설계로 확정

결론: Step 2 Schema + Seed 설계 완료 필수!
```

---

## 📝 Step 2 체크리스트

### Phase 1 (Schema 및 Driver)
- [ ] GraphQL schema.graphql 작성
- [ ] Neo4j Driver 초기화 (src/server/neo4j.ts)
- [ ] Cypher 초기화 스크립트 (scripts/init.cypher)
- [ ] Neo4j 연결 테스트 (로컬 + 클라우드)

### Phase 2 (Seed 데이터)
- [ ] 기준 문헌 5개 선정
- [ ] Entity 50-80개 설계
- [ ] Myth 10-15개 설계
- [ ] Event 15-25개 설계
- [ ] CSV 파일 생성

### 최종 산출물
- [ ] `src/server/graphql/schema.graphql`
- [ ] `src/server/neo4j.ts`
- [ ] `scripts/init.cypher`
- [ ] `data/entities.csv`
- [ ] `data/myths.csv`
- [ ] `data/events.csv`
- [ ] 문헌 참고 목록

---

## 🎯 Step 2 성공 기준

| 항목 | 기준 | 상태 |
|------|------|------|
| **GraphQL Schema** | Entity, Myth, Event 타입 완성 | [ ] |
| **Neo4j Driver** | 로컬 + 클라우드 연결 확인 | [ ] |
| **Seed 데이터** | 50-80 entities, 10-15 myths, 15-25 events | [ ] |
| **Cypher 스크립트** | Index 및 Constraints 정의 | [ ] |
| **CSV 파일** | 로드 가능한 형식 | [ ] |

**Step 2 Pass/Fail:** Go/No-Go

---

*Step 2 계획서 작성: TS Alex | 시작일: 2026-08-07*
