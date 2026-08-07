# Sprint 1 즉시 결정사항 — 최종 확정

**회의 날짜:** 2026-08-07  
**주재:** Jordan(PM), Blake(BE)  
**상태:** ✅ 확정  
**변경 이력:** v1.0 최종

---

## 📋 결정 요약표

| # | 결정사항 | 선택 | 우선도 | 리스크 | 상태 |
|----|---------|------|--------|--------|------|
| OQ-1 | Entity 라벨 전략 | **공통 Entity + 보조 라벨** | P1 | 중간 | ✅ 확정 |
| OQ-2 | Myth/Event 노드 | **별도 노드 생성** | P0 | 높음 | ✅ 확정 |
| OQ-3 | 벡터 임베딩 공급자 | **결정 유보 (Sprint 3)** | P2 | 낮음 | ✅ 확정 |
| OQ-4 | Neo4j 계정 분리 | **dev/prod 완전 분리** | P0 | 높음 | ✅ 확정 |

---

## 🎯 OQ-1: Entity 라벨 전략

### 결정: 공통 Entity 노드 + 보조 라벨

```cypher
(:Entity:Deity {
  id: "deity_zeus_001",
  name: "Zeus",
  slug: "zeus",
  aliases: ["Jupiter", "Dias"],
  description: "King of gods, god of thunder",
  domains: ["Thunder", "Sky", "Justice"],
  sourceIds: ["src:homer-iliad"]
})
```

### 근거

- **설계 우수:** Neo4j는 복합 라벨 + 프로퍼티 쿼리를 효율적으로 처리
- **GraphQL 정규화:** 공통 `Entity` 인터페이스로 타입 상속 가능
- **검색/필터링:** 공통 프로퍼티만 관리해 구현 단순화
- **확장성:** 새로운 라벨 추가 시 기존 데이터 무영향

### 구현 일정

| 태스크 | 시간 | 담당 |
|--------|------|------|
| GraphQL Schema 정의 | 2시간 | BE Blake |
| Neo4j Constraints + Index | 1.5시간 | BE Blake |
| Entity 검색 Resolver | 2.5시간 | BE Blake |
| Seed 데이터 수집 & 검증 | 3시간 | PM Jordan |
| **합계** | **9시간** | |

### 마이그레이션 경로

분리 노드(Deity/Human/Monster/Place)로 변경 시:
- **난이도:** 높음
- **소요시간:** 3-4일
- **영향:** GraphQL Schema 전체, 모든 Resolver, 테스트 재작성

**권장:** Day 2 Schema 설계 완료, Day 3-4 검색 Resolver 구현

---

## 🎯 OQ-2: Myth/Event 노드 포함 여부

### 결정: 별도 노드 생성 ⚠️ P0 필수

```cypher
(:Myth {
  id: "myth_trojan-war_001",
  name: "Trojan War",
  slug: "trojan-war",
  summary: "10-year conflict between Achaeans and Trojans",
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
```

### 근거

**P0 우선도 이유:**
1. **Sprint 2 의존성:** MG-05 "Myth 탐색" 기능의 필수 전제
2. **마이그레이션 불가능:** 초기 미적용 시 나중 변경 거의 불가능 (1주 소요)
3. **데이터 구조 정의:** Seed 데이터 수집 방식이 완전히 달라짐 (+2-3일)

**기술 타당성:**
- 관계 속성으로는 Event의 독립 검색 불가능
- Myth → Event → Entity 연쇄 탐색을 위해 별도 노드 필수
- Neo4j 권장 사항 (정규화된 설계)

### 구현 일정

| 태스크 | 시간 | 담당 |
|--------|------|------|
| Neo4j Myth/Event 노드 Schema | 2시간 | BE Blake |
| Cypher 쿼리 (연쇄 탐색) | 2.5시간 | BE Blake |
| GraphQL Myth/Event Resolver | 3시간 | BE Blake |
| Seed 데이터 설계 (Myth 10-15개, Event 15-25개) | 3시간 | PM Jordan |
| Seed 로드 script & 검증 | 2시간 | PM/BE |
| 관계 테스트 | 1.5시간 | QA |
| **합계** | **14시간** | |

**PM 추가 작업:**
- Myth 기준 문헌 선정 (Homer, Ovid, Diodorus): 1.5시간
- Event 시간순 정렬 & 우선순위: 1시간
- **PM 총 5.5시간 (1.5일)**

### 마이그레이션 경로

