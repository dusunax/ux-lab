"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, PlayIcon, RotateCcw } from "lucide-react";
import { Card } from "@shared/ui/Card";
import { PhotoUploader } from "@shared/ui/PhotoUploader";
import { ProcessingOverlay } from "@shared/ui/ProcessingOverlay";
import { extractExifData } from "@shared/lib/exifExtractor";
import { groupPhotosByMonth } from "@shared/lib/groupByMonth";
import { resizeImages } from "@shared/lib/imageResize";
import { analyzePhotos } from "@features/report/api/analyze";
import { useAnalysis } from "@features/report/model/AnalysisContext";
import { Examples } from "./components/Examples";
import { AnalysisResultCard } from "@features/report/ui/AnalysisResultCard";
import {
  trackButtonClick,
  trackAnalysisComplete,
  trackAnalysisError,
} from "@shared/lib/gtag";
import type { PhotoWithMetadata, MonthlyReport } from "@features/report/types";

export default function Home() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [displayReports, setDisplayReports] = useState<MonthlyReport[]>([]);
  const {
    analysisResult,
    setAnalysisResult,
    uploadedPhotos,
    setUploadedPhotos,
    uploadedPhotoPreviews,
    setUploadedPhotoPreviews,
    setPhotoBase64s,
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
      setDisplayReports([]);
      setAnalysisResult(null);
      setUploadedPhotoPreviews([]);
      return;
    }
  };

  const handleAnalyze = async () => {
    if (uploadedPhotos.length === 0) {
      alert("분석할 사진을 먼저 업로드해주세요.");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. 원본 파일에서 EXIF 데이터 먼저 추출 (리사이징 전에 추출해야 EXIF 데이터 보존)
      const exifDataArray = await Promise.all(
        uploadedPhotos.map(async (file) => {
          const exifData = await extractExifData(file);
          return { file, exifData };
        })
      );

      // 2. 이미지 리사이징 및 압축 (24개 이미지 지원을 위해 2MB 이하로 압축)
      const resizedPhotos = await resizeImages(uploadedPhotos, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.8,
        format: "image/jpeg",
        maxSizeMB: 2, // 각 이미지를 2MB 이하로 압축
      });

      // 3. 리사이징된 파일과 EXIF 데이터 매핑
      const photosWithMetadata: PhotoWithMetadata[] = resizedPhotos.map(
        (resizedFile, index) => {
          const { exifData } = exifDataArray[index];
          const preview = URL.createObjectURL(resizedFile);
          return {
            file: resizedFile,
            preview,
            dateTaken: exifData.dateTaken,
            month: exifData.month,
          };
        }
      );

      // 4. 월별로 그룹화
      const groupedReports = groupPhotosByMonth(photosWithMetadata);

      // 5. Server Action에 전달할 reports 단순화 (blob URL 제거)
      const simplifiedReports = groupedReports.map((report) => ({
        month: report.month,
        photoCount: report.photos.length,
      }));

      // 6. FormData로 파일 전달 (리사이징된 이미지 사용)
      const formData = new FormData();
      resizedPhotos.forEach((file, index) => {
        formData.append(`photo_${index}`, file);
      });
      formData.append("reports", JSON.stringify(simplifiedReports));

      // 7. Server Action 호출하여 분석 (서버에서 base64 변환)
      const { result, photoBase64s } = await analyzePhotos(formData);

      // 8. 결과에 base64 photos 배열 복원
      const resultWithPhotos = {
        ...result,
        monthlyReports: result.monthlyReports.map((analyzedReport, index) => {
          const startIndex = simplifiedReports
            .slice(0, index)
            .reduce((sum, r) => sum + r.photoCount, 0);
          const photoCount = simplifiedReports[index].photoCount;
          const base64Photos = photoBase64s.slice(
            startIndex,
            startIndex + photoCount
          );
          return {
            ...analyzedReport,
            photos: base64Photos,
          };
        }),
      };

      // 9. Context에 저장 (분석 완료 직후)
      setAnalysisResult(resultWithPhotos);
      setPhotoBase64s(photoBase64s);
      setDisplayReports(resultWithPhotos.monthlyReports);

      // 분석 완료 이벤트 추적
      trackAnalysisComplete(
        uploadedPhotos.length,
        resultWithPhotos.monthlyReports.length
      );

      // 분석 성공 후 맨 위로 스크롤
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("분석 실패:", error);

      // 분석 실패 이벤트 추적
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      trackAnalysisError(errorMessage);

      alert("분석 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="break-keep min-h-screen px-4 py-12 md:px-8 md:py-16 lg:px-12 lg:py-20">
      <ProcessingOverlay active={isProcessing} />
      <div className="mx-auto max-w-7xl space-y-10">
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
            className="mb-6 inline-flex items-center gap-2 rounded-3xl bg-beige-100 px-6 py-2"
          >
            <Sparkles className="h-5 w-5 text-warmGray-600" />
            <span className="text-sm font-medium text-warmGray-700">
              AI 연말 회고
            </span>
          </motion.div>

          <h1 className="mb-4 text-4xl font-bold tracking-tight text-warmGray-900 md:text-5xl lg:text-6xl">
            Project Afterglow
          </h1>
          <p className="mx-auto max-w-2xl mt-8 text-lg text-warmGray-600 md:text-xl">
            올해의 소중한 순간들을
            <br className="block md:hidden " /> AI와 함께 되돌아보며,
            <br /> 따뜻한 회고를 만들어보세요.
          </p>
        </motion.div>

        {/* 분석 결과: 키워드와 올해의 한 문장 */}
        {analysisResult && (
          <div>
            {/* 결과 리포트 상세 보기 버튼 */}
            <div className="w-full flex items-center gap-3 mb-6 z-10 relative">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                onClick={() => {
                  router.push("/report");
                }}
                type="button"
                data-ga-label="결과 플레이"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-warmGray-900 text-white text-lg font-semibold hover:bg-warmGray-800 transition-colors duration-200 shadow-lg cursor-pointer"
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
                  setDisplayReports([]);
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
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-2xl font-semibold text-warmGray-900 break-keep">
                사진 업로드
              </h2>
              <p className="text-warmGray-600 break-keep">
                최대 24장까지 업로드하고 AI 분석을 시작하세요.
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
    </main>
  );
}
