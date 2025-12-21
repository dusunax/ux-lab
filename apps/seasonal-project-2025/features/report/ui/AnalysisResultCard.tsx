"use client";

import { motion } from "framer-motion";
import { Copy } from "lucide-react";
import { Badge } from "@shared/ui/Badge";
import { toast } from "sonner";
import type { AnalysisResult } from "@features/report/types";

interface AnalysisResultCardProps {
  analysisResult: AnalysisResult;
  photoPreviews?: string[];
}

export function AnalysisResultCard({
  analysisResult,
  photoPreviews = [],
}: AnalysisResultCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="rounded-3xl p-8 border border-beige-200 relative overflow-hidden"
      style={{
        background: (() => {
          const colors = analysisResult.primaryColor.slice(0, 3); // 최대 3개로 제한
          if (colors.length === 0) {
            return "#8B7355";
          }
          if (colors.length === 1) {
            return colors[0].hexCode;
          }
          if (colors.length === 2) {
            // 2개 색상인 경우
            const color1 = colors[0];
            const color2 = colors[1];
            const percentage1 = color1.percentage * 100;
            const transitionStart = Math.max(0, percentage1 - 15);
            const transitionEnd = Math.min(100, percentage1 + 15);
            return `linear-gradient(135deg, ${color1.hexCode} 0%, ${color1.hexCode} ${transitionStart}%, ${color2.hexCode} ${transitionEnd}%, ${color2.hexCode} 100%)`;
          }
          // 3개 색상인 경우 - percentage를 누적하여 자연스러운 전환
          const color1 = colors[0];
          const color2 = colors[1];
          const color3 = colors[2];
          const p1 = color1.percentage * 100;
          const p2 = (color1.percentage + color2.percentage) * 100;
          const transition1Start = Math.max(0, p1 - 10);
          const transition1End = Math.min(p2, p1 + 10);
          const transition2Start = Math.max(p1, p2 - 10);
          const transition2End = Math.min(100, p2 + 10);
          return `linear-gradient(135deg, ${color1.hexCode} 0%, ${color1.hexCode} ${transition1Start}%, ${color2.hexCode} ${transition1End}%, ${color2.hexCode} ${transition2Start}%, ${color3.hexCode} ${transition2End}%, ${color3.hexCode} 100%)`;
        })(),
      }}
    >
      {/* 배경 오버레이로 텍스트 가독성 향상 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/20 pointer-events-none" />

      {/* 결과 리포트 카드 */}
      <div className="relative space-y-8">
        {/* 업로드한 사진 콜라주 */}
        {photoPreviews.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
            {photoPreviews.map((preview, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 border-white/30 shadow-sm"
              >
                <img
                  src={preview}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-3xl bg-white/40 backdrop-blur-xl p-6 border border-white/50 shadow-lg shadow-black/5 md:col-span-2 lg:col-span-3">
            <h3 className="mb-3 text-sm font-semibold text-warmGray-900">
              올해의 한 문장
            </h3>
            <p className="text-xl font-bold text-warmGray-900 leading-relaxed">
              {analysisResult.yearSentence}
            </p>
          </div>

          <div className="rounded-3xl bg-white/40 backdrop-blur-xl p-6 border border-white/50 shadow-lg shadow-black/5 md:col-span-2 lg:col-span-3">
            <h3 className="mb-3 text-sm font-semibold text-warmGray-900">
              성향
            </h3>
            <p className="text-base text-warmGray-800 leading-relaxed">
              {analysisResult.personality}
            </p>
          </div>

          <div className="rounded-3xl md:col-span-2 lg:col-span-1 bg-white/40 backdrop-blur-xl p-6 border border-white/50 shadow-lg shadow-black/5">
            <h3 className="mb-3 text-sm font-semibold text-warmGray-900">
              핵심 키워드
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysisResult.keywords.map((keyword, index) => (
                <Badge key={index} size="md">
                  <span className="mr-1.5">{keyword.emoji}</span>
                  {keyword.text}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white/40 backdrop-blur-xl p-6 border border-white/50 shadow-lg shadow-black/5 md:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-warmGray-900">
              올해의 컬러
            </h3>
            <div className="flex flex-wrap gap-1">
              {analysisResult.primaryColor.map((color, index) => (
                <button
                  key={index}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(color.hexCode);
                      toast.success("복사되었습니다!", {
                        description: color.hexCode,
                      });
                    } catch (err) {
                      console.error("Failed to copy color:", err);
                      toast.error("복사에 실패했습니다.");
                    }
                  }}
                  className="relative flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/20 transition-colors duration-200 group"
                >
                  <div className="relative w-10 h-10 rounded-xl border-2 border-white/60 shadow-md transition-all duration-200 group-hover:scale-110 overflow-hidden">
                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: color.hexCode }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Copy className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-warmGray-800 group-hover:text-warmGray-900">
                      {color.hexCode}
                    </span>
                    <span className="text-xs text-warmGray-600">
                      {(color.percentage * 100).toFixed(1)}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white/40 backdrop-blur-xl p-6 border border-white/50 shadow-lg shadow-black/5 md:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-warmGray-900">
              심리 타입
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-warmGray-900">
                  {analysisResult.personalityType.type}
                </span>
                <span className="text-sm text-warmGray-700">
                  {analysisResult.personalityType.description}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysisResult.personalityType.traits.map((trait, index) => (
                  <Badge key={index} size="md">
                    <span className="mr-1.5">{trait.emoji}</span>
                    {trait.text}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl md:col-span-2 lg:col-span-1 bg-white/40 backdrop-blur-xl p-6 border border-white/50 shadow-lg shadow-black/5">
            <h3 className="mb-3 text-sm font-semibold text-warmGray-900">
              당신이 좋아하는 것
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysisResult.favoriteThings.map((thing, index) => (
                <Badge key={index} size="md">
                  <span className="mr-1.5">{thing.emoji}</span>
                  {thing.text}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white/40 backdrop-blur-xl p-6 border border-white/50 shadow-lg shadow-black/5 md:col-span-2 lg:col-span-3">
            <h3 className="mb-3 text-sm font-semibold text-warmGray-900">
              내년 당신에게 하는 조언
            </h3>
            <p className="text-base text-warmGray-800 leading-relaxed">
              {analysisResult.advice}
            </p>
          </div>

          <div className="rounded-3xl bg-white/40 backdrop-blur-xl p-6 border-2 border-white/60 shadow-lg shadow-black/5 md:col-span-1 lg:col-span-1">
            <h3 className="mb-3 text-sm font-semibold text-warmGray-900">
              내년의 행운의 아이템
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-beige-200/60 backdrop-blur-sm flex items-center justify-center border border-beige-300/50 shadow-sm">
                <span className="text-2xl">🍀</span>
              </div>
              <p className="text-lg font-semibold text-warmGray-900">
                {analysisResult.luckyItem}
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-white/40 backdrop-blur-xl p-6 border-2 border-red-200/50 shadow-lg shadow-red-200/10 md:col-span-1 lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-warmGray-900">
              내년에 피해야할 것
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-100/60 backdrop-blur-sm flex items-center justify-center border border-red-200/50 shadow-sm">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-lg font-semibold text-warmGray-900">
                {analysisResult.avoidItem}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
