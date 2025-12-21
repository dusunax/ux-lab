import { useState, useEffect } from "react";
import { useScroll, useTransform } from "framer-motion";

export type SectionId =
  | "title"
  | "sentence"
  | "personality"
  | "me"
  | "mood"
  | "continue"
  | "timeline";

export interface Section {
  id: SectionId;
  name: string;
  hasScale?: boolean;
}

export const SECTIONS: Section[] = [
  { id: "title", name: "Your 2025", hasScale: true },
  { id: "sentence", name: "올해의 한 문장" },
  { id: "personality", name: "성향" },
  { id: "me", name: "Me at 2025" },
  { id: "mood", name: "Mood at 2025" },
  { id: "continue", name: "2026 to be continue" },
  { id: "timeline", name: "Timeline" },
];

export function useReportSections() {
  const { scrollYProgress } = useScroll();
  const [currentSection, setCurrentSection] = useState<SectionId>("title");

  const totalSections = SECTIONS.length + 1;
  // 각 섹션이 100vh씩 차지하도록 설정
  const totalScrollHeight = totalSections * 100;

  // 현재 섹션 감지
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      // scrollYProgress는 0~1 사이의 값이므로, 이를 섹션 인덱스로 변환
      const sectionIndex = Math.floor(latest * totalSections);
      const clampedIndex = Math.max(
        0,
        Math.min(sectionIndex, SECTIONS.length - 1)
      );
      const section = SECTIONS[clampedIndex];
      if (section) {
        setCurrentSection(section.id);
      }
    });

    return () => unsubscribe();
  }, [scrollYProgress, totalSections]);

  // 섹션 범위 계산 함수 - 각 섹션이 정확히 100vh 범위를 가지도록
  const getSectionRange = (index: number) => {
    // 각 섹션은 전체 스크롤의 1/totalSections씩 차지
    const sectionProgress = 1 / totalSections;
    const start = index * sectionProgress;
    const end = (index + 1) * sectionProgress;

    // fade in/out을 위한 범위 (각 섹션의 20% 지점에서 전환)
    const fadeInEnd = start + sectionProgress * 0.2;
    const fadeOutStart = end - sectionProgress * 0.2;

    return [start, fadeInEnd, fadeOutStart, end];
  };

  // 애니메이션 값 계산
  // Title 섹션 (0번째)
  const titleRange = getSectionRange(0);
  const titleOpacity = useTransform(scrollYProgress, titleRange, [1, 1, 1, 0]);
  const titleScale = useTransform(
    scrollYProgress,
    titleRange,
    [1, 1, 0.8, 0.8]
  );
  const titleY = useTransform(scrollYProgress, titleRange, [0, 0, 0, -50]);

  // Sentence 섹션 (1번째)
  const sentenceRange = getSectionRange(1);
  const sentenceOpacity = useTransform(
    scrollYProgress,
    sentenceRange,
    [0, 1, 1, 0]
  );
  const sentenceY = useTransform(
    scrollYProgress,
    sentenceRange,
    [50, 0, 0, -50]
  );

  // Personality 섹션 (2번째)
  const personalityRange = getSectionRange(2);
  const personalityOpacity = useTransform(
    scrollYProgress,
    personalityRange,
    [0, 1, 1, 0]
  );
  const personalityY = useTransform(
    scrollYProgress,
    personalityRange,
    [50, 0, 0, -50]
  );

  // Me 섹션 (3번째)
  const meRange = getSectionRange(3);
  const meOpacity = useTransform(scrollYProgress, meRange, [0, 1, 1, 0]);
  const meY = useTransform(scrollYProgress, meRange, [50, 0, 0, -50]);

  // Mood 섹션 (4번째)
  const moodRange = getSectionRange(4);
  const moodOpacity = useTransform(scrollYProgress, moodRange, [0, 1, 1, 0]);
  const moodY = useTransform(scrollYProgress, moodRange, [50, 0, 0, -50]);

  // Continue 섹션 (5번째, 마지막)
  const continueRange = getSectionRange(5);
  const continueOpacity = useTransform(
    scrollYProgress,
    continueRange,
    [0, 1, 1, 0]
  );
  const continueY = useTransform(
    scrollYProgress,
    continueRange,
    [50, 0, 0, -50]
  );

  return {
    currentSection,
    totalScrollHeight,
    animations: {
      title: { opacity: titleOpacity, scale: titleScale, y: titleY },
      sentence: { opacity: sentenceOpacity, y: sentenceY },
      personality: { opacity: personalityOpacity, y: personalityY },
      me: { opacity: meOpacity, y: meY },
      mood: { opacity: moodOpacity, y: moodY },
      continue: { opacity: continueOpacity, y: continueY },
    },
  };
}
