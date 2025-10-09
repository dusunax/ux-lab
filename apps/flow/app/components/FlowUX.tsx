"use client";

import "@xyflow/react/dist/style.css";
import { useFlow } from "../hooks/useFlow";
import CRUDPanel from "./CRUDPanel";
import FlowComponent from "./FlowComponent";

const FlowUX = () => {
  const flowController = useFlow();

  return (
    <div className="flex-1 relative">
      {flowController.isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <FlowComponent flowController={flowController} />
      )}
      <CRUDPanel flowController={flowController} />
    </div>
  );
};

export default FlowUX;
