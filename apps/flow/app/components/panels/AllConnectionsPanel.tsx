"use client";

import {
  Panel,
  PanelSection,
  ConnectionItem,
  EmptyMessage,
} from "../common/Panel";

interface AllConnectionsPanelProps {
  node: any;
  allSourceNodes: Array<{ node: any; edge: any }>;
  allTargetNodes: Array<{ node: any; edge: any }>;
}

export const AllConnectionsPanel = ({
  node,
  allSourceNodes,
  allTargetNodes,
}: AllConnectionsPanelProps) => {
  return (
    <Panel title="All Connected Nodes">
      <PanelSection title="All Source Nodes">
        {allSourceNodes.map(({ node: sourceNode, edge }) => (
          <ConnectionItem
            key={`${sourceNode.id}-${edge.id}`}
            sourceLabel={sourceNode.data.label}
            relationLabel={edge.label || "relation"}
            targetLabel={node.data.label}
          />
        ))}
        {allSourceNodes.length === 0 && (
          <EmptyMessage message="No source nodes found" />
        )}
      </PanelSection>

      <PanelSection title="All Target Nodes">
        {allTargetNodes.map(({ node: targetNode, edge }) => (
          <ConnectionItem
            key={`${targetNode.id}-${edge.id}`}
            sourceLabel={node.data.label}
            relationLabel={edge.label || "relation"}
            targetLabel={targetNode.data.label}
          />
        ))}
        {allTargetNodes.length === 0 && (
          <EmptyMessage message="No target nodes found" />
        )}
      </PanelSection>
    </Panel>
  );
};
