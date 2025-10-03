"use client";

import { Button, Card, CardContent } from "@ux-lab/ui";
import { Plus, Save, Download, Upload, Undo, Redo } from "lucide-react";

interface FlowToolbarProps {
  onAddNode: (type: "screen" | "component" | "action" | "decision") => void;
  onSave: () => void;
  onLoad: () => void;
  onExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function FlowToolbar({
  onAddNode,
  onSave,
  onLoad,
  onExport,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: FlowToolbarProps) {
  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900">UX Flow Designer</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Add:</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAddNode("screen")}
              className="text-xs"
            >
              📱 Screen
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAddNode("component")}
              className="text-xs"
            >
              🧩 Component
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAddNode("action")}
              className="text-xs"
            >
              ⚡ Action
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAddNode("decision")}
              className="text-xs"
            >
              ❓ Decision
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onUndo}
            disabled={!canUndo}
            className="text-xs"
          >
            <Undo className="w-4 h-4 mr-1" />
            Undo
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRedo}
            disabled={!canRedo}
            className="text-xs"
          >
            <Redo className="w-4 h-4 mr-1" />
            Redo
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-2" />
          <Button
            size="sm"
            variant="ghost"
            onClick={onSave}
            className="text-xs"
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onLoad}
            className="text-xs"
          >
            <Upload className="w-4 h-4 mr-1" />
            Load
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onExport}
            className="text-xs"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}
