/**
 * EXIF 데이터 추출 유틸리티
 * 브라우저 단에서 이미지의 EXIF 메타데이터를 추출합니다.
 */

export interface ExifData {
  dateTaken?: Date;
  month?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

/**
 * 이미지 파일에서 EXIF 데이터를 추출합니다.
 * @param file 이미지 파일
 * @returns EXIF 데이터 (날짜 정보)
 */
export async function extractExifData(file: File): Promise<ExifData> {
  try {
    // exifr 라이브러리를 동적으로 import
    const exifr = await import("exifr");
    
    const exifData = await exifr.parse(file, {
      pick: ["DateTimeOriginal", "CreateDate", "ModifyDate", "GPSLatitude", "GPSLongitude", "GPSLatitudeRef", "GPSLongitudeRef"],
      translateKeys: false,
      translateValues: false,
    });

    let dateTaken: Date | undefined;

    // 날짜 정보 추출 (우선순위: DateTimeOriginal > CreateDate > ModifyDate)
    if (exifData?.DateTimeOriginal) {
      dateTaken = new Date(exifData.DateTimeOriginal);
    } else if (exifData?.CreateDate) {
      dateTaken = new Date(exifData.CreateDate);
    } else if (exifData?.ModifyDate) {
      dateTaken = new Date(exifData.ModifyDate);
    } else {
      // EXIF 데이터가 없으면 파일의 lastModified 사용
      dateTaken = new Date(file.lastModified);
    }

    // 유효한 날짜인지 확인
    if (isNaN(dateTaken.getTime())) {
      dateTaken = new Date(file.lastModified);
    }

    // 월 정보 추출 (YYYY-MM 형식)
    const month = dateTaken
      ? `${dateTaken.getFullYear()}-${String(dateTaken.getMonth() + 1).padStart(2, "0")}`
      : undefined;

    // 위치 정보 추출 (GPS 좌표)
    // GPSLatitude, GPSLongitude는 [도, 분, 초] 배열 형태
    // GPSLatitudeRef: "N" (북위) 또는 "S" (남위)
    // GPSLongitudeRef: "E" (동경) 또는 "W" (서경)
    let location: ExifData["location"] | undefined;
    if (exifData?.GPSLatitude && exifData?.GPSLongitude) {
      try {
        // GPSLatitude와 GPSLongitude는 배열 [도, 분, 초] 또는 숫자일 수 있음
        const latArray = Array.isArray(exifData.GPSLatitude) 
          ? exifData.GPSLatitude 
          : [exifData.GPSLatitude];
        const lonArray = Array.isArray(exifData.GPSLongitude)
          ? exifData.GPSLongitude
          : [exifData.GPSLongitude];

        // 도/분/초를 십진수로 변환
        const latDegrees = latArray[0] || 0;
        const latMinutes = latArray[1] || 0;
        const latSeconds = latArray[2] || 0;
        let latitude = latDegrees + latMinutes / 60 + latSeconds / 3600;

        const lonDegrees = lonArray[0] || 0;
        const lonMinutes = lonArray[1] || 0;
        const lonSeconds = lonArray[2] || 0;
        let longitude = lonDegrees + lonMinutes / 60 + lonSeconds / 3600;

        // 방향에 따라 부호 조정
        const latRef = exifData.GPSLatitudeRef;
        if (latRef === "S") {
          latitude = -latitude;
        }

        const lonRef = exifData.GPSLongitudeRef;
        if (lonRef === "W") {
          longitude = -longitude;
        }

        // 유효성 검증
        if (!isNaN(latitude) && !isNaN(longitude) && 
            latitude >= -90 && latitude <= 90 &&
            longitude >= -180 && longitude <= 180) {
          location = {
            latitude,
            longitude,
          };
        }
      } catch (error) {
        console.warn("GPS 좌표 변환 실패:", error);
      }
    }

    return {
      dateTaken,
      month,
      location,
    };
  } catch (error) {
    console.warn("EXIF 데이터 추출 실패, 파일 수정 시간 사용:", error);
    // EXIF 추출 실패 시 파일의 lastModified 사용
    const dateTaken = new Date(file.lastModified);
    const month = `${dateTaken.getFullYear()}-${String(dateTaken.getMonth() + 1).padStart(2, "0")}`;
    return { dateTaken, month };
  }
}

/**
 * 여러 이미지 파일에서 EXIF 데이터를 일괄 추출합니다.
 * @param files 이미지 파일 배열
 * @returns EXIF 데이터 배열
 */
export async function extractExifDataBatch(
  files: File[]
): Promise<ExifData[]> {
  return Promise.all(files.map((file) => extractExifData(file)));
}

