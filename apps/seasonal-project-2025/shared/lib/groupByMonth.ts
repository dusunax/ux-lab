import type { PhotoWithMetadata, MonthlyReport } from "@features/report/types";

/**
 * 사진들을 월별로 그룹화합니다.
 * @param photos 메타데이터가 포함된 사진 배열
 * @returns 월별로 그룹화된 리포트 배열
 */
export function groupPhotosByMonth(
  photos: PhotoWithMetadata[]
): Omit<MonthlyReport, "summary" | "mood">[] {
  // 월별로 그룹화
  const grouped = photos.reduce(
    (acc, photo) => {
      const month = photo.month || "unknown";
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(photo.preview);
      return acc;
    },
    {} as Record<string, string[]>
  );

  // 리포트 배열로 변환
  const reports: Omit<MonthlyReport, "summary" | "mood">[] = Object.entries(
    grouped
  )
    .map(([month, photoUrls]) => ({
      month,
      photos: photoUrls,
    }))
    .sort((a, b) => a.month.localeCompare(b.month)); // 월순으로 정렬

  return reports;
}

