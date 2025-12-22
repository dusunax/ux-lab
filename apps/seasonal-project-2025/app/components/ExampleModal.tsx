"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PlayIcon, X } from "lucide-react";
import { AnalysisResultCard } from "@features/report/ui/AnalysisResultCard";
import type { AnalysisResult } from "@features/report/types";
import { useRouter } from "next/navigation";

interface ExampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: AnalysisResult | null;
}

export function ExampleModal({
  isOpen,
  onClose,
  analysisResult,
}: ExampleModalProps) {
  const router = useRouter();

  if (!analysisResult) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm !mt-0"
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed !mt-0 inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative w-full md:max-w-4xl pointer-events-auto">
              {/* Content */}
              <div className="rounded-3xl md:scale-75 relative overflow-hidden">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  data-ga-label="예시 모달 닫기"
                  className="absolute top-4 right-4 z-[11] w-10 h-10 flex items-center justify-center rounded-full bg-warmGray-100 hover:bg-warmGray-200 transition-colors duration-200 shadow-md"
                  aria-label="닫기"
                >
                  <X className="w-5 h-5 text-warmGray-700" />
                </button>
                <div className="absolute w-full h-full flex items-center justify-center z-10 pointer-events-none">
                  <div
                    className="absolute w-full h-full rounded-full pointer-events-auto z-10"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(0,0,0,0.4) 10%, rgba(0,0,0,0) 50%)",
                    }}
                  />
                  <button
                    onClick={() => {
                      router.push("/report?example=" + analysisResult.id);
                    }}
                    data-ga-label="예시 리포트 보기"
                    className="absolute z-10 w-full h-full flex items-center justify-center pointer-events-auto"
                  >
                    <PlayIcon className="w-20 h-20 text-white animate-pulse" />
                  </button>
                </div>
                <AnalysisResultCard analysisResult={analysisResult} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