Event를 관계 속성에서 별도 노드로 변경 시:
- **난이도:** 매우 높음 (거의 불가능)
- **소요시간:** 5-7일
- **영향:** Entity-Entity 관계 재설계, GraphQL Schema 전체 변경, Seed 데이터 추출-변환-로드

**권장:** ⚠️ **Day 1 반드시 확정할 것**

### 데이터 예시

**Seed 구조:**
```json
{
  "myths": [
    {
      "id": "myth_trojan-war_001",
      "name": "Trojan War",
      "summary": "10-year conflict between Achaeans and Trojans",
      "sourceIds": ["src:homer-iliad"]
    }
  ],
  "events": [
    {
      "id": "event_paris-abduction_001",
      "name": "Paris Abducts Helen",
      "description": "Paris takes Helen from Greece",
      "timestamp": 0,
      "participants": ["entity_paris_001", "entity_helen_001"],
      "mythIds": ["myth_trojan-war_001"],
      "sourceIds": ["src:homer-iliad:book-1"]
    }
  ],
  "relationships": [
    {
      "source": "myth_trojan-war_001",
      "target": "event_paris-abduction_001",
      "type": "CONTAINS_EVENT"
    }
  ]
}
```

---

## 🎯 OQ-3: 벡터 임베딩 공급자

### 결정: 결정 유보 (Sprint 3 구현 시점에 선택)

**우선도:** P2 (선택)  
**영향:** Sprint 1-2 불필요  
**구현 시점:** Sprint 3 "의미 검색(MG-06)" 기능

### 근거

- **필요시점:** Sprint 1-2는 keyword 기반 검색(`full-text index`)으로 충분
- **비용 절감:** 현재 선택 시 불필요한 월 $50-300 비용 증가
- **유연성:** 나중 도입 시 공급자 변경 가능 (인터페이스 추상화)

### Sprint 3 공급자 비교

| 공급자 | 월 비용 | 응답시간 | 품질 | 통합난이도 |
|--------|--------|--------|------|-----------|
| OpenAI | $200-300 | 200ms | 95% | 낮음 |
| **DeepSeek** (권장) | **$50-100** | 300ms | 85% | 낮음 |
| 로컬 (Ollama) | $0 | 1000ms | 70% | 높음 |

**권장:** Sprint 3 도입 시 **DeepSeek** (비용 효율)

### Sprint 1 준비 작업

```typescript
// 추상화 인터페이스 (공급자 변경 용이)
interface EmbeddingProvider {
  embed(text: string): Promise<number[]>
}

// Knowledge Chunk 스키마 미리 정의
interface EntityChunk {
  entityId: string
  chunks: Array<{
    id: string
    text: string
  }>
}
```

**소요시간:** 3.5시간 (Sprint 1 내 인터페이스만 설계)

---

## 🎯 OQ-4/OQ-5: Neo4j 계정 분리

### 결정: dev/prod 완전 분리 ⚠️ P0 필수

**환경 구성:**
```
Local Dev       │  Staging (Aura)  │  Production
─────────────────┼──────────────────┼─────────────
Docker Neo4j    │  Aura dev (free) │  Aura prod
localhost:7687  │  sandbox.neo4j   │  prod.neo4j
no auth         │  auth enabled    │  auth enabled
```

### 근거

**P0 우선도 이유:**
1. **안정성:** Vercel 배포 후 서비스 중단 리스크 최소화
2. **개발 자유도:** Seed 재로드 시 prod 영향 0
3. **마이그레이션 복잡도:** 초기부터 분리하지 않으면 1주 소요

### 구현 일정

| 태스크 | 시간 | 담당 | Day |
|--------|------|------|-----|
| Aura 제약 확인 (1개 vs 2개 동시) | 0.5시간 | Blake | 1 |
| Aura dev/prod 인스턴스 생성 | 0.5시간 | Blake | 1 |
| 환경변수 3단계 분리 (.env.local/.development/.production) | 1시간 | Blake | 1 |
| Neo4j Driver 재사용 구현 | 1.5시간 | Blake | 2 |
| Seed 로드 script (3환경별) | 1.5시간 | Jordan | 2 |
| CI/CD 파이프라인 (자격증명 주입) | 2시간 | Blake | 3 |
| 헬스 체크 | 1시간 | QA | 4 |
| **합계** | **8시간** | | |

### 환경별 자격증명 관리

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

**`.env.production` (Vercel production):**
```env
NEO4J_URI=neo4j+s://yyyyy.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=${AURA_PROD_PASSWORD}  # Secret vault
```

