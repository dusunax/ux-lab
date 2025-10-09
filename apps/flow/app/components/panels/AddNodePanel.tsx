"use client";

import { ActionButton, Panel } from "../common/Panel";

interface AddNodePanelProps {
  onAddNodeClick: (type: "classNode" | "instanceNode") => void;
}

export const AddNodePanel = ({ onAddNodeClick }: AddNodePanelProps) => {
  return (
    <Panel title="Add Node">
      <ActionButton
        onClick={() => onAddNodeClick("classNode")}
        variant="primary"
        className="bg-green-500 hover:bg-green-600"
      >
        Add Class Node
      </ActionButton>
      <ActionButton
        onClick={() => onAddNodeClick("instanceNode")}
        variant="primary"
        className="bg-blue-500 hover:bg-blue-600"
      >
        Add Instance Node
      </ActionButton>
    </Panel>
  );
};
