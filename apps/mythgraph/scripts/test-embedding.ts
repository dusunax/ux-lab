#!/usr/bin/env node

/**
 * Integration Test Script for Vector Embedding Service
 *
 * Tests the embedding service with actual Neo4j data and measures performance.
 *
 * Usage:
 *   npx ts-node scripts/test-embedding.ts
 *
 * Prerequisites:
 *   - OPENAI_API_KEY environment variable set
 *   - Neo4j database running and accessible
 *   - Neo4j database populated with sample data
 */

import 'dotenv/config';
import { EmbeddingService } from '../src/server/services/embeddingService';
import { getSession } from '../src/server/neo4j';

// ============================================================================
// Test Configuration
// ============================================================================

const API_KEY = process.env.OPENAI_API_KEY;
const NEO4J_URI = process.env.NEO4J_URI || 'neo4j://localhost:7687';

if (!API_KEY) {
  console.error('ERROR: OPENAI_API_KEY environment variable is not set');
  process.exit(1);
}

// ============================================================================
// Test Functions
// ============================================================================

async function testEmbeddingServiceBasics() {
  console.log('\n=== Test 1: Embedding Service Basics ===\n');

  const service = new EmbeddingService(API_KEY);

  // Test 1.1: Single text embedding
  console.log('1.1: Single text embedding...');
  const startTime = Date.now();
  const result = await service.embedText('Zeus is the king of the gods');
  const elapsed = Date.now() - startTime;

  console.log(`  ✓ Embedding generated`);
  console.log(`  ✓ Dimension: ${result.embedding.length}`);
  console.log(`  ✓ Time: ${elapsed}ms`);
  console.log(`  ✓ Model: ${result.model}`);
  console.log(`  ✓ Cached: ${result.cached}`);

  // Test 1.2: Batch embeddings
  console.log('\n1.2: Batch embedding...');
  const batchTexts = [
    'Athena is the goddess of wisdom and strategy',
    'Poseidon is the god of the sea',
    'Hades is the god of the underworld',
    'Hera is the queen of the gods',
    'Apollo is the god of the sun and music',
  ];

  const batchStart = Date.now();
  const batchResult = await service.embedBatch(batchTexts);
  const batchElapsed = Date.now() - batchStart;

  console.log(`  ✓ Embedded ${batchResult.embeddings.length} texts`);
  console.log(`  ✓ Total time: ${batchElapsed}ms`);
  console.log(`  ✓ Average per text: ${(batchElapsed / batchResult.embeddings.length).toFixed(1)}ms`);
  console.log(`  ✓ Cache hit rate: ${(batchResult.cacheHitRate * 100).toFixed(1)}%`);

  // Test 1.3: Cache statistics
  console.log('\n1.3: Cache statistics...');
  const stats = service.getCacheStats();
  console.log(`  ✓ Cache hits: ${stats.cacheHits}`);
  console.log(`  ✓ Cache misses: ${stats.cacheMisses}`);
  console.log(`  ✓ Hit rate: ${stats.hitRate}%`);
  console.log(`  ✓ Cached keys: ${stats.cachedKeys}`);
}

async function testSemanticSimilarity() {
  console.log('\n=== Test 2: Semantic Similarity ===\n');

  const service = new EmbeddingService(API_KEY);

  const testPairs = [
    ['king of gods', 'ruler of olympus'],
    ['warrior princess', 'fighter queen'],
    ['god of thunder', 'storm deity'],
    ['kitchen utensil', 'pineapple'],
  ];

  console.log('Testing semantic similarity between concept pairs:\n');

  for (const [text1, text2] of testPairs) {
    const emb1 = await service.embedText(text1);
    const emb2 = await service.embedText(text2);
    const similarity = service.cosineSimilarity(emb1.embedding, emb2.embedding);

    const barLength = Math.round(similarity.similarity * 30);
    const bar = '█'.repeat(barLength) + '░'.repeat(30 - barLength);

    console.log(`"${text1}" vs "${text2}"`);
    console.log(`  Similarity: ${similarity.similarity.toFixed(3)} [${bar}]`);
    console.log();
  }
}

