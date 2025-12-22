"use client";

import { Badge } from "@shared/ui/Badge";
import type { SectionId } from "@features/report/hooks/useReportSections";
import type { PersonalityType, Keyword } from "@features/report/types";
import { AnimatedSection } from "./AnimatedSection";

interface MeSectionProps {
  onSectionChange: (section: SectionId) => void;
  sectionId: SectionId;
  personalityType: PersonalityType;
  favoriteThings: Keyword[];
  registerSection?: (id: SectionId, ref: React.RefObject<HTMLElement>) => void;
}

export function MeSection({
  onSectionChange,
  sectionId,
  personalityType,
  favoriteThings,
  registerSection,
}: MeSectionProps) {
  return (
    <AnimatedSection sectionId={sectionId} registerSection={registerSection}>
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4">
        <div className="space-y-6">
          <h2 className="text-section-sm font-bold text-white text-center mb-8">
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
        </div>
      </div>
    </AnimatedSection>
  );
}
