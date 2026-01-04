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
       * 5. 월별로 정렬 (사진과 base64 함께 정렬)
       * -------------------------------------------------- */
      // 사진과 base64를 함께 정렬하기 위한 배열 생성
      const photosWithBase64 = photosWithMetadata.map((photo, index) => ({
        photo,
        base64: originalBase64s[index],
      }));

      // 월별로 정렬
      const sortedPhotosWithBase64 = [...photosWithBase64].sort((a, b) => {
        if (a.photo.month === MonthStatus.UNKNOWN) return 1;
        if (b.photo.month === MonthStatus.UNKNOWN) return -1;
        return a.photo.month.localeCompare(b.photo.month);
      });

      // 정렬된 사진과 base64 분리
      const sortedPhotos = sortedPhotosWithBase64.map((item) => item.photo);
      const sortedBase64s = sortedPhotosWithBase64.map((item) => item.base64);

      // 월별 그룹화 (사진 분석용)
      const groupedReports = groupPhotosByMonth(sortedPhotos);

      /* --------------------------------------------------
       * 6. 서버 전송 데이터 구성
       * -------------------------------------------------- */
      const formData = new FormData();
      sortedPhotos.forEach((photo, index) => {
        formData.append(`photo_${index}`, photo.file);
      });
      formData.append("reports", JSON.stringify(groupedReports));

      const locationData = sortedPhotos
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
       * 8. 결과에 사진 매핑 (분석 결과의 month 필드 사용)
       * -------------------------------------------------- */
      // 월별 사진 인덱스 맵 생성
      const monthPhotoMap = new Map<string, string[]>();
      let currentIndex = 0;
      for (const report of groupedReports) {
        monthPhotoMap.set(
          report.month,
          sortedBase64s.slice(currentIndex, currentIndex + report.photoCount)
        );
        currentIndex += report.photoCount;
      }

      // 분석 결과에 사진 매핑
      const resultWithPhotos = {
        ...result,
        monthlyReports: result.monthlyReports.map((report) => ({
          ...report,
          photos: monthPhotoMap.get(report.month) || [],
        })),
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
