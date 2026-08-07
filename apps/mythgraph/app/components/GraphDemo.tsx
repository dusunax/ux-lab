'use client';

/**
 * GraphDemo - MythGraph 데모 컴포넌트
 *
 * Neo4j에서 실제 신화 엔티티를 쿼리하여 그래프를 시연합니다.
 * 성능 측정 및 상호작용 테스트가 가능합니다.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useLazyQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { MythGraph } from './MythGraph';
import type { GraphNode, GraphEdge } from '@/app/services/layoutService';
import { benchmarkLayout, logBenchmarkResult } from '@/app/utils/layoutBenchmark';

/**
 * GraphQL 쿼리: 모든 엔티티 목록 조회
 */
const LIST_ENTITIES_QUERY = gql`
  query ListEntities($limit: Int!) {
    listEntities(limit: $limit) {
      edges {
        id
        name
        type
        description
        aliases
      }
      totalCount
      hasNextPage
    }
  }
`;

/**
 * GraphQL 쿼리: 엔티티의 관계 조회
 */
const GET_RELATIONSHIPS_QUERY = gql`
  query GetRelationships($entityId: ID!) {
    getRelationships(entityId: $entityId, limit: 20) {
      source {
        id
        name
      }
      target {
        id
        name
      }
      type
      label
    }
  }
`;

interface SelectedEntity {
  id: string;
  label: string;
}

interface GraphQLEntity {
  id: string;
  name: string;
  type: 'DEITY' | 'HUMAN' | 'MONSTER' | 'PLACE';
  description: string;
  aliases: string[];
}

/**
 * GraphDemo 컴포넌트
 */
