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
import { filterValidSearchResults } from '@/app/utils/searchValidation';

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
    getRelationships(entityId: $entityId, limit: 50) {
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

/**
 * GraphQL 쿼리: 엔티티 검색 (Keyword search)
 */
const SEARCH_ENTITIES_QUERY = gql`
  query SearchEntities($query: String!, $limit: Int) {
    searchEntities(query: $query, limit: $limit) {
      entity {
        id
        name
        type
        description
      }
      matchScore
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
  // 고정 sessionId (hydration 오류 방지)
  const sessionId = 'neo4j-bloom-session';
  const [nodeCount, setNodeCount] = useState(20);
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>({
    nodes: [],
    edges: [],
  });

  // 검색 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // GraphQL query hooks
  const [listEntities, { loading: entitiesLoading }] = useLazyQuery(LIST_ENTITIES_QUERY);
  const [getRelationships] = useLazyQuery(GET_RELATIONSHIPS_QUERY);
  const [searchEntities] = useLazyQuery(SEARCH_ENTITIES_QUERY);

  /**
   * Neo4j에서 실제 엔티티를 로드
   */
  const loadEntitiesFromNeo4j = useCallback(async (count: number) => {
    setIsLoading(true);
    try {
      // Zeus를 포함하기 위해 최대 70개까지 로드
      const result = await listEntities({ variables: { limit: 70 } });

      if (result.data?.listEntities?.edges) {
        // GraphQL 배열을 수정 가능한 새 배열로 복사
        let gqlEntities: GraphQLEntity[] = [...result.data.listEntities.edges];

        // Zeus를 찾아서 앞으로 옮기기
        const zeusIndex = gqlEntities.findIndex((e) => e.name?.toLowerCase() === 'zeus');
        if (zeusIndex >= 0) {
          const zeus = gqlEntities.splice(zeusIndex, 1)[0];
          gqlEntities.unshift(zeus);
        }

        // 요청한 개수로 제한 (Zeus는 첫 번째에 있으므로 반드시 포함됨)
        gqlEntities = gqlEntities.slice(0, count);

        // 노드 크기는 고정, 텍스트 크기만 조정 (일반 글자 크기)
        const fixedNodeSize = { width: 90, height: 50 };

        // 엔티티를 GraphNode로 변환
        const nodes: GraphNode[] = gqlEntities.map((entity) => ({
          id: entity.id,
          data: {
            label: entity.name,
            type: entity.type.toLowerCase(),
            description: entity.description,
          },
          width: fixedNodeSize.width,
          height: fixedNodeSize.height,
        }));

        // 관계 로드 (모든 엔티티의 관계 수집)
        const relatedEdges: GraphEdge[] = [];
        // 모든 entity에 대해 관계 로드 (최대 70개)
        const entitiesToCheck = nodes.slice(0, Math.min(70, nodes.length));

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
            // 관계 로딩 실패는 무시 (선택적)
          }
        }

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
   * 검색 실행
   */
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const result = await searchEntities({
        variables: { query: searchQuery, limit: 50 },
      });

      if (result.data?.searchEntities) {
        const rawSearchResults = result.data.searchEntities;

        // 유효한 검색 결과만 필터링
        const validSearchResults = filterValidSearchResults(rawSearchResults);

        if (validSearchResults.length === 0) {
          setGraphData({ nodes: [], edges: [] });
          setNodeCount(0);
          return;
        }

        // 검색 결과를 그래프에 표시
        const nodes: GraphNode[] = validSearchResults.map((searchResult) => ({
          id: searchResult.entity.id,
          data: {
            label: searchResult.entity.name,
            type: searchResult.entity.type.toLowerCase(),
            description: searchResult.entity.description || '',
            matchScore: searchResult.matchScore,
          },
          width: 90,
          height: 50,
        }));

        // 검색 결과의 관계 로드
        const relatedEdges: GraphEdge[] = [];
        for (const node of nodes.slice(0, 20)) {
          try {
            const relResult = await getRelationships({
              variables: { entityId: node.id },
            });

            if (relResult.data?.getRelationships) {
              const relationships = relResult.data.getRelationships;
              for (const rel of relationships) {
                const sourceNodeId = rel.source.id;
                const targetNodeId = rel.target.id;

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
            // 관계 로딩 실패 무시
          }
        }

        setGraphData({ nodes, edges: relatedEdges });
        setNodeCount(nodes.length);
      }
    } catch (error) {
      console.error('검색 실패:', error);
      setGraphData({ nodes: [], edges: [] });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, searchEntities, getRelationships]);

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

        {/* 검색 패널 */}
        <div className="bg-myth-night/40 backdrop-blur border border-myth-slate rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 검색 입력 */}
            <div>
              <label className="block text-sm font-medium text-myth-secondary mb-2">
                🔍 신화 엔티티 검색
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="엔티티명 또는 설명으로 검색... (예: 제우스, 올림푸스)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  disabled={isSearching}
                  className="flex-1 bg-myth-abyss/50 border border-myth-slate rounded px-3 py-2 text-myth-primary placeholder-myth-muted focus:outline-none focus:border-myth-gold"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="bg-myth-gold hover:bg-myth-amber disabled:bg-myth-muted text-myth-abyss font-semibold py-2 px-6 rounded-lg transition"
                >
                  {isSearching ? '검색 중...' : '검색'}
                </button>
              </div>
            </div>

            {/* 검색 결과 수 */}
            <div className="flex items-end">
              {graphData.nodes.length > 0 && (
                <div className="text-sm text-myth-secondary">
                  ✅ {graphData.nodes.length}개 엔티티 찾음
                  {graphData.edges.length > 0 && ` • ${graphData.edges.length}개 관계`}
                </div>
              )}
            </div>
          </div>
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
