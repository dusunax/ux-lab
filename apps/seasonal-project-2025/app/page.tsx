"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, PlayIcon, RotateCcw } from "lucide-react";
import { Card } from "@shared/ui/Card";
import { PhotoUploader } from "@shared/ui/PhotoUploader";
import { ProcessingOverlay } from "@shared/ui/ProcessingOverlay";
import { useAnalysis } from "@features/report/model/AnalysisContext";
import { extractExifData } from "@shared/lib/exifExtractor";
import { Examples } from "./components/Examples";

const createFileKey = (file: File) =>
  `${file.name}_${file.size}_${file.lastModified}`;
import { AnalysisResultCard } from "@features/report/ui/AnalysisResultCard";
import { RateLimitBadge } from "./components/RateLimitBadge";
import { Footer } from "./components/Footer";

export default function Home() {
  const router = useRouter();
  const {
    analysisResult,
    uploadedPhotos,
    uploadedPhotoPreviews,
    isProcessing,
    handleAnalyze,
    setUploadedPhotos,
    setUploadedPhotoPreviews,
    setAnalysisResult,
    setExifDataArray,
    clearAnalysisData,
  } = useAnalysis();

  const handlePhotosSelected = async (photos: File[]) => {
    setUploadedPhotos(photos);
    // 기존 preview URL 해제
    uploadedPhotoPreviews.forEach((url) => URL.revokeObjectURL(url));
    // 새로운 preview URL 생성
    const previews = photos.map((file) => URL.createObjectURL(file));
    setUploadedPhotoPreviews(previews);

    if (photos.length === 0) {
      setAnalysisResult(null);
      setUploadedPhotoPreviews([]);
      setExifDataArray([]);
      return;
    }

    // EXIF 데이터 추출 (1회만 수행, 이후 재사용)
    const exifDataArray = await Promise.all(
      photos.map(async (file) => {
        const exifData = await extractExifData(file);
        const fileKey = createFileKey(file);
        return {
          ...exifData,
          fileKey,
        };
      })
    );

    setExifDataArray(exifDataArray);
  };

  return (
    <main className="break-keep min-h-[dvh] pt-24 sm:pt-8 px-4 py-8 md:px-8 md:py-16 lg:px-12 lg:py-20">
      <RateLimitBadge />
      <ProcessingOverlay active={isProcessing} />
      <div className="mx-auto max-w-7xl space-y-6 md:space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="mb-4 md:mb-6 inline-flex items-center gap-2 rounded-3xl bg-beige-100 px-4 py-1.5 md:px-6 md:py-2"
          >
            <Sparkles className="h-5 w-5 text-warmGray-600" />
            <span className="text-sm font-medium text-warmGray-700">
              AI 연말 회고
            </span>
          </motion.div>

          <h1 className="mb-3 md:mb-4 text-title-main font-bold tracking-tight text-warmGray-900">
            Project Afterglow
          </h1>
          <p className="mx-auto max-w-2xl mt-4 md:mt-8 text-warmGray-600 md:text-xl">
            올해의 소중한 순간들을
            <br className="block md:hidden " /> AI와 함께 되돌아보며,
            <br /> 따뜻한 회고를 만들어보세요.
          </p>
        </motion.div>

        {/* 분석 결과: 키워드와 올해의 한 문장 */}
        {analysisResult && (
          <div>
            {/* 결과 리포트 상세 보기 버튼 */}
            <div className="w-full flex items-center gap-2 md:gap-3 mb-4 md:mb-6 z-10 relative">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                onClick={() => {
                  router.push("/report");
                }}
                type="button"
                data-ga-label="결과 플레이"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-4 rounded-2xl bg-warmGray-900 text-white text-base md:text-lg font-semibold hover:bg-warmGray-800 transition-colors duration-200 shadow-lg cursor-pointer"
              >
                <PlayIcon className="w-6 h-6" />
                결과 플레이
              </motion.button>
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                onClick={() => {
                  clearAnalysisData();
                }}
                type="button"
                data-ga-label="다시 하기"
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-warmGray-400 text-white hover:bg-warmGray-500 transition-colors duration-200 shadow-lg cursor-pointer"
                title="다시 하기"
              >
                <RotateCcw className="w-5 h-5" />
              </motion.button>
            </div>
            <AnalysisResultCard
              analysisResult={analysisResult}
              photoPreviews={uploadedPhotoPreviews}
            />
          </div>
        )}

        <Card className="space-y-10" padding="lg">
          <div className="flex flex-col gap-4 md:gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-2xl font-semibold text-warmGray-900 break-keep">
                사진 업로드
              </h2>
              <p className="text-warmGray-600 break-keep">
                최대 24장까지 업로드하고 <br className="block sm:hidden " />
                AI 분석을 시작하세요.
              </p>
            </div>
            <div className="relative group text-center md:text-left">
              <button
                className="rounded-2xl bg-warmGray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-warmGray-800 active:bg-warmGray-700 disabled:opacity-50 disabled:cursor-default"
                onClick={handleAnalyze}
                disabled={isProcessing || uploadedPhotos.length === 0}
                data-ga-label="AI 분석 시작"
              >
                {isProcessing ? "분석 중..." : "AI 분석 시작"}
              </button>
              {uploadedPhotos.length === 0 && !isProcessing && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-warmGray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  사진을 업로드해주세요
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-warmGray-900"></div>
                </div>
              )}
            </div>
          </div>
          <PhotoUploader
            maxPhotos={24}
            onPhotosSelected={handlePhotosSelected}
          />
          <Examples />
        </Card>
      </div>
      <Footer />
    </main>
  );
}
