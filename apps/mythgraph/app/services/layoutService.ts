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
    const nodeCount = nodes.length;

    // 노드 수에 따라 Dagre 설정 최적화
    // 큰 그래프는 더 빠른 알고리즘 사용
    const useOptimizedConfig = nodeCount > 50;

    // Dagre 그래프 생성
    const g = new Dagre.graphlib.Graph({
      rankdir: 'TB',
      compound: false, // 큰 그래프에서는 compound 비활성화
      marginx: useOptimizedConfig ? 5 : 0,
      marginy: useOptimizedConfig ? 5 : 0,
    });

    g.setDefaultEdgeLabel(() => ({}));

    // Dagre 설정 (그래프 크기별 최적화)
    if (useOptimizedConfig) {
      // 큰 그래프: rank separation 줄여서 속도 향상
      g.graph().rankSep = 30;
      g.graph().nodeSep = 30;
      g.graph().ranker = 'tight-tree'; // 더 빠른 ranker 알고리즘
    } else {
      // 작은 그래프: 시각적 품질 우선
      g.graph().rankSep = 50;
      g.graph().nodeSep = 50;
      g.graph().ranker = 'longest-path'; // 더 좋은 레이아웃 품질
    }

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
    } catch (e) {
      console.error('[Layout] Failed to save to session:', e);
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
   * Bloom (Radial) 레이아웃 - Zeus를 중심으로 방사형 배치 (개선)
   * @param nodes 그래프 노드 배열
   * @returns 레이아웃 정보 Map
   */
  computeBloomLayout(nodes: GraphNode[]): Map<string, LayoutNode> {
    const start = performance.now();

    // Zeus 찾기 (중심 노드)
    const centerNode = nodes.find(
      (n) => n.data?.label?.toLowerCase() === 'zeus' || n.id.toLowerCase().includes('zeus')
    );

    const layoutMap = new Map<string, LayoutNode>();
    const centerX = 0;
    const centerY = 0;

    if (!centerNode) {
      return this.computeFallbackBloomLayout(nodes);
    }

    // 중심 노드 (Zeus) 배치
    layoutMap.set(centerNode.id, {
      id: centerNode.id,
      x: centerX,
      y: centerY,
      width: this.NODE_WIDTH,
      height: this.NODE_HEIGHT,
    });

    // 주변 노드들을 동심원으로 배치 (더 큰 거리)
    const otherNodes = nodes.filter((n) => n.id !== centerNode.id);
    const totalNodes = otherNodes.length;

    // 더 큰 반지름으로 노드 배치
    const baseDistance = 350; // 첫 링의 거리 증가
    const ringDistanceIncrement = 250; // 각 링 사이 거리 증가

    // 단순한 원형 배치 (각 링당 8-12개)
    let nodeIndex = 0;
    let ringIdx = 0;

    while (nodeIndex < totalNodes) {
      const distance = baseDistance + ringIdx * ringDistanceIncrement;
      const nodesInThisRing = Math.min(8 + ringIdx * 4, totalNodes - nodeIndex);

      for (let posInRing = 0; posInRing < nodesInThisRing; posInRing++) {
        const node = otherNodes[nodeIndex];
        if (!node) break;

        const anglePerNode = (2 * Math.PI) / nodesInThisRing;
        const angle = posInRing * anglePerNode;

        const x = centerX + distance * Math.cos(angle);
        const y = centerY + distance * Math.sin(angle);

        layoutMap.set(node.id, {
          id: node.id,
          x,
          y,
          width: this.NODE_WIDTH,
          height: this.NODE_HEIGHT,
        });

        nodeIndex++;
      }

      ringIdx++;
    }

    return layoutMap;
  }

  /**
   * Bloom 레이아웃 실패 시 폴백
   */
  private computeFallbackBloomLayout(nodes: GraphNode[]): Map<string, LayoutNode> {
    const layoutMap = new Map<string, LayoutNode>();
    const centerX = 0;
    const centerY = 0;
    const radius = 150;
    const angleStep = (2 * Math.PI) / nodes.length;

    nodes.forEach((node, idx) => {
      const angle = idx * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      layoutMap.set(node.id, {
        id: node.id,
        x,
        y,
        width: this.NODE_WIDTH,
        height: this.NODE_HEIGHT,
      });
    });

    return layoutMap;
  }

  /**
   * Bloom 레이아웃 가져오기 (캐시 → 계산)
   */
  async getBloomLayout(
    sessionId: string,
    nodes: GraphNode[]
  ): Promise<Map<string, LayoutNode>> {
    // 1. 세션 캐시 확인
    const cached = this.loadFromSession(sessionId);
    if (cached && cached.size === nodes.length) {
      return cached;
    }

    // 2. 새 Bloom 레이아웃 계산
    const layout = this.computeBloomLayout(nodes);

    // 3. 세션 저장
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
