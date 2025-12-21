/**
 * base64 문자열을 data URL로 변환하는 유틸 함수
 * @param photo base64 문자열 또는 data URL
 * @returns data URL
 */
export function getPhotoUrl(
  photo: string | undefined | null
): string | null {
  if (!photo) return null;

  // 이미 data URL 형식이면 그대로 반환
  if (photo.startsWith("data:")) return photo;

  // base64 문자열인 경우 data URL로 변환
  return `data:image/jpeg;base64,${photo}`;
}

