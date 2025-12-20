/**
 * File을 base64 문자열로 변환하는 클라이언트 사이드 유틸리티
 */

/**
 * File을 base64 문자열로 변환합니다.
 * @param file 이미지 파일
 * @returns base64 문자열 (data URL prefix 제거)
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // data:image/jpeg;base64, 부분 제거
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 여러 File을 base64 문자열 배열로 변환합니다.
 * @param files 이미지 파일 배열
 * @returns base64 문자열 배열
 */
export async function filesToBase64(files: File[]): Promise<string[]> {
  return Promise.all(files.map((file) => fileToBase64(file)));
}

