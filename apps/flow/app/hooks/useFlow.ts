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


export const useFlow = (flowId: string = "default") => {
  const { saveFlow, loadFlow } = useFlowData();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

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

  const onConnect = useCallback((params: Connection) => {
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
  }, []);

  const handleAddNode = useCallback(
    (type: "classNode" | "instanceNode") => {
      const newNode = {
        id: `${Date.now()}`,
        type,
        position: {
          x: 100 + (type === "classNode" ? 0 : 300),
          y: 50 + nodes.filter((node) => node.type === type).length * 50,
        },
        data: { label: `New ${type}` },
      };
      setNodes((nds) => [...nds, newNode]);
      setTimeout(() => {
        setSelectedNode(newNode);
        setSelectedEdge(null);
      }, 0);
    },
    [nodes]
  );

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
      setIsLoading(true);
      try {
        const data = await loadFlow(flowId);
        setNodes(data.nodes);
        setEdges(data.edges);
      } catch (error) {
        console.error("Error loading flow data:", error);
        const data = await loadFlow(flowId);
        setNodes(data.nodes);
        setEdges(data.edges);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [flowId, loadFlow]);

    const handleSaveChanges = useCallback(async () => {
      if (isFirstLoad) {
        setIsFirstLoad(false);
        return;
      }
      await saveFlow(flowId, nodes, edges);
    }, [flowId, nodes, edges, saveFlow, isFirstLoad]);
  useEffect(() => {
    handleSaveChanges();
  }, [
    nodes.map((n) => `${n.id}-${n.type}-${JSON.stringify(n.data)}`).join("|"),
    edges.map((e) => `${e.id}-${e.source}-${e.target}-${e.label}`).join("|"),
  ]);

  return {
    nodes,
    edges,
    selectedNode,
    selectedEdge,
    isLoading,
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
