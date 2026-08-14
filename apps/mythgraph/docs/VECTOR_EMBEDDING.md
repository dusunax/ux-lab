# Vector Embedding Service - MythGraph

Vector Semantic Search powered by OpenAI's text-embedding-3-small model.

## Overview

The Vector Embedding Service enables semantic search on MythGraph entities. Instead of keyword matching, it understands the meaning of queries and finds conceptually similar mythological entities.

**Example:** Query "king of gods" → Finds Zeus, Jupiter, and other deities with divine rule domains.

### Key Features

- **Semantic Understanding**: Natural language queries find conceptually related entities
- **Caching**: Automatic caching with node-cache (24-hour default TTL)
- **Cost Optimized**: Batch processing and caching to minimize API costs ($10-20/month)
- **High Performance**: Single query <200ms target (cached responses ~1ms)
- **Type-Safe**: Full TypeScript support

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  GraphQL Resolver: searchEntitiesByVector               │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        v                         v
  ┌──────────────┐          ┌──────────────┐
  │   Query Text │          │Entity Descs  │
  └──────┬───────┘          └────────┬─────┘
         │                           │
         └───────────┬───────────────┘
                     │
                     v
          ┌──────────────────────┐
          │ EmbeddingService     │
          │ - embedText()        │
          │ - embedBatch()       │
          │ - cosineSimilarity() │
          └──────┬───────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        v                 v
   ┌─────────┐      ┌──────────────┐
   │ OpenAI  │      │ NodeCache    │
   │ API     │      │ (Local)      │
   └─────────┘      └──────────────┘
```

## Installation

### 1. Environment Setup

Add to `.env.local`:

```bash
# OpenAI API
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_API_KEY_HERE

# Optional: Caching configuration
CACHE_TTL=86400                    # 24 hours (default)
EMBEDDING_BATCH_SIZE=100           # Batch size for API calls (default)
```

### 2. Dependencies

Already installed via package.json:
- `openai` - OpenAI API client
- `node-cache` - In-memory caching

## API Usage

### GraphQL Query

```graphql
query SearchByVector {
  searchEntitiesByVector(
    query: "king of gods and ruler of mount olympus"
    limit: 10
    threshold: 0.5
  ) {
    entity {
      id
      name
      description
      type
    }
    matchScore
  }
}
```

### Response Example

```json
{
  "data": {
    "searchEntitiesByVector": [
      {
        "entity": {
          "id": "zeus",
          "name": "Zeus",
          "description": "King of the gods, ruler of the sky and thunder",
          "type": "DEITY"
        },
        "matchScore": 0.892
      },
      {
        "entity": {
          "id": "jupiter",
          "name": "Jupiter",
          "description": "Roman equivalent of Zeus, king of the gods",
          "type": "DEITY"
        },
        "matchScore": 0.865
      }
    ]
  }
}
```

### Parameters

- **query** (required): Natural language search query
  - Examples: "warrior princess", "ruler of olympus", "monster with many heads"
  
- **limit** (optional): Maximum results to return
  - Default: 20
  - Range: 1-100
  
- **threshold** (optional): Minimum cosine similarity score [0-1]
  - Default: 0.5
  - Higher threshold = stricter matching
  - Lower threshold = more results but lower relevance

## Service API

### TypeScript Usage

```typescript
import { getEmbeddingService } from '@/src/server/services/embeddingService';

// Get singleton instance
const embedding = getEmbeddingService();

// Single text embedding
const result = await embedding.embedText('Zeus is the king of gods');
console.log(result.embedding);        // [0.002, -0.045, ...]
console.log(result.computeTime);      // 145ms
console.log(result.cached);           // false (first call)

// Batch embeddings (more cost-effective)
const batchResult = await embedding.embedBatch([
  'Athena goddess of wisdom',
  'Poseidon god of sea',
  'Hades god of underworld'
]);
console.log(batchResult.cacheHitRate); // 0.33 (1/3 cached)

// Semantic similarity
const sim = embedding.cosineSimilarity(
  result.embedding,
  batchResult.embeddings[0].embedding
);
console.log(sim.similarity);    // 0.756 (0-1 range)
console.log(sim.distance);      // 0.244 (1 - similarity)

