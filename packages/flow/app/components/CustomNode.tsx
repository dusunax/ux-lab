"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Button, Card, CardContent } from "@ux-lab/ui";

export type NodeData = {
  label: string;
  type: "screen" | "component" | "action" | "decision";
  description?: string;
  color?: string;
};

const CustomNode = memo(({ data, selected }: NodeProps<NodeData>) => {
  const getNodeColor = (type: string) => {
    switch (type) {
      case "screen":
        return "bg-blue-100 border-blue-300 text-blue-800";
      case "component":
        return "bg-green-100 border-green-300 text-green-800";
      case "action":
        return "bg-purple-100 border-purple-300 text-purple-800";
      case "decision":
        return "bg-yellow-100 border-yellow-300 text-yellow-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "screen":
        return "📱";
      case "component":
        return "🧩";
      case "action":
        return "⚡";
      case "decision":
        return "❓";
      default:
        return "📄";
    }
  };

  return (
    <div
      className={`min-w-[200px] rounded-lg border-2 p-4 shadow-lg transition-all ${
        selected ? "ring-2 ring-primary-500" : ""
      } ${getNodeColor(data.type)}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-gray-400"
      />

      <div className="flex items-center space-x-2 mb-2">
        <span className="text-lg">{getNodeIcon(data.type)}</span>
        <span className="font-semibold text-sm">{data.label}</span>
      </div>

      {data.description && (
        <p className="text-xs text-gray-600 mb-3">{data.description}</p>
      )}

      <div className="flex space-x-1">
        <Button size="sm" variant="ghost" className="text-xs px-2 py-1">
          Edit
        </Button>
        <Button size="sm" variant="ghost" className="text-xs px-2 py-1">
          Delete
        </Button>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-white border-2 border-gray-400"
      />
    </div>
  );
});

CustomNode.displayName = "CustomNode";

export default CustomNode;
