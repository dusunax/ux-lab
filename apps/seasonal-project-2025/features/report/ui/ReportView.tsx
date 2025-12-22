"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Button } from "@shared/ui/Button";
import { Timeline } from "@features/report/ui/Timeline";
import { useReportSections } from "@/report/hooks/useReportSections";
import { TitleSection } from "@/report/components/TitleSection";
import { SentenceSection } from "@/report/components/SentenceSection";
import { PersonalitySection } from "@/report/components/PersonalitySection";
import { MeSection } from "@/report/components/MeSection";
import { MoodSection } from "@/report/components/MoodSection";
import { ContinueSection } from "@/report/components/ContinueSection";
import type { AnalysisResult } from "@features/report/types";

interface ReportViewProps {
  analysisResult: AnalysisResult;
}

export function ReportView({ analysisResult }: ReportViewProps) {
  const router = useRouter();
  const { currentSection, totalScrollHeight, animations } = useReportSections();

  // 배경 그라데이션 생성 (percentage 반영, 자연스러운 전환)
  const getGradientColors = (colors: typeof analysisResult.primaryColor) => {
    if (!colors || colors.length === 0) {
      return "linear-gradient(135deg, #8B7355 0%, #A8967F 50%, #C9BFB0 100%)";
    }

    // 최대 3개로 제한
    const limitedColors = colors.slice(0, 3);

    if (limitedColors.length === 1) {
      return limitedColors[0].hexCode;
    }

    if (limitedColors.length === 2) {
      // 2개 색상인 경우
      const color1 = limitedColors[0];
      const color2 = limitedColors[1];
      const percentage1 = color1.percentage * 100;
      const transitionStart = Math.max(0, percentage1 - 15);
      const transitionEnd = Math.min(100, percentage1 + 15);
      return `linear-gradient(135deg, ${color1.hexCode} 0%, ${color1.hexCode} ${transitionStart}%, ${color2.hexCode} ${transitionEnd}%, ${color2.hexCode} 100%)`;
    }

    // 3개 색상인 경우 - percentage를 누적하여 자연스러운 전환
    const color1 = limitedColors[0];
    const color2 = limitedColors[1];
    const color3 = limitedColors[2];

    const p1 = color1.percentage * 100;
    const p2 = (color1.percentage + color2.percentage) * 100;

    // 각 색상 전환 지점을 부드럽게 설정
    const transition1Start = Math.max(0, p1 - 10);
    const transition1End = Math.min(p2, p1 + 10);
    const transition2Start = Math.max(p1, p2 - 10);
    const transition2End = Math.min(100, p2 + 10);

    return `linear-gradient(135deg, ${color1.hexCode} 0%, ${color1.hexCode} ${transition1Start}%, ${color2.hexCode} ${transition1End}%, ${color2.hexCode} ${transition2Start}%, ${color3.hexCode} ${transition2End}%, ${color3.hexCode} 100%)`;
  };

  const gradientColors = getGradientColors(analysisResult.primaryColor);

  return (
    <div className="break-keep relative min-h-screen scrollbar-hide">
      <div style={{ height: `${totalScrollHeight}vh` }} className="bg-black" />

      <TitleSection
        opacity={animations.title.opacity}
        scale={animations.title.scale}
        y={animations.title.y}
      />

      <SentenceSection
        opacity={animations.sentence.opacity}
        y={animations.sentence.y}
        yearSentence={analysisResult.yearSentence}
      />

      <PersonalitySection
        opacity={animations.personality.opacity}
        y={animations.personality.y}
        personality={analysisResult.personality}
      />

      <MeSection
        opacity={animations.me.opacity}
        y={animations.me.y}
        personalityType={analysisResult.personalityType}
        favoriteThings={analysisResult.favoriteThings}
      />

      <MoodSection
        opacity={animations.mood.opacity}
        y={animations.mood.y}
        keywords={analysisResult.keywords}
        primaryColor={analysisResult.primaryColor}
        gradientColors={gradientColors}
        isCurrentSection={currentSection === "mood"}
      />

      <ContinueSection
        opacity={animations.continue.opacity}
        y={animations.continue.y}
        advice={analysisResult.advice}
        luckyItem={analysisResult.luckyItem}
        avoidItem={analysisResult.avoidItem}
      />

      <Timeline reports={analysisResult.monthlyReports} />

      {/* Footer */}
      <div className="relative z-20 bg-warmGray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.push("/")}
              data-ga-label="리포트에서 돌아가기"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              돌아가기
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
