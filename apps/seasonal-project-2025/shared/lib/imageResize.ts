/**
 * 브라우저 단에서 이미지를 리사이징하는 유틸리티
 */

export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "image/jpeg" | "image/png" | "image/webp";
  maxSizeMB?: number; // 최대 파일 크기 (MB)
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * 이미지를 리사이징하고 파일 크기를 5MB 이하로 압축합니다.
 */
export async function resizeImage(file: File, options: ResizeOptions = {}): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality: initialQuality = 0.85,
    format = "image/jpeg",
    maxSizeMB = 5,
  } = options;

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // 크기 조정
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context를 가져올 수 없습니다."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // 파일 크기가 목표 크기 이하가 될 때까지 퀄리티를 낮춰가며 압축
        const compress = (currentQuality: number): void => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("이미지 변환에 실패했습니다."));
                return;
              }

              // 파일 크기가 목표 크기 이하이면 완료
              if (blob.size <= maxSizeBytes || currentQuality <= 0.1) {
                const resizedFile = new File([blob], file.name, {
                  type: format,
                  lastModified: Date.now(),
                });
                resolve(resizedFile);
                return;
              }

              // 파일 크기가 목표보다 크면 퀄리티를 낮춰서 다시 압축
              const newQuality = Math.max(0.1, currentQuality - 0.1);
              compress(newQuality);
            },
            format,
            currentQuality
          );
        };

        compress(initialQuality);
      };

      img.onerror = () => reject(new Error("이미지를 로드할 수 없습니다."));
      if (event.target?.result) img.src = event.target.result as string;
    };

    reader.onerror = () => reject(new Error("파일을 읽을 수 없습니다."));
    reader.readAsDataURL(file);
  });
}

export async function resizeImages(files: File[], options: ResizeOptions = {}): Promise<File[]> {
  return Promise.all(files.map((file) => resizeImage(file, options)));
}