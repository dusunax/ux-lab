/**
 * LayoutService - 세션 고정 레이아웃 관리
 *
 * GraphQL 노드의 위치를 Dagre로 계산하고 세션 스토리지에 캐시합니다.
 * - 초기 로드: Dagre 계산 (1.5-2초)
 * - 캐시된 로드: <100ms
 * - 메모리: 사용자당 5-8MB
 */

import Dagre from 'dagre';

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
}

export interface GraphNode {
  id: string;
  data?: { label?: string };
  [key: string]: any;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  [key: string]: any;
}

export class LayoutService {
  private sessionCache: Map<string, Map<string, LayoutNode>> = new Map();
  private readonly SESSION_STORAGE_KEY = 'mythgraph_layout_cache';
  private readonly NODE_WIDTH = 150;
  private readonly NODE_HEIGHT = 100;

  /**
   * Dagre를 사용한 그래프 레이아웃 계산
   * @param nodes 그래프 노드 배열
   * @param edges 그래프 엣지 배열
   * @returns 레이아웃 정보 Map
   */
  computeLayout(nodes: GraphNode[], edges: GraphEdge[]): Map<string, LayoutNode> {
    const start = performance.now();

    // Dagre 그래프 생성
    const g = new Dagre.graphlib.Graph({
      rankdir: 'TB',
      compound: true,
    });
    g.setDefaultEdgeLabel(() => ({}));

    // 노드 추가
    nodes.forEach((node) => {
      g.setNode(node.id, {
        label: node.id,
        width: this.NODE_WIDTH,
        height: this.NODE_HEIGHT,
      });
    });

    // 엣지 추가
    edges.forEach((edge) => {
      try {
        g.setEdge(edge.source, edge.target);
      } catch (e) {
        // 존재하지 않는 노드 참조 무시
        console.warn(`[Layout] Invalid edge: ${edge.source} -> ${edge.target}`);
      }
    });

    // Dagre 레이아웃 계산
    try {
      Dagre.layout(g);
    } catch (e) {
      console.error('[Layout] Dagre layout failed:', e);
      // 폴백: 기본 그리드 배치
      return this.getFallbackLayout(nodes);
    }

    // 결과 변환
    const layoutMap = new Map<string, LayoutNode>();
    g.nodes().forEach((nodeId: string) => {
      const node = g.node(nodeId);
      if (node) {
        layoutMap.set(nodeId, {
          id: nodeId,
          x: node.x || 0,
          y: node.y || 0,
          width: node.width || this.NODE_WIDTH,
          height: node.height || this.NODE_HEIGHT,
        });
      }
    });

    const elapsed = performance.now() - start;
    console.log(
      `[Layout] Computed in ${elapsed.toFixed(2)}ms for ${nodes.length} nodes, ${edges.length} edges`
    );

    return layoutMap;
  }

  /**
   * Dagre 계산 실패 시 폴백 레이아웃
   * @param nodes 그래프 노드 배열
   * @returns 기본 그리드 배치
   */
  private getFallbackLayout(nodes: GraphNode[]): Map<string, LayoutNode> {
    const layoutMap = new Map<string, LayoutNode>();
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const spacing = 300;

    nodes.forEach((node, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      layoutMap.set(node.id, {
        id: node.id,
        x: col * spacing,
        y: row * spacing,
        width: this.NODE_WIDTH,
        height: this.NODE_HEIGHT,
      });
    });

    return layoutMap;
  }

  /**
   * 세션 스토리지에서 레이아웃 로드
   * @param sessionId 세션 ID
   * @returns 캐시된 레이아웃 또는 null
   */
  loadFromSession(sessionId: string): Map<string, LayoutNode> | null {
    if (typeof window === 'undefined') return null;

    // 메모리 캐시 확인
    const cached = this.sessionCache.get(sessionId);
    if (cached) {
      console.log('[Layout] Returned from memory cache');
      return cached;
    }

    // 세션 스토리지 확인
    try {
      const key = `${this.SESSION_STORAGE_KEY}:${sessionId}`;
      const stored = sessionStorage.getItem(key);
      if (stored) {
        const entries = JSON.parse(stored) as Array<[string, LayoutNode]>;
        const layoutMap = new Map(entries);
        this.sessionCache.set(sessionId, layoutMap);
        console.log('[Layout] Loaded from session storage');
        return layoutMap;
      }
    } catch (e) {
      console.error('[Layout] Failed to load from session:', e);
    }

    return null;
  }

