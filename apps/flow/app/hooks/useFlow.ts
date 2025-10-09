import { useCallback, useState, useEffect, useMemo } from "react";
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
import { sanitizeNodeLabel } from "../utils/sanitize";

export const useFlow = (flowId: string = "default") => {
  const { saveFlow, loadFlow } = useFlowData();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);
  const [pendingNodeType, setPendingNodeType] = useState<
    "classNode" | "instanceNode" | null
  >(null);
  const [pendingNodeId, setPendingNodeId] = useState("");
  const [pendingNodeLabel, setPendingNodeLabel] = useState("");

  const handleAddNodeClick = useCallback(
    (type: "classNode" | "instanceNode") => {
      setPendingNodeType(type);
      setIsAddNodeModalOpen(true);
    },
    []
  );

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
      setSelectedEdge(addedEdge);
      return updatedEdges;
    });
  }, []);

  const handleAddNode = useCallback(
    (type: "classNode" | "instanceNode", id: string, label: string) => {
      const nodeId = id || sanitizeNodeLabel(label);

      if (nodes.some((node) => node.id === nodeId)) {
        alert("이미 사용 중인 ID입니다.");
        return false;
      }

      const newNode = {
        id: nodeId,
        type,
        position: {
          x: 100 + (type === "classNode" ? 0 : 300),
          y: 50 + nodes.filter((node) => node.type === type).length * 50,
        },
        data: { label },
      };
      setNodes((nds) => [...nds, newNode]);
      setTimeout(() => {
        setSelectedNode(newNode);
        setSelectedEdge(null);
      }, 0);
      return true;
    },
    [nodes]
  );

  const handleUpdateNode = useCallback(
    (id: string, newId: string, data: any) => {
      const nodeId = newId || id;

      if (id !== nodeId && nodes.some((node) => node.id === nodeId)) {
        alert("이미 사용 중인 ID입니다.");
        return false;
      }

      setNodes((nds) => {
        const updatedNodes = nds.map((node) => {
          if (node.id === id) {
            const updatedNode = {
              ...node,
              id: nodeId,
              data,
            };
            setTimeout(() => setSelectedNode(updatedNode), 0);
            return updatedNode;
          }
          return node;
        });
        return updatedNodes;
      });

      if (id !== nodeId) {
        setEdges((eds) =>
          eds.map((edge) => ({
            ...edge,
            source: edge.source === id ? nodeId : edge.source,
            target: edge.target === id ? nodeId : edge.target,
          }))
        );
      }
      return true;
    },
    [nodes]
  );

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

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
  }, []);

  const onDeleteEdge = useCallback(() => {
    setSelectedEdge(null);
  }, []);

  // 모든 상위/하위 노드 찾기
  const findAllConnectedNodes = useCallback(
    (
      startNodeId: string,
      direction: "source" | "target",
      visited = new Set<string>()
    ) => {
      if (visited.has(startNodeId)) return [];

      visited.add(startNodeId);
      const connections = edges.filter((edge) =>
        direction === "source"
          ? edge.target === startNodeId
          : edge.source === startNodeId
      );

      const connectedNodes = connections.map((conn) => {
        const nodeId = direction === "source" ? conn.source : conn.target;
        const node = nodes.find((n) => n.id === nodeId);
        return {
          edge: conn,
          node,
        };
      });

      const nestedConnections = connectedNodes.flatMap(({ edge, node }) =>
        node
          ? [
              { edge, node },
              ...findAllConnectedNodes(node.id, direction, visited),
            ]
          : []
      );

      return nestedConnections;
    },
    [edges, nodes]
  );

  // 모든 상위/하위 노드 메모이제이션
  const allSourceNodes = useMemo(() => {
    if (!selectedNode) return [];
    return findAllConnectedNodes(selectedNode.id, "source");
  }, [selectedNode, findAllConnectedNodes]);

  const allTargetNodes = useMemo(() => {
    if (!selectedNode) return [];
    return findAllConnectedNodes(selectedNode.id, "target");
  }, [selectedNode, findAllConnectedNodes]);

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

  const handleSaveOnBlur = useCallback(() => {
    handleSaveChanges();
  }, [handleSaveChanges]);

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
    onDeleteEdge,
    handleAddNode,
    handleUpdateNode,
    handleDeleteNode,
    handleUpdateEdge,
    handleDeleteEdge,
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
  };
};
