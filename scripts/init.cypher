// ============================================================================
// MythGraph Neo4j Initialization Script
// ============================================================================
//
// This script initializes the MythGraph database with all necessary constraints,
// indexes, and full-text search indexes.
//
// Execution Order:
// 1. Constraints (must be created before data insertion)
// 2. Full-text indexes (for searchEntities and myth lookup queries)
// 3. Label-based indexes (for entity type lookups)
//
// Idempotency: All commands use "IF NOT EXISTS" syntax for safe re-execution.
// Neo4j Version: 5.x
//

// ============================================================================
// PHASE 1: Unique Constraints
// ============================================================================
// These must be created first and are required for data integrity.
// Each constraint enforces a primary key pattern on the specified label.

// Entity(id) - Primary key for all entities
CREATE CONSTRAINT entity_id_unique
IF NOT EXISTS
FOR (entity:Entity) REQUIRE entity.id IS UNIQUE;

// Myth(id) - Primary key for myths
CREATE CONSTRAINT myth_id_unique
IF NOT EXISTS
FOR (myth:Myth) REQUIRE myth.id IS UNIQUE;

// Event(id) - Primary key for events
CREATE CONSTRAINT event_id_unique
IF NOT EXISTS
FOR (event:Event) REQUIRE event.id IS UNIQUE;

// Source(id) - Primary key for sources
CREATE CONSTRAINT source_id_unique
IF NOT EXISTS
FOR (source:Source) REQUIRE source.id IS UNIQUE;

// ============================================================================
// PHASE 2: Full-Text Search Indexes
// ============================================================================
// These indexes enable efficient full-text search queries across entity
// and myth data. They support the searchEntities() GraphQL query.

// Index for entity search (name, aliases, description)
// Used by: Query.searchEntities()
CREATE FULLTEXT INDEX entity_search
IF NOT EXISTS
FOR (entity:Entity)
ON EACH [entity.name, entity.aliases, entity.description];

// Index for myth search (title, summary)
// Used for quick myth lookups and relevance scoring
CREATE FULLTEXT INDEX myth_search
IF NOT EXISTS
FOR (myth:Myth)
ON EACH [myth.title, myth.summary];

// ============================================================================
// PHASE 3: Label-Based Indexes
// ============================================================================
// These indexes optimize queries filtered by entity type.
// They support efficient lookups for Deity, Human, Monster, and Place entities.

// Index for Deity entities
CREATE INDEX deity_id_index
IF NOT EXISTS
FOR (deity:Deity) ON (deity.id);

// Index for Human entities
CREATE INDEX human_id_index
IF NOT EXISTS
FOR (human:Human) ON (human.id);

// Index for Monster entities
CREATE INDEX monster_id_index
IF NOT EXISTS
FOR (monster:Monster) ON (monster.id);

// Index for Place entities
CREATE INDEX place_id_index
IF NOT EXISTS
FOR (place:Place) ON (place.id);
