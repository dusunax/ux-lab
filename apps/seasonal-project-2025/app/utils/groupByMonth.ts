import type { PhotoWithMetadata, AfterglowReport } from "@/types/report";

/**
 * 사진들을 월별로 그룹화합니다.
 * @param photos 메타데이터가 포함된 사진 배열
 * @returns 월별로 그룹화된 리포트 배열
 */
export function groupPhotosByMonth(
  photos: PhotoWithMetadata[]
): Omit<AfterglowReport, "keywords" | "yearSentence">[] {
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
  const reports: Omit<AfterglowReport, "keywords" | "yearSentence">[] = Object.entries(
    grouped
  )
    .map(([month, photoUrls]) => ({
      month,
      summary: "", // AI 분석 후 채워짐
      mood: "", // AI 분석 후 채워짐
      photos: photoUrls,
    }))
    .sort((a, b) => a.month.localeCompare(b.month)); // 월순으로 정렬

  return reports;
}

