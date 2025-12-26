import type { PhotoWithMetadata } from "@features/report/types";
import { MonthStatus } from "./exifExtractor";

/**
 * 월별 그룹화 결과 타입
 */
export interface MonthlyGroup {
  month: string;
  photoCount: number;
}

/**
 * 사진들을 월별로 그룹화합니다.
 * @param photos 메타데이터가 포함된 사진 배열
 * @returns 월별로 그룹화된 리포트 배열 (카운트만 포함)
 */
export function groupPhotosByMonth(photos: PhotoWithMetadata[]): MonthlyGroup[] {
  // 월별로 그룹화 (카운트만 저장)
  const grouped = photos.reduce((acc, photo, index) => {
    const month = photo.month || MonthStatus.UNKNOWN;
    if (!photo.file) {
      console.warn(`파일이 없는 사진 발견 (인덱스 ${index})`);
      return acc;
    }
    // unknown인 경우도 그룹화에 포함 (사용자에게 알람 없이 Timeline에서만 표시)
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month]++;
    return acc;
  }, {} as Record<string, number>);

  // 리포트 배열로 변환
  const reports: MonthlyGroup[] = Object.entries(grouped)
    .map(([month, photoCount]) => ({
      month,
      photoCount,
    }))
    .sort((a, b) => {
      // "unknown"은 마지막에 배치
      if (a.month === MonthStatus.UNKNOWN) return 1;
      if (b.month === MonthStatus.UNKNOWN) return -1;
      return a.month.localeCompare(b.month);
    }); // 월순으로 정렬

  // 디버깅 로그
  console.log("월별 그룹화 결과:", {
    totalPhotos: photos.length,
    reports: reports.map((r) => ({
      month: r.month,
      photoCount: r.photoCount,
    })),
  });

  return reports;
}
