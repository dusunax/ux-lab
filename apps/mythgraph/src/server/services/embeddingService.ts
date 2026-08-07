/**
 * OpenAI Vector Embedding Service for MythGraph
 *
 * Provides semantic text embedding using OpenAI's text-embedding-3-small model.
 * Implements caching with node-cache for cost optimization and performance.
 *
 * Environment Variables Required:
 * - OPENAI_API_KEY: OpenAI API key
 * - CACHE_TTL: Cache TTL in seconds (default: 86400 = 24 hours)
 * - EMBEDDING_BATCH_SIZE: Batch size for batch processing (default: 100)
 */

import { OpenAI } from 'openai';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const NodeCache = require('node-cache');

// ============================================================================
// Type Definitions
// ============================================================================

export interface EmbeddingResult {
  text: string;
  embedding: number[];
  model: string;
  cached: boolean;
  computeTime?: number; // milliseconds
}

export interface BatchEmbeddingResult {
  embeddings: EmbeddingResult[];
  totalTime: number; // milliseconds
  cacheHitRate: number; // 0-1
}

export interface VectorSimilarityResult {
  similarity: number; // 0-1 (cosine similarity)
  distance: number; // 0-1 (1 - similarity)
}

// ============================================================================
// EmbeddingService Class
// ============================================================================

export class EmbeddingService {
  private openai: OpenAI;
  private cache: any; // NodeCache instance
  private readonly MODEL = 'text-embedding-3-small';
  private readonly CACHE_TTL = parseInt(process.env.CACHE_TTL || '86400', 10); // 24 hours default
  private readonly BATCH_SIZE = parseInt(process.env.EMBEDDING_BATCH_SIZE || '100', 10);

