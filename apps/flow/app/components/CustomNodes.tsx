"use client";

import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";

const sharedNodeStyles = {
  padding: "10px 20px",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: "500",
  width: "150px",
  textAlign: "center" as const,
  boxShadow:
    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
};

export const ClassNode = ({ data }: { data: { label: string } }) => {
  return (
    <motion.div
      style={{
        ...sharedNodeStyles,
        background: "white",
        border: "2px solid #22c55e", // green-500
      }}
      initial={{ opacity: 1, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.1 }}
    >
      <CustomHandle
        type="target"
        position={Position.Left}
        style={{ background: "#22c55e" }}
      />
      <CustomHandle
        type="source"
        position={Position.Right}
        style={{ background: "#22c55e" }}
      />
      {data.label}
    </motion.div>
  );
};

export const InstanceNode = ({ data }: { data: { label: string } }) => {
  return (
    <motion.div
      style={{
        ...sharedNodeStyles,
        background: "white",
        border: "2px solid #3b82f6", // blue-500
      }}
      initial={{ opacity: 1, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.1 }}
    >
      <CustomHandle
        type="target"
        position={Position.Left}
        style={{ background: "#3b82f6" }}
      />
      <CustomHandle
        type="source"
        position={Position.Right}
        style={{ background: "#3b82f6" }}
      />
      {data.label}
    </motion.div>
  );
};

function CustomHandle({
  type,
  position,
  style,
}: {
  type: "target" | "source";
  position: Position;
  style: React.CSSProperties;
}) {
  return (
    <>
      <div
        className="!text-[10px] bg-gray-200 rounded-full px-2 absolute"
        style={{
          color: type === "target" ? "#3b82f6" : "#22c55e",
          [position]: 0,
          transform:
            position === Position.Left
              ? "translateX(-100%)"
              : position === Position.Right
              ? "translateX(100%)"
              : position === Position.Top
              ? "translateY(-100%)"
              : "translateY(100%)",
        }}
      >
        {type}
      </div>
      <Handle
        type={type}
        position={position}
        style={style}
        className="!h-3 !w-3"
      />
    </>
  );
}