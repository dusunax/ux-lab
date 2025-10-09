import { Node, Edge } from "@xyflow/react";

export interface FlowController {
  // 노드/엣지 상태
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  isLoading: boolean;

  // 이벤트 핸들러
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (params: any) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onEdgeClick: (event: React.MouseEvent, edge: Edge) => void;
  onDeleteEdge: (id: string) => void;

  // CRUD 작업
  handleAddNode: (type: "classNode" | "instanceNode", id: string, label: string) => boolean;
  handleAddNodeClick: (type: "classNode" | "instanceNode") => void;
  handleUpdateNode: (id: string, newId: string, data: any) => boolean;
  handleDeleteNode: (id: string) => void;
  handleUpdateEdge: (id: string, label: string) => void;
  handleDeleteEdge: (id: string) => void;

  // 모달 상태
  isAddNodeModalOpen: boolean;
  setIsAddNodeModalOpen: (isOpen: boolean) => void;
  pendingNodeType: "classNode" | "instanceNode" | null;
  pendingNodeId: string;
  setPendingNodeId: (id: string) => void;
  pendingNodeLabel: string;
  setPendingNodeLabel: (label: string) => void;

  // 연결 정보
  allSourceNodes: Array<{ node: Node; edge: Edge }>;
  allTargetNodes: Array<{ node: Node; edge: Edge }>;
}
