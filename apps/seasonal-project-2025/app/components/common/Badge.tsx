"use client";

import { ReactNode } from "react";
import { cn } from "@utils/cn";

interface BadgeProps {
  children: ReactNode;
  size?: "sm" | "md";
  className?: string;
}

const sizeMap = {
  sm: "rounded-xl px-3 py-1 text-xs",
  md: "rounded-2xl px-4 py-2 text-sm",
};

export function Badge({ children, size = "md", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "bg-warmGray-900 font-medium text-white shadow-sm",
        sizeMap[size],
        className
      )}
    >
      {children}
    </span>
  );
}