export const GraphDemo: React.FC = () => {
  const sessionId = 'neo4j-bloom-session';
  const [nodeCount, setNodeCount] = useState(100);
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>({
    nodes: [],
    edges: [],
  });

  // GraphQL query hooks
  const [listEntities, { loading: entitiesLoading }] = useLazyQuery(LIST_ENTITIES_QUERY);
  const [getRelationships] = useLazyQuery(GET_RELATIONSHIPS_QUERY);

  /**
   * Neo4j에서 실제 엔티티를 로드
   */
  const loadEntitiesFromNeo4j = useCallback(async (count: number) => {
    setIsLoading(true);
    try {
      const result = await listEntities({ variables: { limit: count } });

      if (result.data?.listEntities?.edges) {
        const gqlEntities: GraphQLEntity[] = result.data.listEntities.edges;

        // 엔티티를 GraphNode로 변환
        const nodes: GraphNode[] = gqlEntities.map((entity) => ({
          id: `entity_${entity.id}`,
          data: {
            label: entity.name,
            type: entity.type.toLowerCase(),
            description: entity.description,
          },
        }));

        // 관계 로드 (모든 엔티티의 관계 수집)
        const relatedEdges: GraphEdge[] = [];
        const entitiesToCheck = nodes.slice(0, Math.min(50, nodes.length));

        for (const node of entitiesToCheck) {
          try {
            // Pass full entity ID (e.g., "entity_zeus_001")
            const relResult = await getRelationships({
              variables: { entityId: node.id },
            });

            if (relResult.data?.getRelationships) {
              const relationships = relResult.data.getRelationships;
              for (const rel of relationships) {
                // Source and target already include full IDs
                const sourceNodeId = rel.source.id;
                const targetNodeId = rel.target.id;

                // 두 노드가 모두 존재하면 엣지 추가
                if (
                  nodes.some((n) => n.id === sourceNodeId) &&
                  nodes.some((n) => n.id === targetNodeId)
                ) {
                  relatedEdges.push({
                    id: `edge_${rel.source.id}_${rel.target.id}_${rel.type}`,
                    source: sourceNodeId,
                    target: targetNodeId,
                    label: rel.label,
                  });
                }
              }
            }
          } catch (error) {
            console.warn(`Failed to load relationships for ${node.id}:`, error);
          }
        }

        console.log(
          `Loaded ${nodes.length} entities and ${relatedEdges.length} relationships from Neo4j`
        );

        setGraphData({ nodes, edges: relatedEdges });
      }
    } catch (error) {
      console.error('Failed to load entities from Neo4j:', error);
    } finally {
      setIsLoading(false);
    }
  }, [listEntities, getRelationships]);

  /**
   * 초기 로드
   */
  useEffect(() => {
    loadEntitiesFromNeo4j(nodeCount);
  }, []);

  /**
   * 노드 개수 변경 시 다시 로드
   */
  const handleNodeCountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value, 10);
    setNodeCount(count);
    loadEntitiesFromNeo4j(count);
    setSelectedEntity(null);
  }, [loadEntitiesFromNeo4j]);

  /**
   * 노드 클릭 핸들러
   */
  const handleNodeClick = useCallback(
    (nodeId: string, entity: GraphNode) => {
      setSelectedEntity({
        id: nodeId,
        label: entity.data?.label || nodeId,
      });
    },
    []
  );

  /**
   * 벤치마크 실행
   */
  const runBenchmark = useCallback(async () => {
    setIsBenchmarking(true);
    setBenchmarkResult('벤치마크 실행 중...');

    try {
      const result = await benchmarkLayout(graphData.nodes, graphData.edges, 10);
      logBenchmarkResult(result);
      setBenchmarkResult(
        `완료: ${result.avgTime.toFixed(2)}ms (avg), ${result.p95Time.toFixed(2)}ms (p95)`
      );
    } catch (error) {
      setBenchmarkResult(`오류: ${error}`);
    } finally {
      setIsBenchmarking(false);
    }
  }, [graphData]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-myth-abyss via-myth-night to-myth-slate p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-myth-primary mb-2">🏛️ MythGraph Demo</h1>
          <p className="text-myth-secondary">
            Neo4j에서 로드된 실제 신화 엔티티. React Flow + Dagre 레이아웃으로 시각화
          </p>
        </div>

        {/* 컨트롤 패널 */}
        <div className="bg-myth-night/40 backdrop-blur border border-myth-slate rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 노드 개수 조절 */}
            <div>
              <label className="block text-sm font-medium text-myth-secondary mb-2">
                노드 개수: {nodeCount}
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={nodeCount}
                onChange={handleNodeCountChange}
                disabled={isLoading}
                className="w-full"
              />
              {isLoading && <p className="text-xs text-gray-400 mt-1">로딩 중...</p>}
            </div>

            {/* 벤치마크 버튼 */}
            <div>
              <button
                onClick={runBenchmark}
                disabled={isBenchmarking || graphData.nodes.length === 0}
                className="w-full bg-myth-gold hover:bg-myth-amber disabled:bg-myth-muted text-myth-abyss font-semibold py-2 px-4 rounded-lg transition"
              >
                {isBenchmarking ? '실행 중...' : '📊 벤치마크 실행'}
              </button>
            </div>

            {/* 선택된 노드 정보 */}
            <div>
              {selectedEntity ? (
                <div className="bg-myth-gold/10 border border-myth-gold/30 rounded p-3">
                  <p className="text-sm text-myth-muted mb-1">선택된 노드:</p>
                  <p className="text-myth-primary font-semibold">{selectedEntity.label}</p>
                </div>
              ) : (
                <div className="text-myth-muted text-sm">노드를 클릭하여 선택하세요</div>
              )}
            </div>
          </div>

          {/* 벤치마크 결과 */}
          {benchmarkResult && (
            <div className="mt-4 p-3 bg-myth-gold/10 border border-myth-gold/30 rounded">
              <p className="text-myth-gold text-sm">{benchmarkResult}</p>
            </div>
          )}
        </div>

        {/* 그래프 */}
        {isLoading || entitiesLoading ? (
          <div className="bg-myth-night/40 backdrop-blur border border-myth-slate rounded-lg p-8 text-center">
            <p className="text-myth-secondary">Neo4j에서 엔티티를 로드 중...</p>
          </div>
        ) : graphData.nodes.length === 0 ? (
          <div className="bg-myth-night/40 backdrop-blur border border-myth-slate rounded-lg p-8 text-center">
            <p className="text-myth-muted">
              데이터 로드 실패. Neo4j 연결 상태를 확인하세요.
            </p>
          </div>
        ) : (
          <div className="bg-myth-night/40 backdrop-blur border border-myth-slate rounded-lg overflow-hidden">
            <MythGraph
              entities={graphData.nodes}
              relationships={graphData.edges}
              sessionId={sessionId}
              onNodeClick={handleNodeClick}
              useBloomLayout={true}
            />
          </div>
        )}

        {/* 통계 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-myth-night/40 backdrop-blur border border-myth-slate rounded-lg p-4">
            <div className="text-2xl font-bold text-myth-gold">{graphData.nodes.length}</div>
            <div className="text-myth-muted text-sm mt-1">노드 (Neo4j)</div>
          </div>
          <div className="bg-myth-night/40 backdrop-blur border border-myth-slate rounded-lg p-4">
            <div className="text-2xl font-bold text-myth-deity">{graphData.edges.length}</div>
            <div className="text-myth-muted text-sm mt-1">엣지 (Neo4j)</div>
          </div>
          <div className="bg-myth-night/40 backdrop-blur border border-myth-slate rounded-lg p-4">
            <div className="text-2xl font-bold text-myth-amber">
              {graphData.nodes.length > 0
                ? (graphData.edges.length / graphData.nodes.length).toFixed(1)
                : '0'}
            </div>
            <div className="text-myth-muted text-sm mt-1">평균 차수</div>
          </div>
          <div className="bg-myth-night/40 backdrop-blur border border-myth-slate rounded-lg p-4">
            <div className="text-2xl font-bold text-myth-bronze">{sessionId}</div>
            <div className="text-myth-muted text-sm mt-1">세션 ID</div>
          </div>
        </div>
      </div>
    </div>
  );
};
