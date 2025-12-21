"use client";

import { motion } from "framer-motion";
import { Badge } from "@shared/ui/Badge";
import type { MotionValue } from "framer-motion";
import type { PersonalityType, Keyword } from "@features/report/types";

interface MeSectionProps {
  opacity: MotionValue<number>;
  y: MotionValue<number>;
  personalityType: PersonalityType;
  favoriteThings: Keyword[];
}

export function MeSection({
  opacity,
  y,
  personalityType,
  favoriteThings,
}: MeSectionProps) {
  return (
    <motion.div
      style={{
        opacity,
        y,
      }}
      className="fixed inset-0 z-10 flex items-center justify-center bg-black"
    >
      <div className="max-w-4xl mx-auto px-4 w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-8">
            Me at 2025
          </h2>
          <div className="flex flex-col gap-6">
            <div className="w-full bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 text-center">
              <h3 className="text-lg font-semibold text-white mb-3">
                심리 타입
              </h3>
              <p className="text-white/90 font-bold mb-2 text-2xl">
                {personalityType?.type}
              </p>
              <p className="text-white/80 text-sm mb-2">
                {personalityType?.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center">
                {personalityType?.traits?.map((trait, idx) => (
                  <Badge key={idx} className="border border-white/20">
                    <span className="mr-1.5">{trait.emoji}</span>
                    {trait.text}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="w-full bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 text-center">
              <h3 className="text-lg font-semibold text-white mb-3">
                좋아하는 것들
              </h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {favoriteThings?.map((thing, idx) => (
                  <Badge key={idx} className="border border-white/20">
                    <span className="mr-1.5">{thing.emoji}</span>
                    {thing.text}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

