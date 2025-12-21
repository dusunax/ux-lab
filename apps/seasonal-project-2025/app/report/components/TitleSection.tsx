"use client";

import { motion } from "framer-motion";
import type { MotionValue } from "framer-motion";

interface TitleSectionProps {
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  y: MotionValue<number>;
}

export function TitleSection({ opacity, scale, y }: TitleSectionProps) {
  return (
    <motion.div
      style={{
        opacity,
        scale,
        y,
      }}
      className="fixed inset-0 z-10 flex items-center justify-center bg-black"
    >
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-6xl md:text-8xl font-bold text-white text-center"
      >
        Your 2025
      </motion.h1>
    </motion.div>
  );
}

