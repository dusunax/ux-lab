"use client";

import { motion } from "framer-motion";
import type { MotionValue } from "framer-motion";

interface ContinueSectionProps {
  opacity: MotionValue<number>;
  y: MotionValue<number>;
  advice: string;
  luckyItem: string;
  avoidItem: string;
}

export function ContinueSection({
  opacity,
  y,
  advice,
  luckyItem,
  avoidItem,
}: ContinueSectionProps) {
  return (
    <motion.div
      style={{
        opacity,
        y,
      }}
      className="fixed inset-0 z-10 flex items-center justify-center bg-black"
    >
      <div className="mx-auto px-4 w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 1, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <h2 className="text-section-sm font-bold text-white text-center mb-8">
            In 2026
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="w-full md:col-span-2 gap-6 bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 text-center">
              <h3 className="text-lg font-semibold text-white mb-3">
                다가오는 2026년에는...
              </h3>
              <p className="text-white/90">{advice}</p>
            </div>
            <div className="w-full grid-cols-1 gap-6 bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-3">
                행운의 아이템
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-100/60 backdrop-blur-sm flex items-center justify-center border border-green-200/50 shadow-sm">
                  <span className="text-2xl">🍀</span>
                </div>
                <p className="text-white/90 text-lg font-semibold">
                  {luckyItem}
                </p>
              </div>
            </div>
            <div className="w-full grid-cols-1 gap-6 bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-3">
                피해야할 것
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-100/60 backdrop-blur-sm flex items-center justify-center border border-red-200/50 shadow-sm">
                  <span className="text-2xl">⚠️</span>
                </div>
                <p className="text-white/90 text-lg font-semibold">
                  {avoidItem}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
