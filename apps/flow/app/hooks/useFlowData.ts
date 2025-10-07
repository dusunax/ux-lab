import { useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const FLOWS_COLLECTION = 'flows';

export const useFlowData = () => {
  const saveFlow = useCallback(async (flowId: string, nodes: Node[], edges: Edge[]) => {
    try {
      const flowRef = doc(db, FLOWS_COLLECTION, flowId);
      await setDoc(flowRef, {
        nodes,
        edges,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error('Error saving flow:', error);
      return false;
    }
  }, []);

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
      return null;
    } catch (error) {
      console.error('Error loading flow:', error);
      return null;
    }
  }, []);

  return {
    saveFlow,
    loadFlow,
  };
};
