"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import type { AnalysisResult, PhotoWithMetadata } from "@features/report/types";
import type { ExifData } from "@shared/lib/exifExtractor";
import { MonthStatus } from "@shared/lib/exifExtractor";
import { groupPhotosByMonth } from "@shared/lib/groupByMonth";
import { resizeImages } from "@shared/lib/imageResize";
import { analyzePhotos } from "@features/report/api/analyze";
import { trackAnalysisComplete, trackAnalysisError } from "@shared/lib/gtag";

interface AnalysisContextType {
  analysisResult: AnalysisResult | null;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  uploadedPhotos: File[];
  setUploadedPhotos: (photos: File[]) => void;
  uploadedPhotoPreviews: string[];
  setUploadedPhotoPreviews: (previews: string[]) => void;
  exifDataArray: ExifData[];
  setExifDataArray: (exifData: ExifData[]) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  handleAnalyze: () => Promise<void>;
  clearAnalysisData: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(
  undefined
);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [uploadedPhotoPreviews, setUploadedPhotoPreviews] = useState<string[]>(
    []
  );
  const [exifDataArray, setExifDataArray] = useState<ExifData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAnalyze = useCallback(async () => {
    if (uploadedPhotos.length === 0) {
      alert("분석할 사진을 먼저 업로드해주세요.");
      return;
    }

    if (exifDataArray.length !== uploadedPhotos.length) {
      console.error(
        "EXIF 데이터 배열 길이가 업로드된 사진 수와 일치하지 않습니다."
      );
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Context에 저장된 EXIF 데이터 재사용 (이미 업로드 시 추출됨)

      // 2. 원본 이미지를 base64로 변환
      const originalBase64s = await Promise.all(
        uploadedPhotos.map(async (file) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result);
            };
            reader.onerror = () => reject(new Error("파일 읽기 실패"));
            reader.readAsDataURL(file);
          });
        })
      );

      // 3. 이미지 리사이징 및 압축 (Vision API 전송)
      const resizedPhotos = await resizeImages(uploadedPhotos, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.9,
        format: "image/jpeg",
        maxSizeMB: 1,
      });

      // 4. 리사이징된 파일과 EXIF 데이터 매핑 (Context에 저장된 EXIF 데이터 사용)
      const photosWithMetadata: PhotoWithMetadata[] = resizedPhotos.map(
        (resizedFile, index) => {
          const exifData = exifDataArray[index];
          const preview = URL.createObjectURL(resizedFile);
          return {
            file: resizedFile,
            preview,
            dateTaken: exifData.dateTaken,
            month: exifData.month,
            location: exifData.location,
          };
        }
      );

      // 5. 월별로 그룹화
      const groupedReports = groupPhotosByMonth(photosWithMetadata);
      console.log("월별 그룹화 결과:", groupedReports);

      // 6. Server Action에 전달할 reports (이미 카운트만 포함)
      const simplifiedReports = groupedReports;

      // 7. FormData로 파일 전달 (리사이징된 이미지 사용 - Vision API용)
      const formData = new FormData();
      resizedPhotos.forEach((file, index) => {
        formData.append(`photo_${index}`, file);
      });
      formData.append("reports", JSON.stringify(simplifiedReports));

      // 위치 데이터 전달 (있는 경우만)
      const locationData = photosWithMetadata
        .map((photo, index) => ({
          index,
          location: photo.location,
        }))
        .filter((item) => item.location !== undefined);
      if (locationData.length > 0) {
        formData.append("locations", JSON.stringify(locationData));
      }

      // 8. Server Action 호출하여 분석
      const { result } = await analyzePhotos(formData);

      // 서버 반환값과 클라이언트 EXIF 데이터 일치 여부 검증
      if (result.monthlyReports.length !== simplifiedReports.length) {
        console.error(
          "월별 리포트 개수 불일치:",
          result.monthlyReports.length,
          "vs",
          simplifiedReports.length
        );
      }

      // 9. 결과에 원본 base64 photos 배열 복원
      // 클라이언트에서 추출한 EXIF 기반 month 값을 사용 (서버 반환값 대신)
      const resultWithPhotos = {
        ...result,
        monthlyReports: result.monthlyReports.map((analyzedReport, index) => {
          const clientMonth = simplifiedReports[index]?.month;
          const serverMonth = analyzedReport.month;

          // 월 정보 불일치 시 경고
          if (clientMonth && serverMonth && clientMonth !== serverMonth) {
            console.warn(
              `월 정보 불일치 (인덱스 ${index}): 클라이언트=${clientMonth}, 서버=${serverMonth}`
            );
          }

          if (!clientMonth) {
            console.warn(
              `월 정보를 찾을 수 없습니다. 인덱스: ${index}`,
              simplifiedReports
            );
          }

          const startIndex = simplifiedReports
            .slice(0, index)
            .reduce((sum, r) => sum + r.photoCount, 0);
          const photoCount = simplifiedReports[index].photoCount;
          // 원본 base64 이미지 사용 (화면 표시용, 고해상도)
          const originalBase64Photos = originalBase64s.slice(
            startIndex,
            startIndex + photoCount
          );
          return {
            ...analyzedReport,
            month: clientMonth || serverMonth || MonthStatus.UNKNOWN, // EXIF 기반 month 우선 사용 (없으면 "unknown")
            photos: originalBase64Photos,
          };
        }),
      };

      console.log("최종 결과:", {
        monthlyReports: resultWithPhotos.monthlyReports.map((r) => ({
          month: r.month,
          photoCount: r.photos.length,
        })),
      });

      // 10. Context에 저장
      setAnalysisResult(resultWithPhotos);

      // 분석 완료 이벤트 추적
      trackAnalysisComplete(
        uploadedPhotos.length,
        resultWithPhotos.monthlyReports.length
      );

      // Rate limit 상태 갱신을 위한 이벤트 발생
      window.dispatchEvent(new Event("analysisComplete"));

      // 분석 성공 후 맨 위로 스크롤
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("분석 실패:", error);

      // 분석 실패 이벤트 추적
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("분석 에러 상세:", {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        uploadedPhotosCount: uploadedPhotos.length,
        exifDataCount: exifDataArray.length,
      });
      trackAnalysisError(errorMessage);

      // 사용자에게 더 자세한 에러 메시지 표시
      if (errorMessage.includes("하루 최대")) {
        alert(errorMessage);
      } else if (errorMessage.includes("OPENAI_API_KEY")) {
        alert("서버 설정 오류가 발생했습니다. 관리자에게 문의해주세요.");
      } else {
        alert(`분석 중 오류가 발생했습니다: ${errorMessage}`);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedPhotos, exifDataArray, setAnalysisResult, setIsProcessing]);

  const clearAnalysisData = useCallback(() => {
    setAnalysisResult(null);
    setUploadedPhotos([]);
    uploadedPhotoPreviews.forEach((url) => URL.revokeObjectURL(url));
    setUploadedPhotoPreviews([]);
    setExifDataArray([]);
  }, [uploadedPhotoPreviews]);

  return (
    <AnalysisContext.Provider
      value={{
        analysisResult,
        setAnalysisResult,
        uploadedPhotos,
        setUploadedPhotos,
        uploadedPhotoPreviews,
        setUploadedPhotoPreviews,
        exifDataArray,
        setExifDataArray,
        isProcessing,
        setIsProcessing,
        handleAnalyze,
        clearAnalysisData,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);

  if (context === undefined) {
    throw new Error("useAnalysis must be used within an AnalysisProvider");
  }
  return context;
}
