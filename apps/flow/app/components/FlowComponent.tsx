"use client";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import CRUDPanel from "./CRUDPanel";
import { ClassNode, InstanceNode } from "./CustomNodes";
import { useFlow } from "../hooks/useFlow";

const FlowComponent = () => {
  const flowController = useFlow();

  const nodeTypes = {
    classNode: ClassNode,
    instanceNode: InstanceNode,
  };

  return (
    <div className="flex-1 relative">
      {flowController.isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <ReactFlow
          nodes={flowController.nodes}
          edges={flowController.edges}
          nodeTypes={nodeTypes}
          onNodesChange={flowController.onNodesChange}
          onEdgesChange={flowController.onEdgesChange}
          onConnect={flowController.onConnect}
          onNodeClick={flowController.onNodeClick}
          onEdgeClick={flowController.onEdgeClick}
          onEdgesDelete={flowController.onDeleteEdge}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Controls />
          <MiniMap className="border-2 border-gray-300 shadow-lg rounded-md" />
        </ReactFlow>
      )}
      <CRUDPanel
        onAddNode={flowController.handleAddNode}
        onUpdateNode={flowController.handleUpdateNode}
        onDeleteNode={flowController.handleDeleteNode}
        onUpdateEdge={flowController.handleUpdateEdge}
        onDeleteEdge={flowController.handleDeleteEdge}
        selectedNode={flowController.selectedNode}
        selectedEdge={flowController.selectedEdge}
        nodes={flowController.nodes}
        edges={flowController.edges}
        allSourceNodes={flowController.allSourceNodes}
        allTargetNodes={flowController.allTargetNodes}
      />
    </div>
  );
};

export default FlowComponent;
