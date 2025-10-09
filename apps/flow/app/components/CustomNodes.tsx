"use client";

import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";

const NodeUI = ({
  label,
  id,
  color,
}: {
  label: string;
  id: string;
  color: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 1, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.1 }}
      className={`py-2.5 px-5 rounded-lg w-[150px] text-center shadow-md bg-white border-2 flex flex-col justify-center`}
      style={{ borderColor: color }}
    >
      <CustomHandleWithLabel
        type="target"
        position={Position.Left}
        style={{ background: color }}
      />
      <CustomHandleWithLabel
        type="source"
        position={Position.Right}
        style={{ background: color }}
      />
      <span className="text-sm font-medium">{label}</span>
      <span className="border-t border-gray-300 text-[10px] text-gray-400 mt-1 py-0.5">
        {id}
      </span>
    </motion.div>
  );
};

export const ClassNode = ({
  data,
  id,
}: {
  data: { label: string };
  id: string;
}) => {
  return <NodeUI label={data.label} id={id} color="#22c55e" />;
};

export const InstanceNode = ({
  data,
  id,
}: {
  data: { label: string };
  id: string;
}) => {
  return <NodeUI label={data.label} id={id} color="#3b82f6" />;
};

function CustomHandleWithLabel({
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