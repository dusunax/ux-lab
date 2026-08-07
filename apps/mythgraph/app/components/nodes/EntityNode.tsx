/* @ts-nocheck */
'use client';

/**
 * EntityNode - 그래프 노드 컴포넌트
 *
 * 신화 속 존재(신, 영웅, 괴물, 장소 등)를 나타내는 노드
 */

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';

interface EntityNodeData {
  label?: string;
  type?: string;
  icon?: string;
  description?: string;
}

type EntityNodeProps = NodeProps<EntityNodeData>;

/**
 * 엔티티 노드 - React Flow 커스텀 노드
 */
export const EntityNode = React.memo(({ data, selected }: EntityNodeProps) => {
  // 타입별 색상 및 아이콘
  const getNodeStyle = (type?: string) => {
    const typeStyles: Record<string, { bg: string; border: string; icon: string }> = {
      deity: {
        bg: 'from-amber-600 to-amber-700',
        border: 'border-amber-400',
        icon: '⚡',
      },
      hero: {
        bg: 'from-blue-600 to-blue-700',
        border: 'border-blue-400',
        icon: '🏹',
      },
      monster: {
        bg: 'from-red-600 to-red-700',
        border: 'border-red-400',
        icon: '🐉',
      },
      place: {
        bg: 'from-green-600 to-green-700',
        border: 'border-green-400',
        icon: '🏛️',
      },
      event: {
        bg: 'from-purple-600 to-purple-700',
        border: 'border-purple-400',
        icon: '📜',
      },
      default: {
        bg: 'from-slate-600 to-slate-700',
        border: 'border-slate-400',
        icon: '◯',
      },
    };

    return typeStyles[type?.toLowerCase() || 'default'] || typeStyles.default;
  };

  const style = getNodeStyle(data?.type);
  const icon = data?.icon || style.icon;
  const label = data?.label || 'Unknown';

  return (
    <div
      className={`
        px-4 py-2 rounded-lg shadow-lg
        bg-gradient-to-br ${style.bg}
        border-2 ${style.border}
        transition-all duration-200
        ${selected ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}
        text-white text-sm font-semibold text-center
        whitespace-nowrap
        cursor-pointer
      `}
      title={data?.description || label}
    >
      {/* 인풋 핸들 */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: 'rgba(255, 255, 255, 0.3)',
          border: '2px solid white',
        }}
      />

      {/* 노드 콘텐츠 */}
      <div className="flex items-center gap-1">
        <span className="text-lg">{icon}</span>
        <span className="truncate">{label}</span>
      </div>

      {/* 아웃풋 핸들 */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: 'rgba(255, 255, 255, 0.3)',
          border: '2px solid white',
        }}
      />
    </div>
  );
});

EntityNode.displayName = 'EntityNode';
