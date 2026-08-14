/**
 * 레이아웃 벤치마크 - 성능 측정 도구
 *
 * Dagre 레이아웃 계산 성능을 측정합니다.
 * 목표: avg <2초, p95 <2초
 */

import { layoutService, type GraphNode, type GraphEdge } from '@/app/services/layoutService';

export interface BenchmarkResult {
  avgTime: number;
  minTime: number;
  maxTime: number;
  p95Time: number;
  p99Time: number;
  iterations: number;
  nodeCount: number;
  edgeCount: number;
}

/**
 * 레이아웃 성능 벤치마크 실행
 * @param nodes 테스트 노드 배열
 * @param edges 테스트 엣지 배열
 * @param iterations 반복 횟수 (기본값: 10)
 * @returns 벤치마크 결과
 */
export async function benchmarkLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  iterations: number = 10
): Promise<BenchmarkResult> {
  const times: number[] = [];
  const service = layoutService;

  console.log(`[Benchmark] Starting with ${nodes.length} nodes, ${edges.length} edges`);

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      // Use bloom layout if available (faster for large graphs)
      if (nodes.length > 50 && service.computeBloomLayout) {
        service.computeBloomLayout(nodes);
      } else {
        service.computeLayout(nodes, edges);
      }
      const elapsed = performance.now() - start;
      times.push(elapsed);
      console.log(`[Benchmark] Iteration ${i + 1}: ${elapsed.toFixed(2)}ms`);
    } catch (error) {
      console.error(`[Benchmark] Iteration ${i + 1} failed:`, error);
      // Continue with next iteration even if one fails
    }
  }

  // 통계 계산
  if (times.length === 0) {
    console.error('[Benchmark] No successful iterations');
    return {
      avgTime: 0,
      minTime: 0,
      maxTime: 0,
      p95Time: 0,
      p99Time: 0,
      iterations,
      nodeCount: nodes.length,
      edgeCount: edges.length,
    };
  }

  times.sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = times[0] || 0;
  const max = times[times.length - 1] || 0;
  const p95 = times[Math.floor(times.length * 0.95)] || max;
  const p99 = times[Math.floor(times.length * 0.99)] || max;

  const result: BenchmarkResult = {
    avgTime: avg,
    minTime: min,
    maxTime: max,
    p95Time: p95,
    p99Time: p99,
    iterations,
    nodeCount: nodes.length,
    edgeCount: edges.length,
  };

  return result;
}

/**
 * 벤치마크 결과 포맷팅 및 로깅
 * @param result 벤치마크 결과
 */
export function logBenchmarkResult(result: BenchmarkResult): void {
  const goalMet = result.avgTime < 2000 && result.p95Time < 2000;
  const status = goalMet ? '✅ PASS' : '⚠️ WARNING';

  console.log(`
╔════════════════════════════════════════════════════════════╗
║                   📊 Layout Benchmark Results              ║
╠════════════════════════════════════════════════════════════╣
║ Nodes: ${result.nodeCount.toString().padStart(4)} | Edges: ${result.edgeCount.toString().padStart(4)} | Iterations: ${result.iterations.toString().padStart(2)}      ║
╠════════════════════════════════════════════════════════════╣
║ Average:  ${result.avgTime.toFixed(2).padStart(7)}ms  (목표: <2000ms) ${status === '✅ PASS' && result.avgTime < 2000 ? '✅' : '⚠️'}  ║
║ P95:      ${result.p95Time.toFixed(2).padStart(7)}ms  (목표: <2000ms) ${goalMet ? '✅' : '⚠️'}  ║
║ P99:      ${result.p99Time.toFixed(2).padStart(7)}ms                     ║
║ Min:      ${result.minTime.toFixed(2).padStart(7)}ms                     ║
║ Max:      ${result.maxTime.toFixed(2).padStart(7)}ms                     ║
╠════════════════════════════════════════════════════════════╣
║ Status: ${status.padEnd(51)}║
╚════════════════════════════════════════════════════════════╝
  `);
}

/**
 * 메모리 사용량 추정
 * @returns 현재 메모리 사용량 (MB)
 */
export function getMemoryUsage(): number {
  if (typeof window === 'undefined') {
    return 0;
  }
  const perf = performance as any;
  if (!perf.memory) {
    return 0;
  }
  return perf.memory.usedJSHeapSize / (1024 * 1024);
}

/**
 * 메모리 누수 테스트
 * 같은 레이아웃을 반복 계산하면서 메모리 증가를 모니터링합니다.
 * @param nodes 테스트 노드
 * @param edges 테스트 엣지
 * @param cycles 반복 사이클 수
 * @returns 메모리 사용량 변화
 */
export async function testMemoryLeak(
  nodes: GraphNode[],
  edges: GraphEdge[],
  cycles: number = 10
): Promise<{
  initialMemory: number;
  finalMemory: number;
  memoryIncrease: number;
  memoryIncreasePercent: number;
}> {
  const service = layoutService;
  const initialMemory = getMemoryUsage();

  console.log(
    `[Memory Test] Starting memory test. Initial: ${initialMemory.toFixed(2)}MB`
  );

  for (let i = 0; i < cycles; i++) {
    service.computeLayout(nodes, edges);
    // 가비지 컬렉션이 실행될 기회 제공
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  const finalMemory = getMemoryUsage();
  const memoryIncrease = finalMemory - initialMemory;
  const memoryIncreasePercent =
    initialMemory > 0 ? (memoryIncrease / initialMemory) * 100 : 0;

  console.log(`
[Memory Test] Results:
  Initial Memory: ${initialMemory.toFixed(2)}MB
  Final Memory:   ${finalMemory.toFixed(2)}MB
  Increase:       ${memoryIncrease.toFixed(2)}MB (${memoryIncreasePercent.toFixed(1)}%)
  `);

  return {
    initialMemory,
    finalMemory,
    memoryIncrease,
    memoryIncreasePercent,
  };
}

/**
 * 캐시 효율성 테스트
 * 첫 번째 계산 vs 캐시된 로드의 시간 차이를 측정합니다.
 * @param nodes 테스트 노드
 * @param edges 테스트 엣지
 * @param sessionId 테스트용 세션 ID
 * @returns 캐시 효율성 비교
 */
export async function testCacheEfficiency(
  nodes: GraphNode[],
  edges: GraphEdge[],
  sessionId: string = 'test-session'
): Promise<{
  firstComputeTime: number;
  cachedLoadTime: number;
  speedup: number;
}> {
  const service = layoutService;
  service.clearSession(sessionId);

  // 첫 번째 계산
  const start1 = performance.now();
  await service.getLayout(sessionId, nodes, edges);
  const firstComputeTime = performance.now() - start1;

  // 캐시된 로드
  const start2 = performance.now();
  await service.getLayout(sessionId, nodes, edges);
  const cachedLoadTime = performance.now() - start2;

  const speedup = firstComputeTime / cachedLoadTime;

  console.log(`
[Cache Efficiency] Results:
  First Compute:   ${firstComputeTime.toFixed(2)}ms
  Cached Load:     ${cachedLoadTime.toFixed(2)}ms
  Speedup:         ${speedup.toFixed(1)}x
  `);

  service.clearSession(sessionId);

  return {
    firstComputeTime,
    cachedLoadTime,
    speedup,
  };
}