### CI/CD 파이프라인

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    steps:
      - name: Determine environment
        id: env
        run: |
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "ENV=production" >> $GITHUB_OUTPUT
          else
            echo "ENV=development" >> $GITHUB_OUTPUT
          fi
      
      - name: Set Neo4j credentials (secret vault)
        env:
          NEO4J_DEV_PASSWORD: ${{ secrets.NEO4J_DEV_PASSWORD }}
          NEO4J_PROD_PASSWORD: ${{ secrets.NEO4J_PROD_PASSWORD }}
        run: # 환경별 설정
```

### 비용 계획

| 기간 | 구성 | 비용 |
|------|------|------|
| Sprint 1 (2주) | 2 x Aura free tier | $0 |
| Sprint 2+ | 1 x Aura free (dev) + 1 x prod | $1-2K/월* |

*Neo4j Aura 가격: DB당 $300-1,000/월 (스토리지/처리량)

### Aura 무료 평가판 제약 확인

**Day 1 액션:** Blake가 아래 확인
```
1. 무료 평가판으로 2개 인스턴스 동시 생성 가능?
   → 가능: 전략 A (complete separation) 진행
   → 불가능: 전략 B (단일 인스턴스 + 논리 DB) 조정
2. 평가판 제약 (저장소, 연결수)
   → 50-80 entity + 150-250 관계 저장 가능?
3. 평가판 기간 (통상 30일)
```

### 마이그레이션 경로

단일 인스턴스에서 완전 분리로 변경 시:
- **난이도:** 높음
- **소요시간:** 2-3일
- **영향:** 자격증명 전환, CI/CD 파이프라인 수정, 배포 테스트

**권장:** ⚠️ **Day 1 반드시 확정할 것**

---

## ⏱️ Sprint 1 Day 1 액션 아이템

### 우선순위별 실행

| # | 액션 | 담당 | 예상 | 산출물 |
|----|------|------|------|--------|
| P0 | **Aura 제약 확인** (1개 vs 2개) | Blake | 30분 | OQ-4 전략 선택 |
| P0 | 기술 검증 의견서 검토 | Blake | 1시간 | 기술 검증 결과 |
| P0 | **Seed 구조 최종 검토** (Myth/Event 포함) | Jordan | 1시간 | OQ-2 최종 확정 |
| P0 | Seed 일정 재평가 | Jordan | 30분 | 일정 조정 |
| P1 | 4개 OQ 신속 협의 회의 | Team | 1.5시간 | 최종 결정 기록 |
| P1 | GraphQL Schema 설계 시작 | Blake | 2시간 | Schema draft |
| P1 | Neo4j 로컬 + Aura dev 준비 | Blake | 1.5시간 | 환경 준비 완료 |
| P1 | Seed 기준 문헌 선정 | Jordan | 1.5시간 | 출처 문서 |

**Day 1 소요시간:**
- BE (Blake): 3.5시간 (병렬 2시간)
- PM (Jordan): 3시간 (병렬 1.5시간)
- Team 미팅: 1.5시간
- **전체: 4-5시간**

---

## 📊 의존성 맵

```
OQ-2 (Myth/Event)
├─ OQ-1 (Entity 라벨) ← 의존하지 않음 (독립)
├─ Seed 데이터 구조 재설계 (Jordan)
├─ GraphQL Resolver 추가 (Blake)
└─ Sprint 2 MG-05 "Myth 탐색" 기능 의존

OQ-4 (Neo4j 분리)
├─ Aura 무료 평가판 제약 확인 (Blake)
├─ CI/CD 파이프라인 설정 (Blake)
└─ 초기 Seed 로드 전략 결정 (Jordan)

OQ-3 (벡터 임베딩)
└─ Sprint 3에서 결정 (지금 불필요)
```

---

## 📝 회의 기록

**참석자:** Jordan(PM), Blake(BE)  
**문서:** 
- PM 가이드: [Sprint 1 결정사항 PM 관점](./decisions-pm-perspective.md)
- BE 기술안: [Sprint 1 결정사항 기술 검증](./decisions-be-technical.md)

**확정 일시:** 2026-08-07 (시간 기록 예정)

**다음 단계:**
1. Day 1 킥오프 회의에서 최종 결정 확인
2. Day 2 부터 병렬 작업 시작:
   - Blake: GraphQL Schema + Neo4j 환경 준비
   - Jordan: Seed 데이터 수집 시작
3. Day 4: PR 생성 및 첫 번째 구현 리뷰

---

*회의록 작성: TS Alex | 다음 회의: Sprint 1 리뷰*
