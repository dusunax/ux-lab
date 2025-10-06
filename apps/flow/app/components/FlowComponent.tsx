"use client";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useState } from "react";
import CRUDPanel from "./CRUDPanel";
import { ClassNode, InstanceNode } from "./CustomNodes";

const initialNodes = [
  {
    id: "1",
    type: "classNode",
    position: { x: 100, y: 100 },
    data: { label: "Class: Animal" },
  },
  {
    id: "2",
    type: "instanceNode",
    position: { x: 400, y: 100 },
    data: { label: "Instance: Cat" },
  },
  {
    id: "3",
    type: "instanceNode",
    position: { x: 600, y: 100 },
    data: { label: "Instance: Dog" },
  },
];
const initialEdges = [{ id: "e1-2", source: "2", target: "1", label: "is-a" }];

const FlowComponent = () => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);

  const onNodesChange = useCallback(
    (changes) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    []
  );
  const onConnect = useCallback(
    (params) =>
      setEdges((eds) => addEdge({ ...params, label: "relation" }, eds)),
    []
  );

  const handleAddNode = useCallback((type: "classNode" | "instanceNode") => {
    const newNode = {
      id: `${Date.now()}`,
      type,
      position: { x: 100, y: 100 },
      data: { label: `New ${type}` },
    };
    setNodes((nds) => [...nds, newNode]);
  }, []);

  const handleUpdateNode = useCallback((id: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => (node.id === id ? { ...node, data } : node))
    );
  }, []);

  const handleDeleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== id && edge.target !== id)
    );
    setSelectedNode(null);
  }, []);

  const handleUpdateEdge = useCallback((id: string, label: string) => {
    setEdges((eds) =>
      eds.map((edge) => (edge.id === id ? { ...edge, label } : edge))
    );
  }, []);

  const handleDeleteEdge = useCallback((id: string) => {
    setEdges((eds) => eds.filter((edge) => edge.id !== id));
    setSelectedEdge(null);
  }, []);

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((_, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const nodeTypes = {
    classNode: ClassNode,
    instanceNode: InstanceNode,
  };

  return (
    <div className="flex-1 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap className="border-2 border-gray-300 shadow-lg rounded-md" />
      </ReactFlow>
      <CRUDPanel
        onAddNode={handleAddNode}
        onUpdateNode={handleUpdateNode}
        onDeleteNode={handleDeleteNode}
        onAddEdge={() => {}}
        onUpdateEdge={handleUpdateEdge}
        onDeleteEdge={handleDeleteEdge}
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
      />
    </div>
  );
};

export default FlowComponent;
