// ============================================================================
// MythGraph Sprint 2 — Extended Seed Data Loader
// ============================================================================
// 103개 entities + 111개 relationships 로드
//
// 주의: 기존 데이터를 덮어쓰지 않음 (MERGE 사용)
// 실행: cypher-shell -u neo4j -p PASSWORD < load-entities-extended.cypher
//       또는 Neo4j Browser에서 복사-붙여넣기
//

// ============================================================================
// PHASE 1: Entities 로드
// ============================================================================

LOAD CSV WITH HEADERS FROM 'file:///entities-extended.csv' AS row
MERGE (e:Entity {id: row.id})
SET
  e.name = row.name,
  e.type = row.type,
  e.description = row.description,
  e.aliases = CASE
    WHEN row.aliases IS NOT NULL AND row.aliases <> ''
    THEN split(row.aliases, '|')
    ELSE []
  END,
  e.domain = CASE
    WHEN row.domain IS NOT NULL AND row.domain <> ''
    THEN split(row.domain, '|')
    ELSE []
  END,
  e.romanName = row.romanName,
  e.symbols = CASE
    WHEN row.symbols IS NOT NULL AND row.symbols <> ''
    THEN split(row.symbols, '|')
    ELSE []
  END,
  e.sacredAnimals = CASE
    WHEN row.sacredAnimals IS NOT NULL AND row.sacredAnimals <> ''
    THEN split(row.sacredAnimals, '|')
    ELSE []
  END,
  e.sourceIds = CASE
    WHEN row.sourceIds IS NOT NULL AND row.sourceIds <> ''
    THEN split(row.sourceIds, '|')
    ELSE []
  END,
  e.notes = row.notes;

// ============================================================================
// PHASE 2: Relationships 로드
// ============================================================================
// 참고: 이 스크립트는 각 관계 타입을 동적으로 생성합니다.
// Neo4j 5.x에서 모든 타입을 지원하려면 APOC 라이브러리가 필요합니다.
// 또는 아래 타입별 수동 MERGE를 사용할 수 있습니다.

// ============================================================================
// Option A: APOC를 사용한 동적 관계 생성 (권장)
// APOC 설치: https://neo4j.com/docs/apoc/latest/
// ============================================================================

LOAD CSV WITH HEADERS FROM 'file:///relationships-extended.csv' AS row
MATCH (source:Entity {id: row.source_id})
MATCH (target:Entity {id: row.target_id})
CALL apoc.create.relationship(source, row.relationship_type, {}, target) YIELD rel
RETURN rel;

// ============================================================================
// Option B: 수동 관계 생성 (APOC 없을 시)
// 주요 관계 타입만 처리 — 필요시 추가
// ============================================================================

// PARENT 관계
LOAD CSV WITH HEADERS FROM 'file:///relationships-extended.csv' AS row
WHERE row.relationship_type = 'PARENT'
MATCH (source:Entity {id: row.source_id})
MATCH (target:Entity {id: row.target_id})
MERGE (source)-[r:PARENT]->(target)
SET r.label = row.relationship_type;

// SPOUSE 관계
LOAD CSV WITH HEADERS FROM 'file:///relationships-extended.csv' AS row
WHERE row.relationship_type = 'SPOUSE'
MATCH (source:Entity {id: row.source_id})
MATCH (target:Entity {id: row.target_id})
MERGE (source)-[r:SPOUSE]->(target)
SET r.label = row.relationship_type;

// SIBLING 관계
LOAD CSV WITH HEADERS FROM 'file:///relationships-extended.csv' AS row
WHERE row.relationship_type IN ['BROTHER', 'SISTER']
MATCH (source:Entity {id: row.source_id})
MATCH (target:Entity {id: row.target_id})
MERGE (source)-[r:SIBLING]->(target)
SET r.label = row.relationship_type;

// 기타 관계 (Generic)
LOAD CSV WITH HEADERS FROM 'file:///relationships-extended.csv' AS row
WHERE row.relationship_type NOT IN ['PARENT', 'SPOUSE', 'BROTHER', 'SISTER']
MATCH (source:Entity {id: row.source_id})
MATCH (target:Entity {id: row.target_id})
CALL apoc.create.relationship(source, row.relationship_type, {}, target) YIELD rel
RETURN rel;

// ============================================================================
// VERIFICATION
// ============================================================================

// 로드된 entities 개수 확인
MATCH (e:Entity) RETURN count(e) as entity_count;

// 로드된 relationships 개수 확인
MATCH (e:Entity)-[r]-() RETURN count(distinct r) as relationship_count;

// Entity type별 분포
MATCH (e:Entity) RETURN e.type, count(e) as count ORDER BY count DESC;

// ============================================================================
// 추가 인덱스 생성 (성능 최적화)
// ============================================================================

CREATE INDEX entity_type_index IF NOT EXISTS FOR (e:Entity) ON (e.type);
CREATE INDEX entity_name_index IF NOT EXISTS FOR (e:Entity) ON (e.name);
