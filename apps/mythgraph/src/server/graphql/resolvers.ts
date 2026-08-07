/**
 * GraphQL Query Resolvers for MythGraph
 *
 * Implements all Query resolver functions that interface with Neo4j.
 * Each resolver executes a Cypher query and transforms the results into
 * GraphQL response objects.
 */

import { getSession } from '../neo4j';
import { getEmbeddingService } from '../services/embeddingService';
import neo4j from 'neo4j-driver';

// ============================================================================
// Type Definitions
// ============================================================================

interface SearchResult {
  entity: Entity;
  matchScore: number;
}

interface Entity {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  type: 'DEITY' | 'HUMAN' | 'MONSTER' | 'PLACE';
  romanName?: string;
  domain?: string;
  symbols?: string[];
  sacredAnimals?: string[];
  heroType?: string;
  origin?: string;
  monsterType?: string;
  abilities?: string[];
  region?: string;
  locationType?: string;
}

interface Relationship {
  source: Entity;
  target: Entity;
  type: string;
  label: string;
  description?: string;
}

interface Myth {
  id: string;
  title: string;
  summary: string;
  entities: Entity[];
  relatedSources: Array<{ id: string; title: string; author?: string; workDate?: string; uri?: string }>;
}

interface Source {
  id: string;
  title: string;
  author?: string;
  workDate?: string;
  uri?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Converts a Neo4j Entity node to GraphQL Entity type
 */
function nodeToEntity(node: any): Entity {
  const props = node.properties || node;
  return {
    id: props.id,
    name: props.name,
    aliases: props.aliases || [],
    description: props.description,
    type: props.type,
    romanName: props.romanName,
    domain: props.domain,
    symbols: props.symbols,
    sacredAnimals: props.sacredAnimals,
    heroType: props.heroType,
    origin: props.origin,
    monsterType: props.monsterType,
    abilities: props.abilities,
    region: props.region,
    locationType: props.locationType,
  };
}

/**
 * Converts a Neo4j Source node to GraphQL Source type
 */
function nodeToSource(node: any): Source {
  return {
    id: node.properties.id,
    title: node.properties.name || node.properties.title || node.properties.work,
    author: node.properties.author || node.properties.name,
    workDate: node.properties.period || node.properties.workDate,
    uri: node.properties.uri,
  };
}

// ============================================================================
// Query Resolvers
// ============================================================================

/**
 * Search entities by semantic similarity using vector embeddings.
 *
 * Uses OpenAI's text-embedding-3-small model to embed the query and entity descriptions,
 * then calculates cosine similarity to find semantically similar entities.
 *
 * This enables searching for concepts and meanings rather than just keyword matching.
 * Example: "king of gods" → finds Zeus/Jupiter
 *
 * Performance target: <200ms single query
 */
export async function searchEntitiesByVector(
  _parent: any,
  args: {
    query: string;
    limit?: number;
    threshold?: number; // Cosine similarity threshold (0-1), default: 0.5
  }
): Promise<SearchResult[]> {
  const session = getSession();
  const limit = Math.min(Math.floor(args.limit || 20), 100);
  const threshold = Math.max(0, Math.min(1, args.threshold || 0.5)); // Clamp to [0, 1]
  const startTime = Date.now();

  try {
    const embeddingService = getEmbeddingService();

    // 1. Embed the query
    const queryEmbedding = await embeddingService.embedText(args.query);
    console.log(
      `[searchEntitiesByVector] Query embedded in ${queryEmbedding.computeTime}ms (cached: ${queryEmbedding.cached})`
    );

    // 2. Fetch all entities with descriptions
    const result = await session.run(
      `MATCH (e:Entity)
       WHERE e.description IS NOT NULL
       RETURN e.id as id, e.name as name, e.description as description, e.type as type,
              e.aliases as aliases, e.romanName as romanName, e.domain as domain,
              e.symbols as symbols, e.sacredAnimals as sacredAnimals, e.heroType as heroType,
              e.origin as origin, e.monsterType as monsterType, e.abilities as abilities,
              e.region as region, e.locationType as locationType`
    );

    console.log(`[searchEntitiesByVector] Fetched ${result.records.length} entities from Neo4j`);

    // 3. Embed entity descriptions and calculate similarity
    const entityTexts = result.records.map((r) => r.get('description'));
    const batchResult = await embeddingService.embedBatch(entityTexts);

    console.log(
      `[searchEntitiesByVector] Batch embeddings completed: ${batchResult.totalTime}ms, cache hit rate: ${(batchResult.cacheHitRate * 100).toFixed(1)}%`
    );

    // 4. Calculate similarities and filter
    const similarities = result.records.map((record, index) => {
      const entityEmbedding = batchResult.embeddings[index].embedding;
      const similarity = embeddingService.cosineSimilarity(
        queryEmbedding.embedding,
        entityEmbedding
      );

      return {
        entity: {
          id: record.get('id'),
          name: record.get('name'),
          aliases: record.get('aliases') || [],
          description: record.get('description'),
          type: record.get('type'),
          romanName: record.get('romanName'),
          domain: record.get('domain'),
          symbols: record.get('symbols'),
          sacredAnimals: record.get('sacredAnimals'),
          heroType: record.get('heroType'),
          origin: record.get('origin'),
          monsterType: record.get('monsterType'),
          abilities: record.get('abilities'),
          region: record.get('region'),
          locationType: record.get('locationType'),
        } as Entity,
        similarity: similarity.similarity,
      };
    });

    // 5. Filter by threshold, sort, and limit
    const filtered = similarities
      .filter((s) => s.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    const totalTime = Date.now() - startTime;
    console.log(
      `[searchEntitiesByVector] Complete: ${filtered.length} results in ${totalTime}ms (query: "${args.query}")`
    );

    return filtered.map((s) => ({
      entity: s.entity,
      matchScore: s.similarity,
    }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[searchEntitiesByVector] Error: ${errorMessage}`);
    throw new Error(`Vector search failed: ${errorMessage}`);
  } finally {
    await session.close();
  }
}

/**
 * Search entities by name, aliases, or description using full-text search.
 *
 * Uses Neo4j's FULLTEXT INDEX for efficient searching.
 * Results are sorted by match score (highest first).
 */
export async function searchEntities(
  _parent: any,
  args: {
    query: string;
    filters?: { types?: string[]; hasRelationships?: boolean };
    limit?: number;
  }
): Promise<SearchResult[]> {
  const session = getSession();
  const limit = Math.min(Math.floor(args.limit || 20), 100);

  try {
    // Build Cypher query with full-text search
    let cypherQuery = `
      CALL db.index.fulltext.queryNodes('entity_search', $query)
      YIELD node, score
      WHERE score > 0
    `;

    // Apply type filters if provided
    if (args.filters?.types && args.filters.types.length > 0) {
      cypherQuery += ` AND node.type IN $types`;
    }

    cypherQuery += `
      RETURN node, score
      ORDER BY score DESC
      LIMIT $limit
    `;

    const params: any = {
      query: args.query,
      limit: limit,
    };

    if (args.filters?.types && args.filters.types.length > 0) {
      params.types = args.filters.types;
    }

    const result = await session.run(cypherQuery, params);

    return result.records.map((record) => {
      const score = record.get('score');
      return {
        entity: nodeToEntity(record.get('node')),
        matchScore: typeof score === 'number' ? score : parseFloat(score),
      };
    });
  } finally {
    await session.close();
  }
}

/**
 * Get a single entity by its ID.
 *
 * Returns the entity with all its properties, or null if not found.
 */
export async function getEntity(
  _parent: any,
  args: { id: string }
): Promise<Entity | null> {
  const session = getSession();

  try {
    const result = await session.run(
      `MATCH (e:Entity {id: $id}) RETURN e`,
      { id: args.id }
    );

    if (result.records.length === 0) {
      return null;
    }

    return nodeToEntity(result.records[0].get('e'));
  } finally {
    await session.close();
  }
}

/**
 * Get relationships for an entity.
 *
 * Returns all relationships where the entity is the source.
 * Limited to 50 by default to prevent oversized responses.
 */
export async function getRelationships(
  _parent: any,
  args: {
    entityId: string;
    relationshipType?: string;
    limit?: number;
  }
): Promise<Relationship[]> {
  const session = getSession();
  const limit = Math.min(Math.floor(args.limit || 50), 100);

  try {
    let cypherQuery = `
      MATCH (source:Entity {id: $entityId})-[rel]->(target:Entity)
      WHERE source IS NOT NULL AND target IS NOT NULL
    `;

    if (args.relationshipType) {
      cypherQuery += ` AND type(rel) = $relationshipType`;
    }

    cypherQuery += `
      RETURN source, rel, target
      ORDER BY type(rel) ASC
      LIMIT $limit
    `;

    const params: any = {
      entityId: args.entityId,
      limit: limit,
    };

    if (args.relationshipType) {
      params.relationshipType = args.relationshipType;
    }

    const result = await session.run(cypherQuery, params);

    if (result.records.length === 0) {
      return [];
    }

    return result.records.map((record) => {
      const sourceNode = record.get('source');
      const targetNode = record.get('target');
      const rel = record.get('rel');

      return {
        source: nodeToEntity(sourceNode),
        target: nodeToEntity(targetNode),
        type: rel.type,
        label: rel.properties.label || rel.type,
        description: rel.properties.description,
      };
    });
  } finally {
    await session.close();
  }
}

/**
 * Get a myth by its ID.
 *
 * Returns the myth with its related entities and sources.
 */
export async function getMythById(
  _parent: any,
  args: { id: string }
): Promise<Myth | null> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (m:Myth {id: $id})
      OPTIONAL MATCH (m)-[:REFERENCES]->(s:Source)
      RETURN m, COLLECT(s) as sources
      `,
      { id: args.id }
    );

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    const mythNode = record.get('m');
    const sourcesNodes = record.get('sources') || [];

    return {
      id: mythNode.properties.id,
      title: mythNode.properties.name || mythNode.properties.title,
      summary: mythNode.properties.description || '',
      entities: [], // Will be populated from participantIds
      relatedSources: sourcesNodes.map(nodeToSource),
    };
  } finally {
    await session.close();
  }
}

/**
 * Find the shortest path between two entities.
 *
 * Uses Neo4j's built-in shortest path algorithm.
 * Returns a path as a sequence of relationships.
 */
export async function getNearestPath(
  _parent: any,
  args: { fromId: string; toId: string; maxHops?: number }
): Promise<Relationship[][]> {
  const session = getSession();
  const maxHops = Math.min(Math.floor(args.maxHops || 5), 10);

  try {
    const result = await session.run(
      `
      MATCH (source:Entity {id: $fromId})
      MATCH (target:Entity {id: $toId})
      MATCH p = shortestPath((source)-[*1..${maxHops}]-(target))
      RETURN [node IN nodes(p) | node {.*}] as nodeList,
             [rel IN relationships(p) | {type: type(rel), properties: rel}] as relList
      LIMIT 1
      `,
      { fromId: args.fromId, toId: args.toId }
    );

    if (result.records.length === 0) {
      return [[]];
    }

    const record = result.records[0];
    const nodeList = record.get('nodeList') || [];
    const relList = record.get('relList') || [];

    if (nodeList.length < 2 || relList.length === 0) {
      return [[]];
    }

    const pathRelationships: Relationship[] = relList.map((rel: any, idx: number) => {
      const sourceNode = nodeList[idx];
      const targetNode = nodeList[idx + 1];

      return {
        source: nodeToEntity(sourceNode),
        target: nodeToEntity(targetNode),
        type: rel.type,
        label: rel.properties.label || rel.type,
        description: rel.properties.description,
      };
    });

    return [pathRelationships];
  } finally {
    await session.close();
  }
}

/**
 * Hybrid search combining keyword and vector-based semantic search.
 *
 * - Keyword search (full-text): scores name/aliases/description matches
 * - Vector search: uses OpenAI embeddings for semantic similarity
 * - Results combined with weighted average (default 50/50)
 *
 * Example: "god of war" finds Ares via both keyword and semantic paths
 * Performance: ~300-400ms first query (API + embedding), <100ms cached
 */
export async function hybridSearchEntities(
  _parent: any,
  args: {
    query: string;
    limit?: number;
    vectorWeight?: number;
    filters?: { types?: string[]; hasRelationships?: boolean };
  }
): Promise<SearchResult[]> {
  const session = getSession();
  const limit = Math.min(Math.floor(args.limit || 20), 100);
  const vectorWeight = Math.max(0, Math.min(1, args.vectorWeight !== undefined ? args.vectorWeight : 0.5));
  const keywordWeight = 1 - vectorWeight;
  const startTime = Date.now();

  try {
    console.log(
      `[hybridSearch] Query: "${args.query}" (keyword:${(keywordWeight * 100).toFixed(0)}%, vector:${(vectorWeight * 100).toFixed(0)}%)`
    );

    // Step 1: Keyword search
    let keywordQuery = `
      CALL db.index.fulltext.queryNodes('entity_search', $query)
      YIELD node, score
      WHERE score > 0
    `;

    if (args.filters?.types && args.filters.types.length > 0) {
      keywordQuery += ` AND node.type IN $types`;
    }

    keywordQuery += `
      RETURN node.id as id, node.name as name, node.description as description,
             node.type as type, node.aliases as aliases, node.romanName as romanName,
             node.domain as domain, node.symbols as symbols, node.sacredAnimals as sacredAnimals,
             node.heroType as heroType, node.origin as origin, node.monsterType as monsterType,
             node.abilities as abilities, node.region as region, node.locationType as locationType,
             score as keywordScore
      LIMIT $limit
    `;

    const params: any = { query: args.query, limit: neo4j.int(limit) };
    if (args.filters?.types && args.filters.types.length > 0) {
      params.types = args.filters.types;
    }

    const keywordResult = await session.run(keywordQuery, params);
    console.log(`[hybridSearch] Keyword search: ${keywordResult.records.length} results`);

    // Step 2: Vector search (if vectorWeight > 0)
    let vectorResults: Map<string, { entity: Entity; similarity: number }> = new Map();

    if (vectorWeight > 0) {
      const embeddingService = getEmbeddingService();
      const queryEmbedding = await embeddingService.embedText(args.query);

      // Fetch all entities for vector comparison
      let vectorQueryBase = 'MATCH (e:Entity) WHERE e.description IS NOT NULL';
      if (args.filters?.types && args.filters.types.length > 0) {
        vectorQueryBase += ' AND e.type IN $types';
      }

      const vectorQueryStr = `
        ${vectorQueryBase}
        RETURN e.id as id, e.name as name, e.description as description, e.type as type,
               e.aliases as aliases, e.romanName as romanName, e.domain as domain,
               e.symbols as symbols, e.sacredAnimals as sacredAnimals, e.heroType as heroType,
               e.origin as origin, e.monsterType as monsterType, e.abilities as abilities,
               e.region as region, e.locationType as locationType
      `;

      const vectorQueryResult = await session.run(vectorQueryStr, params);

      // Batch embed entity descriptions
      const entityTexts = vectorQueryResult.records.map((r) => r.get('description'));
      const batchResult = await embeddingService.embedBatch(entityTexts);

      // Calculate similarities
      vectorQueryResult.records.forEach((record, idx) => {
        const entityEmbedding = batchResult.embeddings[idx].embedding;
        const similarity = embeddingService.cosineSimilarity(
          queryEmbedding.embedding,
          entityEmbedding
        );

        vectorResults.set(record.get('id'), {
          entity: {
            id: record.get('id'),
            name: record.get('name'),
            aliases: record.get('aliases') || [],
            description: record.get('description'),
            type: record.get('type'),
            romanName: record.get('romanName'),
            domain: record.get('domain'),
            symbols: record.get('symbols'),
            sacredAnimals: record.get('sacredAnimals'),
            heroType: record.get('heroType'),
            origin: record.get('origin'),
            monsterType: record.get('monsterType'),
            abilities: record.get('abilities'),
            region: record.get('region'),
            locationType: record.get('locationType'),
          },
          similarity: similarity.similarity,
        });
      });

      console.log(`[hybridSearch] Vector search: ${vectorResults.size} entities compared`);
    }

    // Step 3: Combine and score results
    const combinedScores: Map<
      string,
      { entity: Entity; matchScore: number; keywordScore: number; vectorScore: number }
    > = new Map();

    // Add keyword results
    keywordResult.records.forEach((record) => {
      const id = record.get('id');
      const keywordScore = record.get('keywordScore');
      const vectorScore = vectorResults.has(id) ? vectorResults.get(id)!.similarity : 0;
      const combinedScore = keywordWeight * keywordScore + vectorWeight * vectorScore;

      combinedScores.set(id, {
        entity: {
          id,
          name: record.get('name'),
          aliases: record.get('aliases') || [],
          description: record.get('description'),
          type: record.get('type'),
          romanName: record.get('romanName'),
          domain: record.get('domain'),
          symbols: record.get('symbols'),
          sacredAnimals: record.get('sacredAnimals'),
          heroType: record.get('heroType'),
          origin: record.get('origin'),
          monsterType: record.get('monsterType'),
          abilities: record.get('abilities'),
          region: record.get('region'),
          locationType: record.get('locationType'),
        },
        matchScore: combinedScore,
        keywordScore,
        vectorScore,
      });
    });

    // Add vector-only results (not in keyword search)
    if (vectorWeight > 0) {
      vectorResults.forEach((value, id) => {
        if (!combinedScores.has(id)) {
          const keywordScore = 0;
          const vectorScore = value.similarity;
          const combinedScore = keywordWeight * keywordScore + vectorWeight * vectorScore;

          combinedScores.set(id, {
            entity: value.entity,
            matchScore: combinedScore,
            keywordScore,
            vectorScore,
          });
        }
      });
    }

    // Sort by combined score and limit
    const results = Array.from(combinedScores.values())
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
      .map((result) => ({
        entity: result.entity,
        matchScore: result.matchScore,
      }));

    const totalTime = Date.now() - startTime;
    console.log(`[hybridSearch] Complete: ${results.length} results in ${totalTime}ms`);

    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[hybridSearch] Error: ${errorMessage}`);
    throw new Error(`Hybrid search failed: ${errorMessage}`);
  } finally {
    await session.close();
  }
}

/**
 * List all available entity types.
 *
 * Returns the enum values of EntityType for UI filters.
 */
export async function listEntityTypes(): Promise<string[]> {
  return ['DEITY', 'HUMAN', 'MONSTER', 'PLACE'];
}

/**
 * List all entities with optional filtering.
 *
 * Returns paginated results sorted by name.
 * Useful for loading all entities into the graph display.
 */
export async function listEntities(
  _parent: any,
  args: {
    filters?: { types?: string[]; hasRelationships?: boolean };
    limit?: number;
  }
): Promise<{ edges: Entity[]; totalCount: number; hasNextPage: boolean }> {
  const session = getSession();
  const limit = Math.min(Math.floor(args.limit || 100), 1000);

  try {
    // Build Cypher query
    let countQuery = 'MATCH (e:Entity)';
    let fetchQuery = 'MATCH (e:Entity)';
    const params: any = { limit };

    // Apply filters
    if (args.filters?.types && args.filters.types.length > 0) {
      countQuery += ' WHERE e.type IN $types';
      fetchQuery += ' WHERE e.type IN $types';
      params.types = args.filters.types;
    }

    if (args.filters?.hasRelationships === true) {
      countQuery += ' WHERE EXISTS((e)-[]-())';
      fetchQuery += ' WHERE EXISTS((e)-[]-())';
    }

    // Count total matching entities
    const countResult = await session.run(`${countQuery} RETURN count(e) as total`, params);
    const totalCountRaw = countResult.records[0].get('total');
    const totalCount = typeof totalCountRaw === 'object' && totalCountRaw.toNumber
      ? totalCountRaw.toNumber()
      : totalCountRaw;

    // Fetch entities (fetch one extra to check if there are more)
    const fetchParams = {
      ...params,
      limitPlusOne: neo4j.int(limit + 1),
    };

    fetchQuery += `
      RETURN e.id as id, e.name as name, e.description as description, e.type as type,
             e.aliases as aliases, e.romanName as romanName, e.domain as domain,
             e.symbols as symbols, e.sacredAnimals as sacredAnimals, e.heroType as heroType,
             e.origin as origin, e.monsterType as monsterType, e.abilities as abilities,
             e.region as region, e.locationType as locationType
      ORDER BY e.name ASC
      LIMIT $limitPlusOne
    `;

    const result = await session.run(fetchQuery, fetchParams);

    // Check if there are more results
    const hasNextPage = result.records.length > limit;
    const records = hasNextPage ? result.records.slice(0, limit) : result.records;

    const entities: Entity[] = records.map((record) => ({
      id: record.get('id'),
      name: record.get('name'),
      aliases: record.get('aliases') || [],
      description: record.get('description'),
      type: record.get('type'),
      romanName: record.get('romanName'),
      domain: record.get('domain'),
      symbols: record.get('symbols'),
      sacredAnimals: record.get('sacredAnimals'),
      heroType: record.get('heroType'),
      origin: record.get('origin'),
      monsterType: record.get('monsterType'),
      abilities: record.get('abilities'),
      region: record.get('region'),
      locationType: record.get('locationType'),
    }));

    return {
      edges: entities,
      totalCount,
      hasNextPage,
    };
  } finally {
    await session.close();
  }
}

// ============================================================================
// Resolver Map
// ============================================================================

export const resolvers = {
  Query: {
    searchEntities,
    searchEntitiesByVector,
    hybridSearchEntities,
    getEntity,
    getRelationships,
    getMythById,
    getNearestPath,
    listEntityTypes,
    listEntities,
  },
  Entity: {
    __resolveType: (obj: any) => {
      switch (obj.type) {
        case 'DEITY':
          return 'Deity';
        case 'HUMAN':
          return 'Human';
        case 'MONSTER':
          return 'Monster';
        case 'PLACE':
          return 'Place';
        default:
          return 'Entity';
      }
    },
  },
};
