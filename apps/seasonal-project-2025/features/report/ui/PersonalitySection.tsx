"use client";

import type { SectionId } from "@features/report/hooks/useReportSections";
import { AnimatedSection } from "./AnimatedSection";

interface PersonalitySectionProps {
  onSectionChange: (section: SectionId) => void;
  sectionId: SectionId;
  personality: string;
  registerSection?: (id: SectionId, ref: React.RefObject<HTMLElement>) => void;
}

export function PersonalitySection({
  onSectionChange,
  sectionId,
  personality,
  registerSection,
}: PersonalitySectionProps) {
  return (
    <AnimatedSection sectionId={sectionId} registerSection={registerSection}>
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4 md:px-6">
        <h2 className="text-section-lg font-bold text-white mb-6">본인은...</h2>
        <p className="text-xl md:text-3xl text-white/90 leading-relaxed">
          {personality}
        </p>
      </div>
    </AnimatedSection>
  );
}
