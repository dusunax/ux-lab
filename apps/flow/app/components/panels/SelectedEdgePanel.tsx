"use client";

import { ActionButton, InputField, Panel } from "../common/Panel";

interface SelectedEdgePanelProps {
  edge: any;
  onUpdateEdge: (id: string, label: string) => void;
  onDeleteEdge: (id: string) => void;
}

export const SelectedEdgePanel = ({
  edge,
  onUpdateEdge,
  onDeleteEdge,
}: SelectedEdgePanelProps) => {
  return (
    <Panel title="Selected Edge">
      <InputField
        value={edge.label}
        onChange={(value) => onUpdateEdge(edge.id, value)}
        placeholder="Enter connection label..."
        size="sm"
      />
      <ActionButton onClick={() => onDeleteEdge(edge.id)} variant="danger" size="sm">
        Delete Connection
      </ActionButton>
    </Panel>
  );
};