async function testNeo4jIntegration() {
  console.log('\n=== Test 3: Neo4j Integration ===\n');

  const session = getSession();

  try {
    // Fetch sample entities
    console.log('3.1: Fetching sample entities from Neo4j...');
    const result = await session.run(
      'MATCH (e:Entity) WHERE e.description IS NOT NULL RETURN e.name as name, e.description as description LIMIT 5'
    );

    if (result.records.length === 0) {
      console.log('  ⊘ No entities found in database. Skipping Neo4j integration test.');
      return;
    }

    console.log(`  ✓ Found ${result.records.length} entities with descriptions`);

    // Test embedding with actual data
    console.log('\n3.2: Embedding entity descriptions...');
    const service = new EmbeddingService(API_KEY);

    const entities = result.records.map((record) => ({
      name: record.get('name'),
      description: record.get('description'),
    }));

    for (const entity of entities) {
      const startTime = Date.now();
      const embedding = await service.embedText(entity.description);
      const elapsed = Date.now() - startTime;

      console.log(`  ✓ ${entity.name}`);
      console.log(`    Description: ${entity.description.substring(0, 50)}...`);
      console.log(`    Time: ${elapsed}ms, Cached: ${embedding.cached}`);
    }

    // Test vector search
    console.log('\n3.3: Semantic search simulation...');
    const queryText = 'king of gods and ruler of mount olympus';
    const queryEmbedding = await service.embedText(queryText);

    const similarities = entities.map((entity) => ({
      name: entity.name,
      description: entity.description,
      similarity: service.cosineSimilarity(
        queryEmbedding.embedding,
        (result.records.find((r) => r.get('name') === entity.name) as any)
      ).similarity,
    }));

    const sorted = similarities.sort((a, b) => b.similarity - a.similarity);

    console.log(`  Query: "${queryText}"\n`);
    for (const item of sorted) {
      console.log(`  ${item.name}: ${item.similarity.toFixed(3)}`);
    }
  } finally {
    await session.close();
  }
}

async function testPerformance() {
  console.log('\n=== Test 4: Performance Benchmarks ===\n');

  const service = new EmbeddingService(API_KEY);

  // Single query performance
  console.log('4.1: Single query performance...');
  const queryText = 'god of war and strategy';
  const singleStart = Date.now();
  await service.embedText(queryText);
  const singleTime = Date.now() - singleStart;

  console.log(`  Query: "${queryText}"`);
  console.log(`  Time: ${singleTime}ms`);
  console.log(`  Target SLA: <200ms`);
  console.log(`  Status: ${singleTime < 200 ? '✓ PASS' : '✗ FAIL'}`);

  // Batch performance with 20 descriptions
  console.log('\n4.2: Batch query performance (20 descriptions)...');
  const batchDescriptions = Array(20).fill(null).map((_, i) =>
    `Entity description number ${i + 1} with various details about mythological characters`
  );

  const batchStart = Date.now();
  const batchResult = await service.embedBatch(batchDescriptions);
  const batchTime = Date.now() - batchStart;

  console.log(`  Descriptions: ${batchDescriptions.length}`);
  console.log(`  Time: ${batchTime}ms`);
  console.log(`  Average per description: ${(batchTime / batchDescriptions.length).toFixed(1)}ms`);
  console.log(`  Cache hit rate: ${(batchResult.cacheHitRate * 100).toFixed(1)}%`);

  // Cache effectiveness
  console.log('\n4.3: Cache effectiveness...');
  const cachedText = 'Zeus king of gods';

  // First: cache miss
  const miss1Start = Date.now();
  const miss1Result = await service.embedText(cachedText);
  const missTime = Date.now() - miss1Start;

  // Second: cache hit
  const hit1Start = Date.now();
  await service.embedText(cachedText);
  const hitTime = Date.now() - hit1Start;

  console.log(`  First call (cache miss): ${missTime}ms`);
  console.log(`  Second call (cache hit): ${hitTime}ms`);
  console.log(`  Speedup: ${(missTime / hitTime).toFixed(1)}x`);

  const stats = service.getCacheStats();
  console.log(`  Overall cache hit rate: ${stats.hitRate}%`);
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  MythGraph Vector Embedding Service - Integration Tests       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  console.log(`\nConfiguration:`);
  console.log(`  NEO4J_URI: ${NEO4J_URI}`);
  console.log(`  OpenAI Key: ${API_KEY.substring(0, 15)}...`);

  try {
    await testEmbeddingServiceBasics();
    await testSemanticSimilarity();
    await testNeo4jIntegration();
    await testPerformance();

    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  All tests completed successfully! ✓                           ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n✗ Test failed:', error);
    process.exit(1);
  }
}

main();