// Cache statistics
console.log(embedding.getCacheStats());
// {
//   cacheHits: 5,
//   cacheMisses: 2,
//   total: 7,
//   hitRate: "71.43",
//   cachedKeys: 12
// }
```

## Performance

### Benchmarks

**Single Query (Cached):**
- Time: ~1-2ms
- Cost: ~$0.000002 (cached, no API call)

**Single Query (Uncached):**
- Time: ~150-250ms (API latency + processing)
- Cost: ~$0.00002 (API call)

**Batch Query (10 descriptions):**
- Time: ~200-300ms total
- Cost: ~$0.0002 (single batch API call)
- Speedup: ~3-5x more efficient than 10 individual calls

### SLA

- Single query (cached): **<10ms** target
- Single query (uncached): **<200ms** target ✓ (OpenAI API + processing)
- Batch query (p95): **<500ms**

### Cost Optimization

1. **Caching**: Avoids re-embedding identical queries
   - Default TTL: 24 hours
   - In-memory storage (resets on server restart)
   
2. **Batch Processing**: Multiple embeddings in single API call
   - ~30% cost reduction vs individual calls
   
3. **Pre-computed Embeddings**: (Future: Phase 2)
   - Store embeddings in Neo4j vector index
   - Eliminates runtime embedding computation

**Estimated Monthly Cost**: $10-20
- Assuming 1000-5000 unique searches/day
- High cache hit rate from repeated queries

## Error Handling

### Common Issues

**OPENAI_API_KEY not set**
```
Error: OPENAI_API_KEY environment variable is not set
```
Solution: Add `OPENAI_API_KEY=sk-proj-...` to `.env.local`

**Empty text**
```
Error: Text cannot be empty
```
Solution: Validate input before calling `embedText()`

**Vector dimension mismatch**
```
Error: Vector dimensions do not match
```
Solution: Ensure both vectors are from the same model (text-embedding-3-small)

**Rate limiting**
```
Error: 429 Too Many Requests
```
Solution: Implement backoff retry logic (exponential backoff recommended)

## Testing

### Unit Tests

```bash
# Run embedding service unit tests
npx ts-node src/server/services/__tests__/embeddingService.test.ts
```

Tests cover:
- Service initialization
- Cosine similarity calculations
- Text embedding with caching
- Batch embedding
- Semantic similarity ordering
- Error handling

### Integration Tests

```bash
# Run full integration tests (requires Neo4j + OPENAI_API_KEY)
npx ts-node scripts/test-embedding.ts
```

Tests cover:
- Neo4j data integration
- Actual entity searches
- Performance benchmarks
- Cache effectiveness

## Future Enhancements (Phase 2)

### 1. Neo4j Vector Index

Store pre-computed embeddings in Neo4j:

```cypher
# Create vector index
CREATE VECTOR INDEX entity_embeddings
FOR (e:Entity)
ON (e.embedding)
OPTIONS {
  indexConfig: {
    `vector.similarity_function`: 'cosine',
    `vector.dimensions`: 1536
  }
}

# Similarity search in Neo4j
CALL db.index.vector.queryNodes(
  'entity_embeddings',
  5,
  $query_embedding
) YIELD node, score
RETURN node, score
```

Benefits:
- No need to embed all entities at query time
- Faster similarity search (database-level)
- Better for large datasets (millions of entities)

### 2. Hybrid Search

Combine keyword + vector search:

```graphql
query HybridSearch {
  searchEntities(
    query: "zeus",
    mode: HYBRID,
    vectorWeight: 0.5,        # 50% semantic
    keywordWeight: 0.5         # 50% full-text
  ) {
    entity { id name }
    matchScore
  }
}
```

### 3. Redis for Distributed Caching

Replace node-cache with Redis:

```typescript
// Production setup
const redis = new Redis(process.env.REDIS_URL);
const cache = new RedisCache(redis);
```

Benefits:
- Shared cache across multiple servers
- Persistent cache across restarts
- Key expiration management

## Troubleshooting

### Service not initializing

```typescript
// Check if API key is accessible
console.log(process.env.OPENAI_API_KEY?.slice(0, 15) + '...');
```

### High latency on first query

This is normal:
- First query: ~150-250ms (OpenAI API + processing)
- Subsequent identical queries: ~1-2ms (cached)

### Cache not working

Check cache statistics:
```typescript
const service = getEmbeddingService();
console.log(service.getCacheStats());
// If hitRate is 0%, check:
// 1. Query text is identical (case-sensitive matching after trim)
// 2. Cache TTL hasn't expired (default: 24 hours)
```

## References

- [OpenAI Embeddings Documentation](https://platform.openai.com/docs/guides/embeddings)
- [text-embedding-3-small Model](https://platform.openai.com/docs/guides/embeddings/embedding-models)
- [Cosine Similarity](https://en.wikipedia.org/wiki/Cosine_similarity)
- [Vector Databases](https://platform.openai.com/docs/guides/embeddings/use-cases)

## License

MIT
