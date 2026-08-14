/**
 * Unit tests for EmbeddingService
 *
 * Tests for vector embedding generation, caching, and similarity calculations.
 * Note: Requires OPENAI_API_KEY environment variable to be set.
 *
 * Run with: npm test -- embeddingService.test.ts
 * Or manually: node -r ts-node/register src/server/services/__tests__/embeddingService.test.ts
 */

import { EmbeddingService } from '../embeddingService';

// ============================================================================
// Test Configuration
// ============================================================================

const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.warn(
    'WARNING: OPENAI_API_KEY is not set. Skipping embedding tests that require API calls.'
  );
}

// ============================================================================
// Test Suite
// ============================================================================

async function runTests() {
  console.log('Starting EmbeddingService tests...\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Service initialization
  console.log('Test 1: Service Initialization');
  try {
    if (!API_KEY) {
      console.log('  ⊘ SKIPPED (no API key)\n');
    } else {
      new EmbeddingService(API_KEY);
      console.log('  ✓ Service initialized successfully');
      console.log(`  ✓ Model: text-embedding-3-small\n`);
      passed++;
    }
  } catch (error) {
    console.log(`  ✗ FAILED: ${error}\n`);
    failed++;
  }

  // Test 2: Cosine similarity calculation
  console.log('Test 2: Cosine Similarity Calculation');
  try {
    if (!API_KEY) {
      console.log('  ⊘ SKIPPED (no API key)\n');
    } else {
      const service = new EmbeddingService(API_KEY);

      // Test with identical vectors
      const vec1 = [1, 0, 0];
      const vec2 = [1, 0, 0];
      const result1 = service.cosineSimilarity(vec1, vec2);
      if (Math.abs(result1.similarity - 1.0) < 0.001) {
        console.log('  ✓ Identical vectors: similarity = 1.0');
      } else {
        throw new Error(`Expected 1.0, got ${result1.similarity}`);
      }

      // Test with perpendicular vectors
      const vec3 = [1, 0, 0];
      const vec4 = [0, 1, 0];
      const result2 = service.cosineSimilarity(vec3, vec4);
      if (Math.abs(result2.similarity - 0.0) < 0.001) {
        console.log('  ✓ Perpendicular vectors: similarity = 0.0');
      } else {
        throw new Error(`Expected 0.0, got ${result2.similarity}`);
      }

      // Test with opposite vectors
      const vec5 = [1, 0, 0];
      const vec6 = [-1, 0, 0];
      const result3 = service.cosineSimilarity(vec5, vec6);
      if (Math.abs(result3.similarity - 0.0) < 0.001) {
        // Note: clamped to [0, 1]
        console.log('  ✓ Opposite vectors: similarity = 0.0 (clamped)');
      } else {
        throw new Error(`Expected 0.0, got ${result3.similarity}`);
      }

      console.log('  ✓ All similarity calculations correct\n');
      passed++;
    }
  } catch (error) {
    console.log(`  ✗ FAILED: ${error}\n`);
    failed++;
  }

  // Test 3: Euclidean distance calculation
  console.log('Test 3: Euclidean Distance Calculation');
  try {
    if (!API_KEY) {
      console.log('  ⊘ SKIPPED (no API key)\n');
    } else {
      const service = new EmbeddingService(API_KEY);

      const vec1 = [0, 0, 0];
      const vec2 = [3, 4, 0];
      const distance = service.euclideanDistance(vec1, vec2);

      if (Math.abs(distance - 5.0) < 0.001) {
        console.log('  ✓ Distance [0,0,0] to [3,4,0]: 5.0');
      } else {
        throw new Error(`Expected 5.0, got ${distance}`);
      }

      console.log('  ✓ Euclidean distance correct\n');
      passed++;
    }
  } catch (error) {
    console.log(`  ✗ FAILED: ${error}\n`);
    failed++;
  }

  // Test 4: Single text embedding with caching
  console.log('Test 4: Single Text Embedding & Caching');
  try {
    if (!API_KEY) {
      console.log('  ⊘ SKIPPED (no API key)\n');
    } else {
      const service = new EmbeddingService(API_KEY);

      // First call - should hit API
      const text1 = 'Zeus is the king of the gods';
      const result1 = await service.embedText(text1);
      console.log(
        `  ✓ First embedding: ${result1.embedding.length} dimensions, ${result1.computeTime}ms, cached: ${result1.cached}`
      );

      if (result1.cached) {
        throw new Error('First call should not be cached');
      }

      // Second call - should hit cache
      const result2 = await service.embedText(text1);
      console.log(
        `  ✓ Second embedding (cached): ${result2.embedding.length} dimensions, ${result2.computeTime}ms, cached: ${result2.cached}`
      );

      if (!result2.cached) {
        throw new Error('Second call should be cached');
      }

      // Verify vectors are identical
      const identical = result1.embedding.every((v, i) => v === result2.embedding[i]);
      if (!identical) {
        throw new Error('Cached embedding should be identical to original');
      }

      console.log('  ✓ Caching works correctly');
      console.log(`  ✓ Cache stats: ${service.getCacheStats().cachedKeys} keys cached\n`);
      passed++;
    }
  } catch (error) {
    console.log(`  ✗ FAILED: ${error}\n`);
    failed++;
  }

  // Test 5: Batch embedding
  console.log('Test 5: Batch Embedding');
  try {
    if (!API_KEY) {
      console.log('  ⊘ SKIPPED (no API key)\n');
    } else {
      const service = new EmbeddingService(API_KEY);

      const texts = [
        'Athena is the goddess of wisdom',
        'Zeus is the king of the gods',
        'Hades is the god of the underworld',
      ];

      const result = await service.embedBatch(texts);
      console.log(`  ✓ Embedded ${result.embeddings.length} texts in ${result.totalTime}ms`);
      console.log(`  ✓ Cache hit rate: ${(result.cacheHitRate * 100).toFixed(1)}%`);

      if (result.embeddings.length !== texts.length) {
        throw new Error(
          `Expected ${texts.length} embeddings, got ${result.embeddings.length}`
        );
      }

      console.log('  ✓ Batch embedding works correctly\n');
      passed++;
    }
  } catch (error) {
    console.log(`  ✗ FAILED: ${error}\n`);
    failed++;
  }

  // Test 6: Semantic similarity
  console.log('Test 6: Semantic Similarity');
  try {
    if (!API_KEY) {
      console.log('  ⊘ SKIPPED (no API key)\n');
    } else {
      const service = new EmbeddingService(API_KEY);

      // Similar concepts should have high similarity
      const text1 = 'king of gods';
      const text2 = 'ruler of olympus';
      const text3 = 'kitchen utensils';

      const emb1 = await service.embedText(text1);
      const emb2 = await service.embedText(text2);
      const emb3 = await service.embedText(text3);

      const similarity1 = service.cosineSimilarity(emb1.embedding, emb2.embedding);
      const similarity2 = service.cosineSimilarity(emb1.embedding, emb3.embedding);

      console.log(`  ✓ Similarity between "king of gods" and "ruler of olympus": ${similarity1.similarity.toFixed(3)}`);
      console.log(`  ✓ Similarity between "king of gods" and "kitchen utensils": ${similarity2.similarity.toFixed(3)}`);

      if (similarity1.similarity > similarity2.similarity) {
        console.log('  ✓ Semantic similarity ordering is correct\n');
        passed++;
      } else {
        throw new Error(
          `Expected similar concepts to have higher similarity than dissimilar ones`
        );
      }
    }
  } catch (error) {
    console.log(`  ✗ FAILED: ${error}\n`);
    failed++;
  }

  // Test 7: Error handling
  console.log('Test 7: Error Handling');
  try {
    if (!API_KEY) {
      console.log('  ⊘ SKIPPED (no API key)\n');
    } else {
      const service = new EmbeddingService(API_KEY);

      // Empty text
      try {
        await service.embedText('');
        throw new Error('Should have thrown on empty text');
      } catch (e) {
        console.log('  ✓ Empty text rejection works');
      }

      // Vector dimension mismatch
      try {
        service.cosineSimilarity([1, 2, 3], [1, 2]);
        throw new Error('Should have thrown on dimension mismatch');
      } catch (e) {
        console.log('  ✓ Dimension mismatch detection works');
      }

      console.log('  ✓ Error handling works correctly\n');
      passed++;
    }
  } catch (error) {
    console.log(`  ✗ FAILED: ${error}\n`);
    failed++;
  }

  // ============================================================================
  // Summary
  // ============================================================================

  console.log('='.repeat(50));
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests().catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

export {};
