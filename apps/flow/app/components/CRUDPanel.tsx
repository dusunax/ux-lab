"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

import { useFlow } from "../hooks/useFlow";
import { AddNodeModal } from "./modals/AddNodeModal";
import { AddNodePanel } from "./panels/AddNodePanel";
import { SelectedNodePanel } from "./panels/SelectedNodePanel";
import { SelectedEdgePanel } from "./panels/SelectedEdgePanel";
import { ConnectionsPanel } from "./panels/ConnectionsPanel";
import { AllConnectionsPanel } from "./panels/AllConnectionsPanel";

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
    isAddNodeModalOpen,
    setIsAddNodeModalOpen,
    pendingNodeType,
    pendingNodeId,
    setPendingNodeId,
    pendingNodeLabel,
    setPendingNodeLabel,
    handleAddNodeClick,
    handleSaveOnBlur,
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

        <AddNodeModal
          isOpen={isAddNodeModalOpen}
          onClose={() => setIsAddNodeModalOpen(false)}
          pendingNodeType={pendingNodeType}
          pendingNodeId={pendingNodeId}
          setPendingNodeId={setPendingNodeId}
          pendingNodeLabel={pendingNodeLabel}
          setPendingNodeLabel={setPendingNodeLabel}
          onAddNode={onAddNode}
        />

        <div className="space-y-6">
          <AddNodePanel onAddNodeClick={handleAddNodeClick} />

          {selectedNode && (
            <SelectedNodePanel
              node={selectedNode}
              onUpdateNode={onUpdateNode}
              onDeleteNode={onDeleteNode}
              inputValue={inputValue}
              setInputValue={setInputValue}
              onSave={handleSaveOnBlur}
            />
          )}

          {selectedEdge && (
            <SelectedEdgePanel
              edge={selectedEdge}
              onUpdateEdge={onUpdateEdge}
              onDeleteEdge={onDeleteEdge}
            />
          )}

          {selectedNode && (
            <ConnectionsPanel
              node={selectedNode}
              sourceConnections={sourceConnections}
              targetConnections={targetConnections}
            />
          )}

          {selectedNode && (
            <AllConnectionsPanel
              node={selectedNode}
              allSourceNodes={allSourceNodes}
              allTargetNodes={allTargetNodes}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CRUDPanel;
