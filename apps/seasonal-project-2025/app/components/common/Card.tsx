"use client";

import { motion, MotionProps } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@utils/cn";

interface CardProps extends MotionProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

const paddingMap = {
  sm: "p-4 md:p-6",
  md: "p-6 md:p-8 lg:p-10",
  lg: "p-8 md:p-12 lg:p-16",
};

export function Card({ children, className, padding = "md", ...props }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn("rounded-3xl bg-white shadow-sm", paddingMap[padding], className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}