  // Metrics
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required to initialize EmbeddingService');
    }

    this.openai = new OpenAI({ apiKey });
    this.cache = new NodeCache({ stdTTL: this.CACHE_TTL, useClones: true });

    console.log(
      `[EmbeddingService] Initialized with model=${this.MODEL}, cacheTTL=${this.CACHE_TTL}s, batchSize=${this.BATCH_SIZE}`
    );
  }

  /**
   * Generate cache key from text
   * Uses simple hash for consistency and determinism
   */
  private getCacheKey(text: string): string {
    // Create a simple hash of the text for cache key
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `embed:${Math.abs(hash).toString(36)}:${text.substring(0, 20)}`;
  }

  /**
   * Embed a single text string
   *
   * @param text - Text to embed
   * @returns EmbeddingResult with embedding vector and metadata
   * @throws Error if text is empty or OpenAI API call fails
   */
  async embedText(text: string): Promise<EmbeddingResult> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const trimmedText = text.trim();
    const cacheKey = this.getCacheKey(trimmedText);
    const startTime = Date.now();

    // Check cache first
    const cached = this.cache.get(cacheKey) as number[] | undefined;
    if (cached) {
      this.cacheHits++;
      const computeTime = Date.now() - startTime;
      console.log(
        `[EmbeddingService] Cache hit for "${trimmedText.substring(0, 30)}..." (${computeTime}ms)`
      );
      return {
        text: trimmedText,
        embedding: cached,
        model: this.MODEL,
        cached: true,
        computeTime,
      };
    }

    this.cacheMisses++;

    try {
      // Call OpenAI API
      const response = await this.openai.embeddings.create({
        model: this.MODEL,
        input: trimmedText,
      });

      const embedding = response.data[0].embedding;
      this.cache.set(cacheKey, embedding);

      const computeTime = Date.now() - startTime;
      console.log(
        `[EmbeddingService] API call for "${trimmedText.substring(0, 30)}..." (${computeTime}ms)`
      );

      return {
        text: trimmedText,
        embedding,
        model: this.MODEL,
        cached: false,
        computeTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to embed text: ${errorMessage}`);
    }
  }

  /**
   * Embed multiple texts in batch mode
   *
   * This is more cost-effective than individual API calls for multiple texts.
   * Uses batching to reduce API calls.
   *
   * @param texts - Array of texts to embed
   * @returns BatchEmbeddingResult with all embeddings and cache metrics
   * @throws Error if texts array is empty or API call fails
   */
  async embedBatch(texts: string[]): Promise<BatchEmbeddingResult> {
    if (!texts || texts.length === 0) {
      throw new Error('Texts array cannot be empty');
    }

    const startTime = Date.now();
    const uniqueTexts = Array.from(new Set(texts.map((t) => t.trim())));
    const results: EmbeddingResult[] = [];
    const textsToFetch: string[] = [];
    const textsToFetchIndices: number[] = [];

    // Check cache for all texts
    for (const text of uniqueTexts) {
      const cacheKey = this.getCacheKey(text);
      const cached = this.cache.get(cacheKey) as number[] | undefined;

      if (cached) {
        this.cacheHits++;
        results.push({
          text,
          embedding: cached,
          model: this.MODEL,
          cached: true,
        });
      } else {
        this.cacheMisses++;
        textsToFetch.push(text);
        textsToFetchIndices.push(results.length);
        results.push({} as EmbeddingResult);
      }
    }

    // Fetch uncached texts in batches
    if (textsToFetch.length > 0) {
      try {
        const response = await this.openai.embeddings.create({
          model: this.MODEL,
          input: textsToFetch,
        });

        // Map API results back to results array
        response.data.forEach((item) => {
          const text = textsToFetch[item.index];
          const cacheKey = this.getCacheKey(text);
          this.cache.set(cacheKey, item.embedding);

          const resultIndex = textsToFetchIndices[item.index];
          results[resultIndex] = {
            text,
            embedding: item.embedding,
            model: this.MODEL,
            cached: false,
          };
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to embed batch: ${errorMessage}`);
      }
    }

    const totalTime = Date.now() - startTime;
    const cacheHitRate = this.cacheHits / (this.cacheHits + this.cacheMisses);

    console.log(
      `[EmbeddingService] Batch complete: ${results.length} embeddings in ${totalTime}ms (cache hit rate: ${(cacheHitRate * 100).toFixed(1)}%)`
    );

    return {
      embeddings: results,
      totalTime,
      cacheHitRate,
    };
  }

  /**
   * Calculate cosine similarity between two vectors
   *
   * Cosine similarity is a measure of similarity between two non-zero vectors
   * that measures the cosine of the angle between them.
   * Range: -1 to 1, where 1 means identical direction
   *
   * For normalized embeddings (which OpenAI provides), the range is typically [0, 1]
   *
   * @param vec1 - First vector
   * @param vec2 - Second vector
   * @returns VectorSimilarityResult with similarity and distance metrics
   * @throws Error if vectors have different lengths or are empty
   */
  cosineSimilarity(vec1: number[], vec2: number[]): VectorSimilarityResult {
    if (!vec1 || !vec2) {
      throw new Error('Both vectors must be provided');
    }

    if (vec1.length !== vec2.length) {
      throw new Error(
        `Vector dimensions do not match: ${vec1.length} vs ${vec2.length}`
      );
    }

    if (vec1.length === 0) {
      throw new Error('Vectors cannot be empty');
    }

    // Calculate dot product
    const dotProduct = vec1.reduce((sum, a, i) => sum + a * vec2[i], 0);

    // Calculate magnitudes
    const mag1 = Math.sqrt(vec1.reduce((sum, a) => sum + a * a, 0));
    const mag2 = Math.sqrt(vec2.reduce((sum, a) => sum + a * a, 0));

    // Avoid division by zero
    if (mag1 === 0 || mag2 === 0) {
      return {
        similarity: 0,
        distance: 1,
      };
    }

    const similarity = dotProduct / (mag1 * mag2);

    return {
      similarity: Math.max(0, Math.min(1, similarity)), // Clamp to [0, 1]
      distance: 1 - Math.max(0, Math.min(1, similarity)),
    };
  }

  /**
   * Calculate Euclidean distance between two vectors
   *
   * Lower distance means more similar vectors.
   *
   * @param vec1 - First vector
   * @param vec2 - Second vector
   * @returns Distance as a number
   */
  euclideanDistance(vec1: number[], vec2: number[]): number {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same length');
    }

    const sumOfSquares = vec1.reduce((sum, a, i) => {
      const diff = a - vec2[i];
      return sum + diff * diff;
    }, 0);

    return Math.sqrt(sumOfSquares);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? (this.cacheHits / total) * 100 : 0;

    return {
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      total,
      hitRate: hitRate.toFixed(2),
      cachedKeys: this.cache.keys().length,
    };
  }

  /**
   * Clear the cache manually
   */
  clearCache() {
    this.cache.flushAll();
    console.log('[EmbeddingService] Cache cleared');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let embeddingServiceInstance: EmbeddingService | null = null;

/**
 * Get or create the singleton EmbeddingService instance
 *
 * @returns EmbeddingService instance
 * @throws Error if OPENAI_API_KEY is not set
 */
export function getEmbeddingService(): EmbeddingService {
  if (!embeddingServiceInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    embeddingServiceInstance = new EmbeddingService(apiKey);
  }
  return embeddingServiceInstance;
}
