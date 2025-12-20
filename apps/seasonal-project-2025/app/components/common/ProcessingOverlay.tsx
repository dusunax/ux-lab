"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const messages = [
  "2025년의 조각들을 모으고 있습니다...",
  "따뜻한 순간들을 꺼내는 중이에요...",
  "빛바랜 사진에 숨은 감정을 감싸는 중...",
  "회고를 작성하는 중...",
  "기억 조각들을 모으고 있습니다...",
  "여정을 한 편의 이야기로 엮고 있어요...",
];

interface ProcessingOverlayProps {
  active: boolean;
}

export function ProcessingOverlay({ active }: ProcessingOverlayProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 2200);
    return () => clearInterval(timer);
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-warmGray-900/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mx-4 flex max-w-md flex-col items-center gap-4 rounded-3xl bg-white/90 p-8 shadow-xl"
          >
            <div className="flex items-center gap-3 text-warmGray-800">
              <Loader2 className="h-5 w-5 animate-spin text-warmGray-700" />
              <span className="text-sm font-medium text-warmGray-600">
                AI가 당신의 한 해를 정리하는 중
              </span>
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="text-center text-lg font-semibold text-warmGray-900"
              >
                {messages[index]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

