import { useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

const FLOWS_COLLECTION = "flows";

const DEFAULT_NODES: Node[] = [
  {
    id: "1",
    type: "classNode",
    position: { x: 100, y: 200 },
    data: { label: "Class: Animal" },
  },
  {
    id: "2",
    type: "instanceNode",
    position: { x: 400, y: 200 },
    data: { label: "Instance: Cat" },
  },
  {
    id: "3",
    type: "instanceNode",
    position: { x: 600, y: 200 },
    data: { label: "Instance: Dog" },
  },
];

const DEFAULT_EDGES: Edge[] = [
  { id: "e1-2", source: "1", target: "2", label: "is-a" },
];

export const useFlowData = () => {
  const saveFlow = useCallback(
    async (flowId: string, nodes: Node[], edges: Edge[]) => {
      try {
        const flowRef = doc(db, FLOWS_COLLECTION, flowId);
        await setDoc(flowRef, {
          nodes,
          edges,
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (error) {
        console.error("Error saving flow:", error);
        return false;
      }
    },
    []
  );

  const loadFlow = useCallback(async (flowId: string) => {
    try {
      const flowRef = doc(db, FLOWS_COLLECTION, flowId);
      const flowDoc = await getDoc(flowRef);

      if (flowDoc.exists()) {
        const data = flowDoc.data();
        return {
          nodes: data.nodes as Node[],
          edges: data.edges as Edge[],
        };
      }
      // 문서가 없으면 기본 데이터 반환
      return {
        nodes: DEFAULT_NODES,
        edges: DEFAULT_EDGES,
      };
    } catch (error) {
      console.error("Error loading flow:", error);
      return {
        nodes: DEFAULT_NODES,
        edges: DEFAULT_EDGES,
      };
    }
  }, []);

  return {
    saveFlow,
    loadFlow,
  };
};
