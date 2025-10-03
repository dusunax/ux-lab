"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@ux-lab/ui";
import { NodeData } from "./CustomNode";

interface NodePanelProps {
  selectedNode: NodeData | null;
  onUpdateNode: (nodeId: string, data: Partial<NodeData>) => void;
  onDeleteNode: (nodeId: string) => void;
}

export default function NodePanel({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
}: NodePanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<NodeData | null>(null);

  if (!selectedNode) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <div className="text-center text-gray-500">
          <p className="text-sm">노드를 선택하여 편집하세요</p>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    setEditData({ ...selectedNode });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editData) {
      onUpdateNode(selectedNode.id || "", editData);
      setIsEditing(false);
      setEditData(null);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const handleDelete = () => {
    if (selectedNode.id) {
      onDeleteNode(selectedNode.id);
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">노드 편집</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  라벨
                </label>
                <Input
                  value={editData?.label || ""}
                  onChange={(e) =>
                    setEditData((prev) =>
                      prev ? { ...prev, label: e.target.value } : null
                    )
                  }
                  placeholder="노드 라벨"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <Input
                  value={editData?.description || ""}
                  onChange={(e) =>
                    setEditData((prev) =>
                      prev ? { ...prev, description: e.target.value } : null
                    )
                  }
                  placeholder="노드 설명"
                />
              </div>
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleSave}>
                  저장
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel}>
                  취소
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">
                    {selectedNode.type === "screen" && "📱"}
                    {selectedNode.type === "component" && "🧩"}
                    {selectedNode.type === "action" && "⚡"}
                    {selectedNode.type === "decision" && "❓"}
                  </span>
                  <span className="font-semibold">{selectedNode.label}</span>
                </div>
                <p className="text-sm text-gray-600">
                  타입: {selectedNode.type}
                </p>
                {selectedNode.description && (
                  <p className="text-sm text-gray-500 mt-2">
                    {selectedNode.description}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleEdit}>
                  편집
                </Button>
                <Button size="sm" variant="danger" onClick={handleDelete}>
                  삭제
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
