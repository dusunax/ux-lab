/**
 * 브라우저 단에서 이미지를 리사이징하는 유틸리티
 */

export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "image/jpeg" | "image/png" | "image/webp";
}

export async function resizeImage(file: File, options: ResizeOptions = {}): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.85, format = "image/jpeg" } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

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

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("이미지 변환에 실패했습니다."));
              return;
            }

            const resizedFile = new File([blob], file.name, {
              type: format,
              lastModified: Date.now(),
            });

            resolve(resizedFile);
          },
          format,
          quality
        );
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