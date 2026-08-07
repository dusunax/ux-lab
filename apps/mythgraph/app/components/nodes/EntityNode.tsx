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
    const typeStyles: Record<string, { bg: string; bgHex: string; border: string; icon: string }> = {
      deity: {
        bg: 'from-[#D7B26D] to-[#A67C52]',
        bgHex: '#D7B26D',
        border: 'border-[#D7B26D]',
        icon: '⚡',
      },
      human: {
        bg: 'from-[#9BA1A8] to-[#7A8089]',
        bgHex: '#9BA1A8',
        border: 'border-[#9BA1A8]',
        icon: '🏹',
      },
      monster: {
        bg: 'from-[#8B3A3A] to-[#6B2A2A]',
        bgHex: '#8B3A3A',
        border: 'border-[#8B3A3A]',
        icon: '🐉',
      },
      place: {
        bg: 'from-[#5B8DBE] to-[#456A8F]',
        bgHex: '#5B8DBE',
        border: 'border-[#5B8DBE]',
        icon: '🏛️',
      },
      event: {
        bg: 'from-[#D39A39] to-[#A67C52]',
        bgHex: '#D39A39',
        border: 'border-[#D39A39]',
        icon: '📜',
      },
      default: {
        bg: 'from-[#6D727A] to-[#5A5F67]',
        bgHex: '#6D727A',
        border: 'border-[#6D727A]',
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
          background: style.bgHex,
          border: `2px solid ${style.bgHex}`,
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
          background: style.bgHex,
          border: `2px solid ${style.bgHex}`,
        }}
      />
    </div>
  );
});

EntityNode.displayName = 'EntityNode';
