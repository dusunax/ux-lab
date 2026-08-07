/**
 * GraphQL Query Resolvers for MythGraph
 *
 * Implements all Query resolver functions that interface with Neo4j.
 * Each resolver executes a Cypher query and transforms the results into
 * GraphQL response objects.
 */

import { getSession } from '../neo4j';

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
function nodeToEntity(record: any): Entity {
  const node = record.get(0) || record;
  return {
    id: node.properties.id,
    name: node.properties.name,
    aliases: node.properties.aliases || [],
    description: node.properties.description,
    type: node.properties.type,
    romanName: node.properties.romanName,
    domain: node.properties.domain,
    symbols: node.properties.symbols,
    sacredAnimals: node.properties.sacredAnimals,
    heroType: node.properties.heroType,
    origin: node.properties.origin,
    monsterType: node.properties.monsterType,
    abilities: node.properties.abilities,
    region: node.properties.region,
    locationType: node.properties.locationType,
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
  const limit = Math.min(args.limit || 20, 100);

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

    return result.records.map((record) => ({
      entity: nodeToEntity(record.get('node')),
      matchScore: record.get('score'),
    }));
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
  const limit = Math.min(args.limit || 50, 100);

  try {
    // For now, return empty relationships as we haven't created relationship nodes yet
    // This will be enhanced when relationship nodes are fully integrated

    let cypherQuery = `
      MATCH (source:Entity {id: $entityId})
      RETURN source
    `;

    const result = await session.run(cypherQuery, {
      entityId: args.entityId,
    });

    if (result.records.length === 0) {
      return [];
    }

    // Return empty array for now (relationships will be added in next phase)
    return [];
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
  const maxHops = Math.min(args.maxHops || 5, 10);

  try {
    const result = await session.run(
      `
      MATCH (source:Entity {id: $fromId})
      MATCH (target:Entity {id: $toId})
      MATCH p = shortestPath((source)-[*1..${maxHops}]-(target))
      RETURN p
      LIMIT 1
      `,
      { fromId: args.fromId, toId: args.toId }
    );

    if (result.records.length === 0) {
      return [];
    }

    // For now, return empty relationships as we haven't created full relationship structure
    // This will be enhanced when relationship nodes are fully integrated
    return [];
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

// ============================================================================
// Resolver Map
// ============================================================================

export const resolvers = {
  Query: {
    searchEntities,
    getEntity,
    getRelationships,
    getMythById,
    getNearestPath,
    listEntityTypes,
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
