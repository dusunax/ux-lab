"use client";

import { motion } from "framer-motion";
import type { MotionValue } from "framer-motion";

interface PersonalitySectionProps {
  opacity: MotionValue<number>;
  y: MotionValue<number>;
  personality: string;
}

export function PersonalitySection({
  opacity,
  y,
  personality,
}: PersonalitySectionProps) {
  return (
    <motion.div
      style={{
        opacity,
        y,
      }}
      className="fixed inset-0 z-10 flex items-center justify-center bg-black"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center max-w-4xl mx-auto px-4"
      >
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
          본인은...
        </h2>
        <p className="text-2xl md:text-3xl text-white/90 leading-relaxed">
          {personality}
        </p>
      </motion.div>
    </motion.div>
  );
}

