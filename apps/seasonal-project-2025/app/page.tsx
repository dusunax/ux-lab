"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Copy, PlayIcon, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@shared/ui/Card";
import { Badge } from "@shared/ui/Badge";
import { PhotoUploader } from "@shared/ui/PhotoUploader";
import { ProcessingOverlay } from "@shared/ui/ProcessingOverlay";
import { mockReports } from "@features/report/data/mockReports";
import { extractExifData } from "@shared/lib/exifExtractor";
import { groupPhotosByMonth } from "@shared/lib/groupByMonth";
import { analyzePhotos } from "@features/report/api/analyze";
import { useAnalysis } from "@features/report/model/AnalysisContext";
import type {
  PhotoWithMetadata,
  AfterglowReport,
} from "@features/report/types";

export default function Home() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [displayReports, setDisplayReports] =
    useState<AfterglowReport[]>(mockReports);
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
      setDisplayReports(mockReports);
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
      // 1. EXIF 데이터 추출
      const photosWithMetadata: PhotoWithMetadata[] = await Promise.all(
        uploadedPhotos.map(async (file) => {
          const exifData = await extractExifData(file);
          const preview = URL.createObjectURL(file);
          return {
            file,
            preview,
            dateTaken: exifData.dateTaken,
            month: exifData.month,
          };
        })
      );

      // 2. 월별로 그룹화
      const groupedReports = groupPhotosByMonth(photosWithMetadata);

      // 3. Server Action에 전달할 reports 단순화 (blob URL 제거)
      const simplifiedReports = groupedReports.map((report) => ({
        month: report.month,
        photoCount: report.photos.length,
      }));

      // 4. FormData로 파일 전달
      const formData = new FormData();
      uploadedPhotos.forEach((file, index) => {
        formData.append(`photo_${index}`, file);
      });
      formData.append("reports", JSON.stringify(simplifiedReports));

      // 5. Server Action 호출하여 분석 (서버에서 base64 변환)
      const { result, photoBase64s } = await analyzePhotos(formData);

      // 6. 결과에 base64 photos 배열 복원
      const resultWithPhotos = {
        ...result,
        reports: result.reports.map((analyzedReport, index) => {
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

      // 7. Context에 저장 (분석 완료 직후)
      console.log("Context에 분석 결과 저장 중...", {
        hasReports: resultWithPhotos.reports.length > 0,
        reportsCount: resultWithPhotos.reports.length,
        firstReportPhotos: resultWithPhotos.reports[0]?.photos?.length || 0,
      });
      setAnalysisResult(resultWithPhotos);
      setPhotoBase64s(photoBase64s);
      setDisplayReports(resultWithPhotos.reports);
      console.log("Context에 분석 결과 저장 완료");
    } catch (error) {
      console.error("분석 실패:", error);
      alert("분석 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-12 md:px-8 md:py-16 lg:px-12 lg:py-20">
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
            className="mb-6 inline-flex items-center gap-2 rounded-3xl bg-beige-100 px-6 py-3"
          >
            <Sparkles className="h-5 w-5 text-warmGray-600" />
            <span className="text-sm font-medium text-warmGray-700">
              AI 기반 연말 회고
            </span>
          </motion.div>

          <h1 className="mb-4 text-4xl font-bold tracking-tight text-warmGray-900 md:text-5xl lg:text-6xl">
            Project Afterglow
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-warmGray-600 md:text-xl">
            올해의 소중한 순간들을 AI와 함께 되돌아보며, 따뜻한 회고를
            만들어보세요.
          </p>
        </motion.div>

        {/* 분석 결과: 키워드와 올해의 한 문장 */}
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl p-8 border border-beige-200 relative overflow-hidden"
            style={{
              background:
                analysisResult.primaryColor.length > 1
                  ? `linear-gradient(135deg, ${analysisResult.primaryColor
                      .map((c) => c.hexCode)
                      .join(", ")})`
                  : analysisResult.primaryColor[0]?.hexCode || "#8B7355",
            }}
          >
            {/* 결과 리포트 상세 보기 버튼 */}
            <div className="w-full flex items-center gap-3 mb-8 z-10 relative">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                onClick={() => {
                  router.push("/report");
                }}
                type="button"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-warmGray-900 text-white text-lg font-semibold hover:bg-warmGray-800 transition-colors duration-200 shadow-lg cursor-pointer"
              >
                <PlayIcon className="w-6 h-6" />
                플레이
              </motion.button>
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                onClick={() => {
                  clearAnalysisData();
                  setDisplayReports(mockReports);
                }}
                type="button"
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-warmGray-400 text-white hover:bg-warmGray-500 transition-colors duration-200 shadow-lg cursor-pointer"
                title="다시 하기"
              >
                <RotateCcw className="w-5 h-5" />
              </motion.button>
            </div>

            {/* 배경 오버레이로 텍스트 가독성 향상 */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/20 pointer-events-none" />

            {/* 결과 리포트 카드 */}
            <div className="relative space-y-8">
              {/* 업로드한 사진 콜라주 */}
              {uploadedPhotoPreviews.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
                  {uploadedPhotoPreviews.map((preview, index) => (
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

                <div className="rounded-3xl bg-white/40 backdrop-blur-xl p-6 border border-white/50 shadow-lg shadow-black/5">
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
                      {analysisResult.personalityType.traits.map(
                        (trait, index) => (
                          <Badge key={index} size="md">
                            {trait}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-white/40 backdrop-blur-xl p-6 border border-white/50 shadow-lg shadow-black/5">
                  <h3 className="mb-3 text-sm font-semibold text-warmGray-900">
                    당신이 좋아하는 것
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.favoriteThings.map((thing, index) => (
                      <Badge key={index} size="md">
                        {thing}
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
        )}

        <Card className="space-y-10" padding="lg">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2 text-left">
              <h2 className="text-2xl font-semibold text-warmGray-900">
                사진 업로드
              </h2>
              <p className="text-warmGray-600">
                최대 30장까지 업로드하고 AI 분석을 시작하세요.
              </p>
            </div>
            <button
              className="rounded-2xl bg-warmGray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-warmGray-800 active:bg-warmGray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleAnalyze}
              disabled={isProcessing || uploadedPhotos.length === 0}
            >
              {isProcessing ? "분석 중..." : "AI 분석 시작"}
            </button>
          </div>

          <PhotoUploader
            maxPhotos={30}
            onPhotosSelected={handlePhotosSelected}
          />

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-warmGray-400" />
              <p className="text-sm text-warmGray-600">
                분석 전, 아래 예시를 참고하여 회고를 설계하세요.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {mockReports.map((report) => (
                <div
                  key={report.month}
                  className="group relative overflow-hidden rounded-3xl border border-beige-200 bg-beige-50/60"
                >
                  {/* 콜라주 형태의 사진 그리드 */}
                  {/* <div className="aspect-video w-full">
                    {report.photos.length === 1 ? (
                      <div className="h-full w-full overflow-hidden bg-warmGray-100">
                        <img
                          src={report.photos[0]}
                          alt={report.month}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : report.photos.length === 2 ? (
                      <div className="grid h-full grid-cols-2 gap-0.5">
                        {report.photos.map((photo, idx) => (
                          <div
                            key={idx}
                            className="overflow-hidden bg-warmGray-100"
                          >
                            <img
                              src={photo}
                              alt={`${report.month} ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid h-full grid-cols-2 gap-0.5">
                        {report.photos.slice(0, 3).map((photo, idx) => (
                          <div
                            key={idx}
                            className={`overflow-hidden bg-warmGray-100 ${
                              idx === 0 ? "row-span-2" : ""
                            }`}
                          >
                            <img
                              src={photo}
                              alt={`${report.month} ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                        {report.photos.length > 3 && (
                          <div className="relative overflow-hidden bg-warmGray-900/60">
                            <img
                              src={report.photos[3]}
                              alt={`${report.month} 4`}
                              className="h-full w-full object-cover opacity-50"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-sm font-semibold text-white">
                                +{report.photos.length - 3}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div> */}

                  {/* 텍스트 오버레이 */}
                  {/* <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 flex flex-col justify-end">
                    <div className="mb-2 text-xs font-semibold text-white/80">
                      {report.month}
                    </div>
                    <div className="mb-2 text-xl font-bold text-white">
                      {report.mood}
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed">
                      {report.summary}
                    </p>
                  </div> */}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}