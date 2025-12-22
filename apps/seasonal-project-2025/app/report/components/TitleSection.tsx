"use client";

import type { SectionId } from "@/report/hooks/useReportSections";
import { AnimatedSection } from "./AnimatedSection";

interface TitleSectionProps {
  onSectionChange: (section: SectionId) => void;
  sectionId: SectionId;
  registerSection?: (id: SectionId, ref: React.RefObject<HTMLElement>) => void;
}

export function TitleSection({
  onSectionChange,
  sectionId,
  registerSection,
}: TitleSectionProps) {
  return (
    <AnimatedSection
      sectionId={sectionId}
      registerSection={registerSection}
      hasScale={true}
    >
      <h1 className="relative z-10 text-hero font-bold text-white text-center">
        Your 2025
      </h1>
    </AnimatedSection>
  );
}
