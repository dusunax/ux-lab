"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { Share2, RotateCcw } from "lucide-react";
import { Badge } from "@shared/ui/Badge";
import { Button } from "@shared/ui/Button";
import { Timeline } from "@features/report/ui/Timeline";
import { useAnalysis } from "@features/report/model/AnalysisContext";
import { toast } from "sonner";

export default function ReportPage() {
  const router = useRouter();
  const { analysisResult } = useAnalysis();
  const { scrollYProgress } = useScroll();
  const coverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!analysisResult) {
      router.push("/");
      return;
    }
  }, [analysisResult, router]);

  // 섹션 정의 (순서대로 추가하면 자동으로 스크롤 범위 계산)
  const sections = [
    { id: "title", name: "Your 2025", hasScale: true },
    { id: "sentence", name: "올해의 한 문장" },
    { id: "personality", name: "성향" },
    { id: "me", name: "Me at 2025" },
    { id: "mood", name: "Mood at 2025" },
    { id: "continue", name: "2026 to be continue" },
  ];

  // 각 섹션이 100vh를 차지하도록 스크롤 범위 계산
  const totalSections = sections.length;
  // 총 스크롤 높이 (vh 단위) - 마지막 섹션 이후 100vh 여백 포함
  const totalScrollHeight = totalSections * 100 + 100;

  // 스크롤 progress는 0~1 사이이므로, totalScrollHeight를 기준으로 계산
  const sectionHeight = 100 / totalScrollHeight; // 각 섹션이 차지하는 스크롤 비율 (vh 기준)

  // 동적으로 각 섹션의 스크롤 범위 계산 함수
  // fade in/out을 위해 4개의 구간으로 나눔: [시작, fade in 완료, fade out 시작, 끝]
  const getSectionRange = (index: number) => {
    const start = (index * 100) / totalScrollHeight;
    const end = ((index + 1) * 100) / totalScrollHeight;
    const fadeInEnd = start + sectionHeight * 0.2; // 20% 지점에서 fade in 완료
    const fadeOutStart = end - sectionHeight * 0.2; // 끝에서 20% 지점에서 fade out 시작
    return [start, fadeInEnd, fadeOutStart, end];
  };

  // 마지막 섹션 (In 2026)의 범위 - 100vh 표시 후 100vh 동안 fade out
  const getContinueRange = () => {
    const start = ((totalSections - 1) * 100) / totalScrollHeight; // 5번째 섹션 시작 (500vh)
    const fadeInEnd = start + (100 / totalScrollHeight) * 0.2; // 빠르게 나타남
    const fadeOutStart = ((totalSections - 1) * 100 + 100) / totalScrollHeight; // 100vh 후 fade out 시작 (600vh)
    const end = totalScrollHeight / totalScrollHeight; // 완전히 사라짐 (700vh)
    return [start, fadeInEnd, fadeOutStart, end];
  };

  if (!analysisResult) {
    return null;
  }

  // 각 섹션의 애니메이션 값 계산
  // 첫 번째 섹션(title)은 fade out만 필요하므로 2개 구간 사용
  const titleRange = [0, 100 / totalScrollHeight];
  const titleOpacity = useTransform(scrollYProgress, titleRange, [1, 0]);
  const titleScale = useTransform(scrollYProgress, titleRange, [1, 0.8]);
  const titleY = useTransform(scrollYProgress, titleRange, [0, -50]);

  const sentenceOpacity = useTransform(
    scrollYProgress,
    getSectionRange(1),
    [0, 1, 1, 0]
  );
  const sentenceY = useTransform(
    scrollYProgress,
    getSectionRange(1),
    [50, 0, 0, -50]
  );

  const personalityOpacity = useTransform(
    scrollYProgress,
    getSectionRange(2),
    [0, 1, 1, 0]
  );
  const personalityY = useTransform(
    scrollYProgress,
    getSectionRange(2),
    [50, 0, 0, -50]
  );

  const meOpacity = useTransform(
    scrollYProgress,
    getSectionRange(3),
    [0, 1, 1, 0]
  );
  const meY = useTransform(
    scrollYProgress,
    getSectionRange(3),
    [50, 0, 0, -50]
  );

  const moodOpacity = useTransform(
    scrollYProgress,
    getSectionRange(4),
    [0, 1, 1, 0]
  );
  const moodY = useTransform(
    scrollYProgress,
    getSectionRange(4),
    [50, 0, 0, -50]
  );

  const continueRange = getContinueRange();
  const continueOpacity = useTransform(
    scrollYProgress,
    continueRange,
    [0, 1, 1, 0] // 100vh 후 fade out
  );
  const continueY = useTransform(
    scrollYProgress,
    continueRange,
    [50, 0, 0, -50] // 100vh 후 위로 이동하며 사라짐
  );

  // 배경 그라데이션 생성
  const gradientColors =
    analysisResult.primaryColor?.map((color) => color.hexCode).join(", ") ||
    "#8B7355, #A8967F, #C9BFB0";

  return (
    <div className="relative min-h-screen scrollbar-hide">
      <div style={{ height: `${totalScrollHeight}vh` }} className="bg-black" />

      {/* Cover 섹션 - Your 2025 */}
      <motion.div
        ref={coverRef}
        style={{
          opacity: titleOpacity,
          scale: titleScale,
          y: titleY,
        }}
        className="fixed inset-0 z-10 flex items-center justify-center bg-black"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-6xl md:text-8xl font-bold text-white text-center"
        >
          Your 2025
        </motion.h1>
      </motion.div>

      {/* 올해의 한 문장 섹션 */}
      <motion.div
        style={{
          opacity: sentenceOpacity,
          y: sentenceY,
        }}
        className="fixed inset-0 z-10 flex items-center justify-center bg-black"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-4xl mx-auto px-4"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            2025년은...
          </h2>
          <p className="text-2xl md:text-3xl text-white/90 leading-relaxed">
            {analysisResult.yearSentence}
          </p>
        </motion.div>
      </motion.div>

      {/* 성향 섹션 */}
      <motion.div
        style={{
          opacity: personalityOpacity,
          y: personalityY,
        }}
        className="fixed inset-0 z-10 flex items-center justify-center bg-black"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-4xl mx-auto px-4"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            본인은...
          </h2>
          <p className="text-2xl md:text-3xl text-white/90 leading-relaxed">
            {analysisResult.personality}
          </p>
        </motion.div>
      </motion.div>

      {/* Me at 2025 섹션 */}
      <motion.div
        style={{
          opacity: meOpacity,
          y: meY,
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
                  {analysisResult.personalityType?.type}
                </p>
                <p className="text-white/80 text-sm mb-2">
                  {analysisResult.personalityType?.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center  ">
                  {analysisResult.personalityType?.traits?.map((trait, idx) => (
                    <Badge key={idx} className="border border-white/20">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="w-full bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 text-center">
                <h3 className="text-lg font-semibold text-white mb-3">
                  좋아하는 것들
                </h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {analysisResult.favoriteThings?.map((thing, idx) => (
                    <Badge key={idx} className="border border-white/20">
                      {thing}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Mood at 2025 섹션 */}
      <motion.div
        style={{
          opacity: moodOpacity,
          y: moodY,
          background:
            analysisResult.primaryColor &&
            analysisResult.primaryColor.length > 1
              ? `linear-gradient(135deg, ${gradientColors})`
              : analysisResult.primaryColor?.[0]?.hexCode || "#8B7355",
        }}
        className="fixed inset-0 z-10 flex items-center justify-center"
      >
        <div className="absolute -top-[1px] left-0 h-2 w-full bg-gradient-to-b from-black to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 w-full text-black">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
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
            <h2 className="relative z-10 text-3xl md:text-4xl font-bold text-center mb-8">
              Mood at 2025
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="w-full bg-white/50 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-md">
                <h3 className="text-lg font-semibold mb-4">핵심 키워드</h3>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.keywords?.map((keyword, idx) => (
                    <Badge key={idx} className="border border-black/50">
                      {keyword.emoji} {keyword.text}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="w-full bg-white/50 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-md">
                <h3 className="text-lg font-semibold mb-4">올해의 컬러</h3>
                <div className="space-y-3">
                  {analysisResult.primaryColor?.map((color, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-black/20 shadow-sm"
                      onClick={() => {
                        navigator.clipboard.writeText(color.hexCode);
                        toast.success("복사되었습니다!", {
                          description: color.hexCode,
                        });
                      }}
                    >
                      <div
                        className="w-12 h-12 rounded-lg border border-black/60 "
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
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 h-2 w-full bg-gradient-to-t from-black to-transparent pointer-events-none" />
      </motion.div>

      {/* 2026 to be continue 섹션 */}
      <motion.div
        style={{
          opacity: continueOpacity,
          y: continueY,
        }}
        className="fixed inset-0 z-0 flex items-center justify-center bg-black"
      >
        <div className="mx-auto px-4 w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-8">
              In 2026
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="w-full md:col-span-2 gap-6 bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 text-center">
                <h3 className="text-lg font-semibold text-white mb-3">
                  다가오는 2026년에는...
                </h3>
                <p className="text-white/90">{analysisResult.advice}</p>
              </div>
              <div className="w-full grid-cols-1 gap-6 bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-3">
                  행운의 아이템
                </h3>
                <p className="text-white/90">{analysisResult.luckyItem}</p>
              </div>
              <div className="w-full grid-cols-1 gap-6 bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-3">
                  피해야할 것
                </h3>
                <p className="text-white/90">{analysisResult.avoidItem}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Timeline 섹션 */}
      <Timeline reports={analysisResult.reports} />

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
