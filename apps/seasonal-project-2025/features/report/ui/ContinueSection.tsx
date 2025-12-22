"use client";

import type { SectionId } from "@features/report/hooks/useReportSections";
import { AnimatedSection } from "./AnimatedSection";

interface ContinueSectionProps {
  onSectionChange: (section: SectionId) => void;
  sectionId: SectionId;
  advice: string;
  luckyItem: string;
  avoidItem: string;
  registerSection?: (id: SectionId, ref: React.RefObject<HTMLElement>) => void;
}

export function ContinueSection({
  onSectionChange,
  sectionId,
  advice,
  luckyItem,
  avoidItem,
  registerSection,
}: ContinueSectionProps) {
  return (
    <AnimatedSection sectionId={sectionId} registerSection={registerSection}>
      <div className="relative z-10 mx-auto px-4 md:px-6 w-full max-w-4xl">
        <div className="space-y-4 md:space-y-6">
          <h2 className="text-section-sm font-bold text-white text-center mb-6 md:mb-8">
            In 2026
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="w-full md:col-span-2 gap-6 bg-white/10 backdrop-blur-xl rounded-3xl p-4 md:p-6 border border-white/20 text-center">
              <h3 className="text-lg font-semibold text-white mb-2 md:mb-3">
                다가오는 2026년에는...
              </h3>
              <p className="text-white/90 text-sm md:text-base">{advice}</p>
            </div>
            <div className="w-full grid-cols-1 gap-6 bg-white/10 backdrop-blur-xl rounded-3xl p-4 md:p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-2 md:mb-3">
                행운의 아이템
              </h3>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl bg-green-100/60 backdrop-blur-sm flex items-center justify-center border border-green-200/50 shadow-sm">
                  <span className="text-xl md:text-2xl">🍀</span>
                </div>
                <p className="text-white/90 text-base md:text-lg font-semibold">
                  {luckyItem}
                </p>
              </div>
            </div>
            <div className="w-full grid-cols-1 gap-6 bg-white/10 backdrop-blur-xl rounded-3xl p-4 md:p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-2 md:mb-3">
                피해야할 것
              </h3>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl bg-red-100/60 backdrop-blur-sm flex items-center justify-center border border-red-200/50 shadow-sm">
                  <span className="text-xl md:text-2xl">⚠️</span>
                </div>
                <p className="text-white/90 text-base md:text-lg font-semibold">
                  {avoidItem}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
