"use client";

import { Handle, Position } from "@xyflow/react";

const sharedNodeStyles = {
  padding: "10px 20px",
  borderRadius: "8px",
  background: "white",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  fontSize: "14px",
  fontWeight: "500",
  width: "150px",
  textAlign: "center" as const,
};

export const ClassNode = ({ data }: { data: { label: string } }) => {
  return (
    <div
      style={{
        ...sharedNodeStyles,
        border: "2px solid #22c55e", // green-500
      }}
    >
      <Handle type="target" position={Position.Top} />
      {data.label}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export const InstanceNode = ({ data }: { data: { label: string } }) => {
  return (
    <div
      style={{
        ...sharedNodeStyles,
        border: "2px solid #3b82f6", // blue-500
      }}
    >
      <Handle type="target" position={Position.Top} />
      {data.label}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
