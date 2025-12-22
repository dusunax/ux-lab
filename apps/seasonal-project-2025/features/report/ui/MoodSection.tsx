"use client";

import { Badge } from "@shared/ui/Badge";
import { toast } from "sonner";
import type { SectionId } from "@features/report/hooks/useReportSections";
import type { Keyword, PrimaryColor } from "@features/report/types";
import { AnimatedSection } from "./AnimatedSection";

interface MoodSectionProps {
  onSectionChange: (section: SectionId) => void;
  sectionId: SectionId;
  keywords: Keyword[];
  primaryColor: PrimaryColor[];
  gradientColors: string | React.CSSProperties["background"];
  isCurrentSection: boolean;
  registerSection?: (id: SectionId, ref: React.RefObject<HTMLElement>) => void;
}

export function MoodSection({
  onSectionChange,
  sectionId,
  keywords,
  primaryColor,
  gradientColors,
  isCurrentSection,
  registerSection,
}: MoodSectionProps) {
  const handleColorClick = (color: PrimaryColor) => {
    if (!isCurrentSection) return;

    navigator.clipboard.writeText(color.hexCode);
    toast.success("복사되었습니다!", {
      description: color.hexCode,
    });
  };

  return (
    <AnimatedSection
      sectionId={sectionId}
      registerSection={registerSection}
      backgroundStyle={{
        background: gradientColors || primaryColor?.[0]?.hexCode || "#8B7355",
      }}
      backgroundClassName=""
    >
      <div className="absolute -top-[1px] left-0 h-2 w-full bg-gradient-to-b from-black to-transparent pointer-events-none z-20" />
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 w-full text-black">
        <div className="space-y-4 md:space-y-6">
          {/* 배경 흰색 원형 그라데이션 */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center z-0"
          >
            <div
              className="w-[600px] h-[600px] rounded-full bg-warmGray-50 opacity-40 blur-2xl"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                zIndex: 0,
              }}
            ></div>
          </div>
          <h2 className="relative z-10 text-section-sm font-bold text-center mb-6 md:mb-8">
            Mood at 2025
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="w-full bg-white/50 backdrop-blur-xl rounded-3xl p-4 md:p-6 border border-white shadow-md">
              <h3 className="text-lg font-semibold mb-3 md:mb-4">핵심 키워드</h3>
              <div className="flex flex-wrap gap-2">
                {keywords?.map((keyword, idx) => (
                  <Badge key={idx} className="border border-black/50">
                    {keyword.emoji} {keyword.text}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="w-full bg-white/50 backdrop-blur-xl rounded-3xl p-4 md:p-6 border border-white shadow-md">
              <h3 className="text-lg font-semibold mb-3 md:mb-4">올해의 컬러</h3>
              <div className="space-y-2 md:space-y-3">
                {primaryColor?.map((color, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleColorClick(color)}
                    className={`flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-black/20 shadow-sm hover:bg-white/70 transition-colors ${
                      isCurrentSection ? "cursor-pointer " : ""
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-lg border border-black/60"
                      style={{ backgroundColor: color.hexCode }}
                    />
                    <div className="flex-1 flex justify-between pl-1 pr-2">
                      <div className="text-black font-medium">
                        {color.hexCode}
                      </div>
                      <div className="text-black text-base font-medium">
                        {(color.percentage * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-2 w-full bg-gradient-to-t from-black to-transparent pointer-events-none z-20" />
    </AnimatedSection>
  );
}
