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

const createFileKey = (file: File) =>
  `${file.name}_${file.size}_${file.lastModified}`;

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

    setIsProcessing(true);

    try {
      /* --------------------------------------------------
       * 1. EXIF Map 구성 (fileKey 기반)
       * -------------------------------------------------- */
      const exifMap = new Map<string, ExifData>();
      exifDataArray.forEach((exif) => {
        if (exif.fileKey) {
          exifMap.set(exif.fileKey, exif);
        }
      });

      /* --------------------------------------------------
       * 2. 원본 이미지 base64 변환 (화면 표시용)
       * -------------------------------------------------- */
      const originalBase64s = await Promise.all(
        uploadedPhotos.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(new Error("파일 읽기 실패"));
              reader.readAsDataURL(file);
            })
        )
      );

      /* --------------------------------------------------
       * 3. 이미지 리사이징 (Vision API용)
       * -------------------------------------------------- */
      const resizedPhotos = await resizeImages(uploadedPhotos, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.9,
        format: "image/jpeg",
        maxSizeMB: 1,
      });

      /* --------------------------------------------------
       * 4. 메타데이터 정확 매핑 (index ❌, fileKey ✅)
       * -------------------------------------------------- */
      const photosWithMetadata: PhotoWithMetadata[] = resizedPhotos.map(
        (resizedFile, index) => {
          const originalFile = uploadedPhotos[index];
          const fileKey = createFileKey(originalFile);
          const exifData = exifMap.get(fileKey);

          return {
            file: resizedFile,
            preview: URL.createObjectURL(resizedFile),
            createdAt: exifData?.createdAt,
            month: exifData?.month ?? MonthStatus.UNKNOWN,
            location: exifData?.location,
          };
        }
      );

      /* --------------------------------------------------
       * 5. 월별 그룹화
       * -------------------------------------------------- */
      const groupedReports = groupPhotosByMonth(photosWithMetadata);

      /* --------------------------------------------------
       * 6. 서버 전송 데이터 구성
       * -------------------------------------------------- */
      const formData = new FormData();
      resizedPhotos.forEach((file, index) => {
        formData.append(`photo_${index}`, file);
      });
      formData.append("reports", JSON.stringify(groupedReports));

      const locationData = photosWithMetadata
        .map((photo, index) => ({
          index,
          location: photo.location,
        }))
        .filter((item) => item.location !== undefined);

      if (locationData.length > 0) {
        formData.append("locations", JSON.stringify(locationData));
      }

      /* --------------------------------------------------
       * 7. 분석 요청
       * -------------------------------------------------- */
      const { result } = await analyzePhotos(formData);

      /* --------------------------------------------------
       * 8. 결과 + 원본 이미지 복원
       * -------------------------------------------------- */
      const resultWithPhotos = {
        ...result,
        monthlyReports: result.monthlyReports.map((report, index) => {
          const clientMonth = groupedReports[index]?.month;
          const startIndex = groupedReports
            .slice(0, index)
            .reduce((sum, r) => sum + r.photoCount, 0);
          const photoCount = groupedReports[index].photoCount;

          return {
            ...report,
            month: clientMonth ?? MonthStatus.UNKNOWN,
            photos: originalBase64s.slice(startIndex, startIndex + photoCount),
          };
        }),
      };

      setAnalysisResult(resultWithPhotos);

      trackAnalysisComplete(
        uploadedPhotos.length,
        resultWithPhotos.monthlyReports.length
      );

      window.dispatchEvent(new Event("analysisComplete"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("분석 실패:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      trackAnalysisError(errorMessage);

      alert(`분석 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedPhotos, exifDataArray]);

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
  if (!context) {
    throw new Error("useAnalysis must be used within an AnalysisProvider");
  }
  return context;
}
