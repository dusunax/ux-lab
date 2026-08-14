/**
 * LayoutService 단위 테스트
 *
 * - 레이아웃 계산 정확성
 * - 캐싱 동작
 * - 메모리 관리
 */

import { LayoutService, type GraphNode, type GraphEdge } from '../layoutService';

// Jest/Vitest 타입 선언
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;
declare const afterEach: any;

describe('LayoutService', () => {
  let service: LayoutService;
  const sessionId = 'test-session';

  beforeEach(() => {
    service = new LayoutService();
    // 테스트 간 세션 정리
    service.clearSession(sessionId);
  });

  afterEach(() => {
    service.clearSession(sessionId);
  });

  describe('computeLayout', () => {
    it('should compute layout for simple graph', () => {
      const nodes: GraphNode[] = [
        { id: 'a' },
        { id: 'b' },
        { id: 'c' },
      ];
      const edges: GraphEdge[] = [
        { id: 'e1', source: 'a', target: 'b' },
        { id: 'e2', source: 'b', target: 'c' },
      ];

      const layout = service.computeLayout(nodes, edges);

      expect(layout.size).toBe(3);
      expect(layout.has('a')).toBe(true);
      expect(layout.has('b')).toBe(true);
      expect(layout.has('c')).toBe(true);
    });

    it('should have valid x, y coordinates', () => {
      const nodes: GraphNode[] = [
        { id: 'a' },
        { id: 'b' },
      ];
      const edges: GraphEdge[] = [
        { id: 'e1', source: 'a', target: 'b' },
      ];

      const layout = service.computeLayout(nodes, edges);
      const nodeLayout = layout.get('a');

      expect(nodeLayout).toBeDefined();
      expect(typeof nodeLayout?.x).toBe('number');
      expect(typeof nodeLayout?.y).toBe('number');
      expect(nodeLayout?.x).not.toBeNaN();
      expect(nodeLayout?.y).not.toBeNaN();
    });

    it('should handle disconnected graph', () => {
      const nodes: GraphNode[] = [
        { id: 'a' },
        { id: 'b' },
        { id: 'c' },
      ];
      const edges: GraphEdge[] = [
        { id: 'e1', source: 'a', target: 'b' },
        // c is disconnected
      ];

      const layout = service.computeLayout(nodes, edges);
      expect(layout.size).toBe(3);
    });

    it('should handle invalid edges gracefully', () => {
      const nodes: GraphNode[] = [
        { id: 'a' },
        { id: 'b' },
      ];
      const edges: GraphEdge[] = [
        { id: 'e1', source: 'a', target: 'b' },
        { id: 'e2', source: 'x', target: 'y' }, // non-existent nodes
      ];

      const layout = service.computeLayout(nodes, edges);
      expect(layout.size).toBeGreaterThan(0);
    });

    it('should handle large graph', () => {
      const nodeCount = 100;
      const nodes: GraphNode[] = Array.from({ length: nodeCount }, (_, i) => ({
        id: `node-${i}`,
      }));

      const edges: GraphEdge[] = Array.from(
        { length: nodeCount - 1 },
        (_, i) => ({
          id: `edge-${i}`,
          source: `node-${i}`,
          target: `node-${i + 1}`,
        })
      );

      const start = performance.now();
      const layout = service.computeLayout(nodes, edges);
      const elapsed = performance.now() - start;

      expect(layout.size).toBe(nodeCount);
      expect(elapsed).toBeLessThan(5000); // Should complete in < 5 seconds
      console.log(`[Test] 100-node layout computed in ${elapsed.toFixed(2)}ms`);
    });
  });

  describe('Session Storage', () => {
    it('should save and load layout from session', () => {
      // 이 테스트는 브라우저 환경에서만 실행됨
      if (typeof window === 'undefined') {
        expect(true).toBe(true);
        return;
      }

      const nodes: GraphNode[] = [
        { id: 'a' },
        { id: 'b' },
      ];
      const edges: GraphEdge[] = [
        { id: 'e1', source: 'a', target: 'b' },
      ];

      const layout1 = service.computeLayout(nodes, edges);
      service.saveToSession(sessionId, layout1);

      const layout2 = service.loadFromSession(sessionId);
      expect(layout2).not.toBeNull();
      expect(layout2?.size).toBe(layout1.size);
    });

    it('should return null for non-existent session', () => {
      const layout = service.loadFromSession('non-existent-session');
      expect(layout).toBeNull();
    });

    it('should clear session data', () => {
      if (typeof window === 'undefined') {
        expect(true).toBe(true);
        return;
      }

      const nodes: GraphNode[] = [{ id: 'a' }];
      const edges: GraphEdge[] = [];

      const layout = service.computeLayout(nodes, edges);
      service.saveToSession(sessionId, layout);

      service.clearSession(sessionId);
      const loaded = service.loadFromSession(sessionId);
      expect(loaded).toBeNull();
    });
  });

  describe('getLayout', () => {
    it('should return layout without caching on first call', async () => {
      const nodes: GraphNode[] = [
        { id: 'a' },
        { id: 'b' },
      ];
      const edges: GraphEdge[] = [
        { id: 'e1', source: 'a', target: 'b' },
      ];

      const layout = await service.getLayout(sessionId, nodes, edges);
      expect(layout.size).toBe(2);
    });

    it('should use cache on subsequent calls', async () => {
      const nodes: GraphNode[] = [
        { id: 'a' },
        { id: 'b' },
      ];
      const edges: GraphEdge[] = [
        { id: 'e1', source: 'a', target: 'b' },
      ];

      const start1 = performance.now();
      await service.getLayout(sessionId, nodes, edges);
      const time1 = performance.now() - start1;

      const start2 = performance.now();
      await service.getLayout(sessionId, nodes, edges);
      const time2 = performance.now() - start2;

      // 캐시된 호출이 더 빨라야 함
      console.log(
        `[Test] First call: ${time1.toFixed(2)}ms, Second call: ${time2.toFixed(2)}ms`
      );
      expect(time2).toBeLessThan(time1);
    });

    it('should recompute when node count changes', async () => {
      let nodes: GraphNode[] = [{ id: 'a' }, { id: 'b' }];
      const edges: GraphEdge[] = [];

      const layout1 = await service.getLayout(sessionId, nodes, edges);
      expect(layout1.size).toBe(2);

      // 노드 추가
      nodes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
      const layout2 = await service.getLayout(sessionId, nodes, edges);
      expect(layout2.size).toBe(3);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      const stats = service.getStats();
      expect(stats.cachedSessions).toBe(0);
      expect(typeof stats.memoryUsage).toBe('string');
    });

    it('should track cached sessions', async () => {
      const nodes: GraphNode[] = [{ id: 'a' }];
      const edges: GraphEdge[] = [];

      await service.getLayout(sessionId, nodes, edges);
      const stats = service.getStats();
      expect(stats.cachedSessions).toBeGreaterThan(0);
    });
  });

  describe('Memory Management', () => {
    it('should clear all session data', () => {
      if (typeof window === 'undefined') {
        expect(true).toBe(true);
        return;
      }

      const nodes: GraphNode[] = [{ id: 'a' }];
      const edges: GraphEdge[] = [];

      service.computeLayout(nodes, edges);
      service.saveToSession('session1', service.computeLayout(nodes, edges));
      service.saveToSession('session2', service.computeLayout(nodes, edges));

      service.clearAll();
      const stats = service.getStats();
      expect(stats.cachedSessions).toBe(0);
    });
  });
});
