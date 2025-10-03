"use client";

import { useCallback, useState, useRef } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import CustomNode, { NodeData } from "./components/CustomNode";
import FlowToolbar from "./components/FlowToolbar";
import NodePanel from "./components/NodePanel";

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const initialNodes: Node<NodeData>[] = [
  {
    id: "1",
    type: "custom",
    position: { x: 250, y: 100 },
    data: {
      label: "시작 화면",
      type: "screen",
      description: "앱의 첫 화면",
    },
  },
  {
    id: "2",
    type: "custom",
    position: { x: 250, y: 300 },
    data: {
      label: "로그인",
      type: "action",
      description: "사용자 인증",
    },
  },
  {
    id: "3",
    type: "custom",
    position: { x: 100, y: 500 },
    data: {
      label: "성공",
      type: "decision",
      description: "로그인 성공 여부",
    },
  },
  {
    id: "4",
    type: "custom",
    position: { x: 400, y: 500 },
    data: {
      label: "실패",
      type: "decision",
      description: "로그인 실패",
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    animated: true,
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    animated: true,
  },
  {
    id: "e2-4",
    source: "2",
    target: "4",
    animated: true,
  },
];

let nodeId = 5;

export default function FlowPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([
    { nodes: initialNodes, edges: initialEdges },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data as NodeData);
  }, []);

  const addNode = useCallback(
    (type: "screen" | "component" | "action" | "decision") => {
      const newNode: Node<NodeData> = {
        id: `${nodeId++}`,
        type: "custom",
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100,
        },
        data: {
          label: `새 ${type}`,
          type,
          description: `${type} 노드`,
        },
      };

      setNodes((nds) => [...nds, newNode]);
      saveToHistory();
    },
    [setNodes]
  );

  const updateNode = useCallback(
    (nodeId: string, data: Partial<NodeData>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...data } }
            : node
        )
      );
      saveToHistory();
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
      setSelectedNode(null);
      saveToHistory();
    },
    [setNodes, setEdges]
  );

  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: [...nodes], edges: [...edges] });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, nodes, edges]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(historyIndex - 1);
      setSelectedNode(null);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);
      setSelectedNode(null);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  const saveFlow = useCallback(() => {
    const flowData = { nodes, edges };
    localStorage.setItem("ux-flow-data", JSON.stringify(flowData));
    alert("플로우가 저장되었습니다!");
  }, [nodes, edges]);

  const loadFlow = useCallback(() => {
    const savedData = localStorage.getItem("ux-flow-data");
    if (savedData) {
      const flowData = JSON.parse(savedData);
      setNodes(flowData.nodes);
      setEdges(flowData.edges);
      setHistory([flowData]);
      setHistoryIndex(0);
      setSelectedNode(null);
      alert("플로우가 로드되었습니다!");
    }
  }, [setNodes, setEdges]);

  const exportFlow = useCallback(() => {
    const flowData = { nodes, edges };
    const dataStr = JSON.stringify(flowData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = "ux-flow.json";
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  }, [nodes, edges]);

  return (
    <div className="h-screen flex flex-col">
      <FlowToolbar
        onAddNode={addNode}
        onSave={saveFlow}
        onLoad={loadFlow}
        onExport={exportFlow}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />

      <div className="flex-1 flex">
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50"
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>

        <NodePanel
          selectedNode={selectedNode}
          onUpdateNode={updateNode}
          onDeleteNode={deleteNode}
        />
      </div>
    </div>
  );
}
