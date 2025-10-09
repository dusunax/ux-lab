"use client";

import {
  Panel,
  PanelSection,
  ConnectionItem,
  EmptyMessage,
} from "../common/Panel";

interface ConnectionsPanelProps {
  node: any;
  sourceConnections: Array<any>;
  targetConnections: Array<any>;
}

export const ConnectionsPanel = ({
  node,
  sourceConnections,
  targetConnections,
}: ConnectionsPanelProps) => {
  return (
    <Panel title="Direct Connections">
      <PanelSection title="Source Connections">
        {sourceConnections.map((conn) => (
          <ConnectionItem
            key={conn.id}
            sourceLabel={node.data.label}
            relationLabel={conn.label || "relation"}
            targetLabel={conn.targetNode?.data.label || "Unknown"}
          />
        ))}
        {sourceConnections.length === 0 && (
          <EmptyMessage message="No outgoing connections" />
        )}
      </PanelSection>

      <PanelSection title="Target Connections">
        {targetConnections.map((conn) => (
          <ConnectionItem
            key={conn.id}
            sourceLabel={conn.sourceNode?.data.label || "Unknown"}
            relationLabel={conn.label || "relation"}
            targetLabel={node.data.label}
          />
        ))}
        {targetConnections.length === 0 && (
          <EmptyMessage message="No incoming connections" />
        )}
      </PanelSection>
    </Panel>
  );
};
