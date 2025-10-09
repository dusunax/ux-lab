"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import {
  Panel,
  PanelSection,
  ConnectionItem,
  EmptyMessage,
  ActionButton,
  InputField,
} from "./common/Panel";
import { useFlow } from "../hooks/useFlow";

interface CRUDPanelProps {
  flowController: ReturnType<typeof useFlow>;
}

const CRUDPanel = ({ flowController }: CRUDPanelProps) => {
  const {
    handleAddNode: onAddNode,
    handleUpdateNode: onUpdateNode,
    handleDeleteNode: onDeleteNode,
    handleUpdateEdge: onUpdateEdge,
    handleDeleteEdge: onDeleteEdge,
    selectedNode,
    selectedEdge,
    nodes,
    edges,
    allSourceNodes,
    allTargetNodes,
  } = flowController;
  const [isExpanded, setIsExpanded] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const sourceConnections = useMemo(() => {
    if (!selectedNode) return [];
    return edges
      .filter((edge) => edge.source === selectedNode.id)
      .map((edge) => ({
        ...edge,
        targetNode: nodes.find((n) => n.id === edge.target),
      }));
  }, [edges, nodes, selectedNode]);

  const targetConnections = useMemo(() => {
    if (!selectedNode) return [];
    return edges
      .filter((edge) => edge.target === selectedNode.id)
      .map((edge) => ({
        ...edge,
        sourceNode: nodes.find((n) => n.id === edge.source),
      }));
  }, [edges, nodes, selectedNode]);

  useEffect(() => {
    if (selectedNode) {
      setInputValue(selectedNode.data.label);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [selectedNode]);

  return (
    <motion.div
      className="fixed right-0 flex flex-col top-0 h-full bg-white shadow-lg"
      initial={{ width: "320px" }}
      animate={{ width: isExpanded ? "320px" : "0px" }}
      transition={{ type: "spring", stiffness: 300, damping: 30, bounce: 0.1 }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -left-4 bottom-6 -translate-x-full transform bg-[#2563eb] text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-shadow z-10"
      >
        <ChevronRight
          size={16}
          className={`transition-transform duration-100 ${
            !isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`w-full flex-1 p-4 pb-8 overflow-y-auto ${
          !isExpanded ? "hidden" : ""
        }`}
      >
        <h2 className="text-xl font-bold mb-4">Flow Editor</h2>

        <div className="space-y-6">
          {/* Add Node Section */}
          <Panel title="Add Node">
            <ActionButton
              onClick={() => onAddNode("classNode")}
              variant="primary"
              className="bg-green-500 hover:bg-green-600"
            >
              Add Class Node
            </ActionButton>
            <ActionButton
              onClick={() => onAddNode("instanceNode")}
              variant="primary"
              className="bg-blue-500 hover:bg-blue-600"
            >
              Add Instance Node
            </ActionButton>
          </Panel>

          {/* Selected Node Section */}
          {selectedNode && (
            <Panel title="Selected Node">
              <InputField
                value={inputValue}
                onChange={(value) => {
                  setInputValue(value);
                  onUpdateNode(selectedNode.id, {
                    ...selectedNode.data,
                    label: value,
                  });
                }}
              />
              <ActionButton
                onClick={() => onDeleteNode(selectedNode.id)}
                variant="danger"
              >
                Delete Node
              </ActionButton>
            </Panel>
          )}

          {/* Selected Edge Section */}
          {selectedEdge && (
            <Panel title="Selected Edge">
              <InputField
                value={selectedEdge.label}
                onChange={(value) => onUpdateEdge(selectedEdge.id, value)}
                placeholder="Enter connection label..."
                size="sm"
              />
              <ActionButton
                onClick={() => onDeleteEdge(selectedEdge.id)}
                variant="danger"
                size="sm"
              >
                Delete Connection
              </ActionButton>
            </Panel>
          )}

          {/* Direct Connections */}
          {selectedNode && (
            <Panel title="Direct Connections">
              <PanelSection title="Source Connections">
                {sourceConnections.map((conn) => (
                  <ConnectionItem
                    key={conn.id}
                    sourceLabel={selectedNode.data.label}
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
                    targetLabel={selectedNode.data.label}
                  />
                ))}
                {targetConnections.length === 0 && (
                  <EmptyMessage message="No incoming connections" />
                )}
              </PanelSection>
            </Panel>
          )}

          {/* All Connected Nodes */}
          {selectedNode && (
            <Panel title="All Connected Nodes">
              <PanelSection title="All Source Nodes">
                {allSourceNodes.map(({ node, edge }) => (
                  <ConnectionItem
                    key={`${node.id}-${edge.id}`}
                    sourceLabel={node.data.label}
                    relationLabel={edge.label || "relation"}
                    targetLabel={selectedNode.data.label}
                  />
                ))}
                {allSourceNodes.length === 0 && (
                  <EmptyMessage message="No source nodes found" />
                )}
              </PanelSection>

              <PanelSection title="All Target Nodes">
                {allTargetNodes.map(({ node, edge }) => (
                  <ConnectionItem
                    key={`${node.id}-${edge.id}`}
                    sourceLabel={selectedNode.data.label}
                    relationLabel={edge.label || "relation"}
                    targetLabel={node.data.label}
                  />
                ))}
                {allTargetNodes.length === 0 && (
                  <EmptyMessage message="No target nodes found" />
                )}
              </PanelSection>
            </Panel>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CRUDPanel;
