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

import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Connection,
  addEdge,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { layoutService, type GraphNode, type GraphEdge } from '@/app/services/layoutService';
import { EntityNode } from './nodes/EntityNode';

// 커스텀 노드 타입
const nodeTypes: NodeTypes = {
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
export const MythGraph = React.memo(
  ({
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

        const positionedEdges: Edge[] = graphEdges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          animated: false,
          style: {
            stroke: '#D7B26D',
            strokeWidth: 1.5,
            opacity: 0.6,
          },
        }));

        setNodes(positionedNodes);
        setEdges(positionedEdges);

        // 레이아웃 통계 로깅
        const stats = layoutService.getStats();
        console.log('[MythGraph] Layout applied:', stats);
      } catch (error) {
        console.error('[MythGraph] Failed to apply layout:', error);
      } finally {
        setIsLayouting(false);
      }
    }, [entities, relationships, sessionId, useBloomLayout, setNodes, setEdges]);

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
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          nodeTypes={nodeTypes}
          fitView
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
  }
);

MythGraph.displayName = 'MythGraph';
