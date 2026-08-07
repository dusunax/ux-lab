'use client';

/**
 * GraphDemo - MythGraph 데모 컴포넌트
 *
 * 테스트 데이터를 사용하여 MythGraph를 시연합니다.
 * 성능 측정 및 상호작용 테스트가 가능합니다.
 */

import React, { useState, useCallback } from 'react';
import { MythGraph } from './MythGraph';
import type { GraphNode, GraphEdge } from '@/app/services/layoutService';
import { benchmarkLayout, logBenchmarkResult } from '@/app/utils/layoutBenchmark';

/**
 * 테스트용 신화 그래프 데이터 생성
 */
function generateMythologyGraph(nodeCount: number = 10): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const deities = ['Zeus', 'Hera', 'Poseidon', 'Athena', 'Apollo', 'Artemis'];
  const heroes = ['Heracles', 'Perseus', 'Achilles', 'Theseus', 'Jason'];
  const places = ['Mount Olympus', 'Hades', 'Troy', 'Tartarus'];

  const entities = [...deities, ...heroes, ...places];
  const selectedEntities = entities.slice(0, Math.min(nodeCount, entities.length));

  const nodes: GraphNode[] = selectedEntities.map((name) => ({
    id: `entity_${name.toLowerCase().replace(' ', '_')}`,
    data: {
      label: name,
      type: deities.includes(name)
        ? 'deity'
        : heroes.includes(name)
          ? 'hero'
          : 'place',
    },
  }));

  // 관계 생성 (전체 노드의 70% 정도를 연결)
  const edges: GraphEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    if (Math.random() < 0.7) {
      edges.push({
        id: `edge_${i}_${i + 1}`,
        source: nodes[i].id,
        target: nodes[(i + 1) % nodes.length].id,
      });
    }
  }

  return { nodes, edges };
}

interface SelectedEntity {
  id: string;
  label: string;
}

/**
 * GraphDemo 컴포넌트
 */
export const GraphDemo: React.FC = () => {
  const sessionId = 'demo-session';
  const [nodeCount, setNodeCount] = useState(10);
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(
    null
  );
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<string>('');
  const [graphData, setGraphData] = useState(() =>
    generateMythologyGraph(nodeCount)
  );

  /**
   * 노드 개수 변경 시 새 그래프 생성
   */
  const handleNodeCountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value, 10);
    setNodeCount(count);
    setGraphData(generateMythologyGraph(count));
    setSelectedEntity(null);
  }, []);

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
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🏛️ MythGraph Demo</h1>
          <p className="text-gray-300">
            React Flow + Dagre 레이아웃 시연. 세션 고정 레이아웃으로 일관된 노드 위치 유지
          </p>
        </div>

        {/* 컨트롤 패널 */}
        <div className="bg-white/5 backdrop-blur border border-white/20 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 노드 개수 조절 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                노드 개수: {nodeCount}
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={nodeCount}
                onChange={handleNodeCountChange}
                className="w-full"
              />
            </div>

            {/* 벤치마크 버튼 */}
            <div>
              <button
                onClick={runBenchmark}
                disabled={isBenchmarking}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {isBenchmarking ? '실행 중...' : '📊 벤치마크 실행'}
              </button>
            </div>

            {/* 선택된 노드 정보 */}
            <div>
              {selectedEntity ? (
                <div className="bg-blue-600/20 border border-blue-400 rounded p-3">
                  <p className="text-sm text-gray-300 mb-1">선택된 노드:</p>
                  <p className="text-white font-semibold">{selectedEntity.label}</p>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">노드를 클릭하여 선택하세요</div>
              )}
            </div>
          </div>

          {/* 벤치마크 결과 */}
          {benchmarkResult && (
            <div className="mt-4 p-3 bg-green-600/20 border border-green-400 rounded">
              <p className="text-green-300 text-sm">{benchmarkResult}</p>
            </div>
          )}
        </div>

        {/* 그래프 */}
        <div className="bg-white/5 backdrop-blur border border-white/20 rounded-lg overflow-hidden">
          <MythGraph
            entities={graphData.nodes}
            relationships={graphData.edges}
            sessionId={sessionId}
            onNodeClick={handleNodeClick}
          />
        </div>

        {/* 통계 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur border border-white/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{graphData.nodes.length}</div>
            <div className="text-gray-400 text-sm mt-1">노드</div>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{graphData.edges.length}</div>
            <div className="text-gray-400 text-sm mt-1">엣지</div>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">
              {(graphData.edges.length / graphData.nodes.length).toFixed(1)}
            </div>
            <div className="text-gray-400 text-sm mt-1">평균 차수</div>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-400">{sessionId}</div>
            <div className="text-gray-400 text-sm mt-1">세션 ID</div>
          </div>
        </div>
      </div>
    </div>
  );
};
