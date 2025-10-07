import { useCallback, useState, useEffect } from "react";
import { useFlowData } from "./useFlowData";
import {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";

const initialNodes: Node[] = [
  {
    id: "1",
    type: "classNode",
    position: { x: 100, y: 0 },
    data: { label: "Class: Animal" },
  },
  {
    id: "2",
    type: "instanceNode",
    position: { x: 400, y: 0 },
    data: { label: "Instance: Cat" },
  },
  {
    id: "3",
    type: "instanceNode",
    position: { x: 400, y: 50 },
    data: { label: "Instance: Dog" },
  },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", label: "is-a" },
];

export const useFlow = (flowId: string = 'default') => {
  const { saveFlow, loadFlow } = useFlowData();
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

    const onConnect = useCallback(
      (params: Connection) => {
        const newEdge = { ...params, label: "default" };
        setEdges((eds: Edge[]) => {
          const updatedEdges = addEdge(newEdge, eds);
          const addedEdge = updatedEdges[updatedEdges.length - 1];
          setTimeout(() => {
            setSelectedEdge(addedEdge);
            setSelectedNode(null);
          }, 0);
          return updatedEdges;
        });
      },
      []
    );

  const handleAddNode = useCallback((type: "classNode" | "instanceNode") => {
    const newNode = {
      id: `${Date.now()}`,
      type,
      position: { x: 100 + (type === "classNode" ? 0 : 300), y: 50 + nodes.filter(node => node.type === type).length * 50 },
      data: { label: `New ${type}` },
      };
      setNodes((nds) => [...nds, newNode]);
      setTimeout(() => {
        setSelectedNode(newNode);
        setSelectedEdge(null);
      }, 0);
    }, [nodes]);

  const handleUpdateNode = useCallback((id: string, data: any) => {
    setNodes((nds) => {
      const updatedNodes = nds.map((node) => {
        if (node.id === id) {
          const updatedNode = { ...node, data };
          // 선택된 노드도 동시에 업데이트
          setTimeout(() => setSelectedNode(updatedNode), 0);
          return updatedNode;
        }
        return node;
      });
      return updatedNodes;
    });
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
      eds.map((edge) => {
        if (edge.id === id) {
          const updatedEdge = { ...edge, label };
          setSelectedEdge(updatedEdge);
          return updatedEdge;
        }
        return edge;
      })
    );
  }, []);

  const handleDeleteEdge = useCallback((id: string) => {
    setEdges((eds) => eds.filter((edge) => edge.id !== id));
    setSelectedEdge(null);
  }, []);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      const data = await loadFlow(flowId);
      if (data) {
        setNodes(data.nodes);
        setEdges(data.edges);
      }
    };
    loadInitialData();
  }, [flowId, loadFlow]);

  // Save changes
  useEffect(() => {
    const saveChanges = async () => {
      await saveFlow(flowId, nodes, edges);
    };
    saveChanges();
  }, [flowId, nodes, edges, saveFlow]);

  return {
    nodes,
    edges,
    selectedNode,
    selectedEdge,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    onEdgeClick,
    handleAddNode,
    handleUpdateNode,
    handleDeleteNode,
    handleUpdateEdge,
    handleDeleteEdge,
  };
};
