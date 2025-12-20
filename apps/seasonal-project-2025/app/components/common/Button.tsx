"use client";

import { motion, MotionProps } from "framer-motion";
import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@utils/cn";

interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof MotionProps>,
    MotionProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const variantMap = {
  primary:
    "bg-warmGray-900 text-white hover:bg-warmGray-800 active:bg-warmGray-700",
  secondary:
    "bg-beige-100 text-warmGray-900 hover:bg-beige-200 active:bg-beige-300",
  ghost:
    "bg-transparent text-warmGray-700 hover:bg-beige-50 active:bg-beige-100",
};

const sizeMap = {
  sm: "px-4 py-2 text-sm rounded-2xl",
  md: "px-6 py-3 text-base rounded-2xl",
  lg: "px-8 py-4 text-lg rounded-3xl",
};

export function Button({ children, variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-warmGray-400 focus:ring-offset-2",
        variantMap[variant],
        sizeMap[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