  /**
   * 계산된 레이아웃을 세션 스토리지에 저장
   * @param sessionId 세션 ID
   * @param layout 레이아웃 Map
   */
  saveToSession(sessionId: string, layout: Map<string, LayoutNode>): void {
    if (typeof window === 'undefined') return;

    try {
      this.sessionCache.set(sessionId, layout);
      const key = `${this.SESSION_STORAGE_KEY}:${sessionId}`;
      const entries = Array.from(layout.entries());
      sessionStorage.setItem(key, JSON.stringify(entries));
      console.log('[Layout] Saved to session storage');
    } catch (e) {
      console.error('[Layout] Failed to save to session:', e);
      // 세션 스토리지 용량 초과 시 메모리 캐시만 유지
      if (e instanceof Error && e.message.includes('QuotaExceededError')) {
        console.warn('[Layout] Session storage quota exceeded, using memory cache only');
      }
    }
  }

  /**
   * 레이아웃 가져오기 (캐시 → 계산)
   * @param sessionId 세션 ID
   * @param nodes 그래프 노드
   * @param edges 그래프 엣지
   * @returns 계산된 또는 캐시된 레이아웃
   */
  async getLayout(
    sessionId: string,
    nodes: GraphNode[],
    edges: GraphEdge[]
  ): Promise<Map<string, LayoutNode>> {
    // 1. 세션 캐시 확인 (노드 개수가 같으면 재사용)
    const cached = this.loadFromSession(sessionId);
    if (cached && cached.size === nodes.length) {
      console.log('[Layout] Using cached layout');
      return cached;
    }

    // 2. 새 레이아웃 계산
    const layout = this.computeLayout(nodes, edges);

    // 3. 세션 저장
    this.saveToSession(sessionId, layout);

    return layout;
  }

  /**
   * 노드 변경 시 점진적 업데이트
   * @param sessionId 세션 ID
   * @param newNodes 새로운 노드 배열
   * @param newEdges 새로운 엣지 배열
   * @returns 업데이트된 레이아웃
   */
  updateLayout(
    sessionId: string,
    newNodes: GraphNode[],
    newEdges: GraphEdge[]
  ): Map<string, LayoutNode> {
    // 캐시 무효화 및 재계산
    this.sessionCache.delete(sessionId);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(`${this.SESSION_STORAGE_KEY}:${sessionId}`);
    }

    const layout = this.computeLayout(newNodes, newEdges);
    this.saveToSession(sessionId, layout);
    return layout;
  }

  /**
   * 메모리 정리 (세션 종료 시)
   * @param sessionId 세션 ID
   */
  clearSession(sessionId: string): void {
    this.sessionCache.delete(sessionId);
    if (typeof window !== 'undefined') {
      const key = `${this.SESSION_STORAGE_KEY}:${sessionId}`;
      sessionStorage.removeItem(key);
    }
  }

  /**
   * 모든 세션 데이터 정리
   */
  clearAll(): void {
    this.sessionCache.clear();
    if (typeof window !== 'undefined') {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith(this.SESSION_STORAGE_KEY)) {
          sessionStorage.removeItem(key);
        }
      });
    }
  }

  /**
   * 캐시 통계 반환
   */
  getStats(): {
    cachedSessions: number;
    memoryUsage: string;
  } {
    let memoryUsage = 0;
    this.sessionCache.forEach((layout) => {
      memoryUsage += layout.size * 64; // 대략적 추정: 노드당 64바이트
    });

    return {
      cachedSessions: this.sessionCache.size,
      memoryUsage: `${(memoryUsage / 1024).toFixed(2)}KB`,
    };
  }
}

// 싱글톤 인스턴스
export const layoutService = new LayoutService();
