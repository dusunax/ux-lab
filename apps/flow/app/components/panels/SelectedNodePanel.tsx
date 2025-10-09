"use client";

import { useState } from "react";
import { ActionButton, InputField, Panel } from "../common/Panel";

interface SelectedNodePanelProps {
  node: any;
  onUpdateNode: (id: string, newId: string, data: any) => boolean;
  onDeleteNode: (id: string) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  onSave: () => void;
}

export const SelectedNodePanel = ({
  node,
  onUpdateNode,
  onDeleteNode,
  inputValue,
  setInputValue,
  onSave,
}: SelectedNodePanelProps) => {
  const [prevValue, setPrevValue] = useState(inputValue);

  const handleSave = () => {
    if (prevValue === inputValue) {
      return;
    }
    onSave();
    setPrevValue(inputValue);
  };

  return (
    <Panel title="Selected Node">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Node ID
          </label>
          <InputField
            value={node.id}
            onChange={(value) => {
              if (value.trim()) {
                onUpdateNode(node.id, value.trim(), node.data);
              }
            }}
            onBlur={handleSave}
            placeholder="Enter node ID"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Node Label
          </label>
          <InputField
            value={inputValue}
            onChange={(value) => {
              setInputValue(value);
              onUpdateNode(node.id, "", {
                ...node.data,
                label: value,
              });
            }}
            onBlur={handleSave}
            placeholder="Enter node label"
          />
        </div>
      </div>
      <ActionButton onClick={() => onDeleteNode(node.id)} variant="danger">
        Delete Node
      </ActionButton>
    </Panel>
  );
};
