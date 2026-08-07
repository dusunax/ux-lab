/* @ts-nocheck */
'use client';

/**
 * MythGraph 컴포넌트
 *
 * React Flow 기반의 대화형 그래프 시각화
 * - 세션 고정 레이아웃 (Dagre)
 * - 드래그 앤 드롭 지원
 * - 줌/패닝 기능
 * - 로딩 상태 표시
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Background,
  Controls,
  MiniMap,
  Connection,
  addEdge,
  NodeTypes,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { layoutService, type GraphNode, type GraphEdge } from '@/app/services/layoutService';
import { EntityNode } from './nodes/EntityNode';

// 커스텀 노드 타입 (컴포넌트 외부에서 정의)
const NODE_TYPES: NodeTypes = {
  entity: EntityNode,
};

export interface MythGraphProps {
  entities: GraphNode[];
  relationships: GraphEdge[];
  sessionId: string;
  onNodeClick?: (nodeId: string, entity: GraphNode) => void;
  onEdgeClick?: (edgeId: string) => void;
  loading?: boolean;
  useBloomLayout?: boolean;
}

/**
 * MythGraph 컴포넌트
 * React Flow + Dagre를 사용한 세션 고정 레이아웃
 */
const GraphViewWrapper = ({
  entities,
  relationships,
  sessionId,
  onNodeClick,
  onEdgeClick,
  loading = false,
  useBloomLayout = false,
}: MythGraphProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isLayouting, setIsLayouting] = useState(false);
  const layoutTimeoutRef = useRef<NodeJS.Timeout>();
  const { fitView } = useReactFlow();
  const memoizedNodeTypes = useMemo(() => NODE_TYPES, []);

    /**
     * 레이아웃 적용
     */
    const applyLayout = useCallback(async () => {
      setIsLayouting(true);
      try {
        // 그래프 데이터 준비
        const graphEdges = relationships.map((rel, idx) => ({
          id: rel.id || `edge-${idx}`,
          source: rel.source,
          target: rel.target,
        }));

        // LayoutService에서 세션 레이아웃 가져오기
        const layout = useBloomLayout
          ? await layoutService.getBloomLayout(sessionId, entities)
          : await layoutService.getLayout(sessionId, entities, graphEdges);

        // 노드에 계산된 위치 적용
        const positionedNodes: Node[] = entities.map((entity) => {
          const layoutNode = layout.get(entity.id);
          return {
            id: entity.id,
            data: {
              label: entity.data?.label || entity.id,
              ...entity.data,
            },
            position: {
              x: layoutNode?.x || 0,
              y: layoutNode?.y || 0,
            },
            type: 'entity',
            draggable: true,
          };
        });

        const positionedEdges: Edge[] = graphEdges.map((edge) => {
          // GraphQL에서 받은 label이 있으면 사용, 없으면 edge 정보 사용
          const label = relationships.find(
            (r) => r.source === edge.source && r.target === edge.target
          )?.label || '';

          return {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: label,
            labelStyle: {
              fill: '#D7B26D',
              fontSize: '11px',
              fontWeight: '600',
              backgroundColor: 'rgba(10, 13, 17, 0.8)',
              padding: '2px 6px',
              borderRadius: '4px',
            },
            animated: false,
            style: {
              stroke: '#D7B26D',
              strokeWidth: 1.5,
              opacity: 0.6,
            },
            markerEnd: {
              type: 'arrowclosed',
              color: '#D7B26D',
            },
            type: 'default',
          };
        });

        setNodes(positionedNodes);
        setEdges(positionedEdges);

        // 전체 노드가 화면에 보이도록 fitView 호출
        setTimeout(() => {
          fitView({ padding: 0.15, minZoom: 0.1, maxZoom: 1.5 });
        }, 100);
      } catch (error) {
        console.error('[MythGraph] Failed to apply layout:', error);
      } finally {
        setIsLayouting(false);
      }
    }, [entities, relationships, sessionId, useBloomLayout, setNodes, setEdges, fitView]);

    /**
     * 초기 로드 및 의존성 변경 시 레이아웃 적용
     */
    useEffect(() => {
      // 약간의 지연을 추가하여 DOM 렌더링을 기다림
      layoutTimeoutRef.current = setTimeout(() => {
        applyLayout();
      }, 50);

      return () => {
        if (layoutTimeoutRef.current) {
          clearTimeout(layoutTimeoutRef.current);
        }
      };
    }, [applyLayout, sessionId]);

    /**
     * 언마운트 시 메모리 정리
     */
    useEffect(() => {
      return () => {
        layoutService.clearSession(sessionId);
      };
    }, [sessionId]);

    /**
     * 물리 효과: 노드 드래그 시 연결된 노드를 부드럽게 당김 (Spring Physics)
     */
    const handleNodesChangeWithPhysics = useCallback(
      (changes: any) => {
        // 드래그 중인 노드 찾기
        const draggingNode = nodes.find((n) => {
          const change = changes.find((c: any) => c.id === n.id);
          return change && change.dragging === true;
        });

        if (draggingNode && draggingNode.position) {
          // 드래그되는 노드와 연결된 모든 노드 찾기
          const connectedNodeIds = edges
            .filter((e) => e.source === draggingNode.id || e.target === draggingNode.id)
            .map((e) => (e.source === draggingNode.id ? e.target : e.source));

          // 연결된 노드들을 끌어당기기
          const newChanges = changes.map((change: any) => {
            if (connectedNodeIds.includes(change.id) && change.position) {
              const dx = draggingNode.position.x - change.position.x;
              const dy = draggingNode.position.y - change.position.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance > 0) {
                // 거리 기반 끌림 강도
                const pullStrength = Math.min(0.15, 50 / distance);

                return {
                  ...change,
                  position: {
                    x: change.position.x + dx * pullStrength,
                    y: change.position.y + dy * pullStrength,
                  },
                };
              }
            }
            return change;
          });

          onNodesChange(newChanges);
        } else {
          onNodesChange(changes);
        }
      },
      [nodes, edges, onNodesChange]
    );

    /**
     * 노드 클릭 핸들러
     */
    const handleNodeClick = useCallback(
      (_event: React.MouseEvent, node: Node) => {
        const entity = entities.find((e) => e.id === node.id);
        if (entity && onNodeClick) {
          onNodeClick(node.id, entity);
        }
      },
      [entities, onNodeClick]
    );

    /**
     * 엣지 클릭 핸들러
     */
    const handleEdgeClick = useCallback(
      (_event: React.MouseEvent, edge: Edge) => {
        if (onEdgeClick) {
          onEdgeClick(edge.id);
        }
      },
      [onEdgeClick]
    );

    /**
     * 새 엣지 연결 핸들러
     */
    const handleConnect = useCallback(
      (connection: Connection) => {
        setEdges((eds) => addEdge(connection, eds));
      },
      [setEdges]
    );

    return (
      <div
        className="w-full relative"
        style={{
          height: '600px',
          position: 'relative',
          background: 'linear-gradient(135deg, #0A0D11 0%, #12161D 50%, #1B212A 100%)',
        }}
      >
        {/* 로딩 오버레이 */}
        {(isLayouting || loading) && (
          <div
            className="absolute inset-0 flex items-center justify-center z-50"
            style={{
              background: 'rgba(10, 13, 17, 0.7)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div
              className="bg-myth-night/40 backdrop-blur border border-myth-slate rounded-lg p-6"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-myth-gold border-t-transparent rounded-full" />
                <span className="text-myth-primary font-medium">그래프 레이아웃 계산 중...</span>
              </div>
            </div>
          </div>
        )}

        {/* React Flow */}
        {/* @ts-ignore */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChangeWithPhysics}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          nodeTypes={memoizedNodeTypes}
        >
          {/* 배경 패턴 */}
          <Background
            color="#6D727A"
            gap={16}
            size={0.5}
            style={{
              backgroundColor: 'transparent',
            }}
          />

          {/* 컨트롤 */}
          <Controls
            style={{
              button: {
                background: 'rgba(215, 178, 109, 0.15)',
                border: '1px solid rgba(215, 178, 109, 0.3)',
                color: '#F6F1E7',
              },
            }}
          />

          {/* 미니맵 */}
          {nodes.length > 20 && (
            <MiniMap
              style={{
                background: 'rgba(10, 13, 17, 0.6)',
                border: '1px solid rgba(215, 178, 109, 0.3)',
              }}
              maskColor="rgba(10, 13, 17, 0.5)"
            />
          )}
        </ReactFlow>
      </div>
    );
};

const MemoizedGraphViewWrapper = React.memo(GraphViewWrapper);

// ReactFlow useReactFlow 훅을 사용하기 위해 ReactFlowProvider로 감싸야 함
export const MythGraph = React.memo(
  (props: MythGraphProps) => (
    <ReactFlowProvider>
      <MemoizedGraphViewWrapper {...props} />
    </ReactFlowProvider>
  )
);

MythGraph.displayName = 'MythGraph';
