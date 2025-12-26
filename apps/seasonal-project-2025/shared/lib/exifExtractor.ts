export enum MonthStatus {
  UNKNOWN = "unknown",
}

export interface ExifData {
  fileKey?: string;
  createdAt?: Date;
  month?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}
export async function extractExifData(file: File): Promise<ExifData> {
  try {
    const exifr = await import("exifr");

    let exifData;
    try {
      exifData = await exifr.parse(file, {
        pick: [
          "DateTimeOriginal",
          "CreateDate",
          "ModifyDate",
          "DateTime",
          "DateTimeDigitized",
          "GPSLatitude",
          "GPSLongitude",
          "GPSLatitudeRef",
          "GPSLongitudeRef",
        ],
        translateKeys: true,
        translateValues: false,
        reviveValues: true,
      });
    } catch (parseError) {
      console.warn(`EXIF 파싱 실패: ${file.name}`, parseError);
      exifData = null;
    }

    let createdAt: Date | undefined;

    const parseExifDate = (dateValue: any): Date | undefined => {
      if (!dateValue) return undefined;

      if (dateValue instanceof Date) {
        return isNaN(dateValue.getTime()) ? undefined : dateValue;
      }

      if (typeof dateValue === "string") {
        const exifDatePattern =
          /^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/;
        const match = dateValue.match(exifDatePattern);
        if (match) {
          const [, year, month, day, hour, minute, second] = match;
          const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
          const date = new Date(isoString);
          return isNaN(date.getTime()) ? undefined : date;
        }
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? undefined : date;
      }

      if (typeof dateValue === "number") {
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? undefined : date;
      }

      return undefined;
    };

    if (exifData?.DateTimeOriginal) {
      createdAt = parseExifDate(exifData.DateTimeOriginal);
    } else if (exifData?.["36867"]) {
      createdAt = parseExifDate(exifData["36867"]);
    }

    if (!createdAt && exifData?.CreateDate) {
      createdAt = parseExifDate(exifData.CreateDate);
    }

    if (!createdAt && exifData?.DateTimeDigitized) {
      createdAt = parseExifDate(exifData.DateTimeDigitized);
    } else if (!createdAt && exifData?.["36868"]) {
      createdAt = parseExifDate(exifData["36868"]);
    }

    if (!createdAt && exifData?.DateTime) {
      createdAt = parseExifDate(exifData.DateTime);
    } else if (!createdAt && exifData?.["306"]) {
      createdAt = parseExifDate(exifData["306"]);
    }

    if (!createdAt && exifData?.ModifyDate) {
      createdAt = parseExifDate(exifData.ModifyDate);
    }

    if (!createdAt || isNaN(createdAt.getTime())) {
      createdAt = new Date(file.lastModified);
      if (isNaN(createdAt.getTime())) {
        createdAt = undefined;
      }
    }

    if (!createdAt || isNaN(createdAt.getTime())) {
      let location: ExifData["location"] | undefined;
      if (exifData?.GPSLatitude && exifData?.GPSLongitude) {
        try {
          const latArray = Array.isArray(exifData.GPSLatitude)
            ? exifData.GPSLatitude
            : [exifData.GPSLatitude];
          const lonArray = Array.isArray(exifData.GPSLongitude)
            ? exifData.GPSLongitude
            : [exifData.GPSLongitude];

          const latDegrees = latArray[0] || 0;
          const latMinutes = latArray[1] || 0;
          const latSeconds = latArray[2] || 0;
          let latitude = latDegrees + latMinutes / 60 + latSeconds / 3600;

          const lonDegrees = lonArray[0] || 0;
          const lonMinutes = lonArray[1] || 0;
          const lonSeconds = lonArray[2] || 0;
          let longitude = lonDegrees + lonMinutes / 60 + lonSeconds / 3600;

          const latRef = exifData.GPSLatitudeRef;
          if (latRef === "S") {
            latitude = -latitude;
          }

          const lonRef = exifData.GPSLongitudeRef;
          if (lonRef === "W") {
            longitude = -longitude;
          }

          if (
            !isNaN(latitude) &&
            !isNaN(longitude) &&
            latitude >= -90 &&
            latitude <= 90 &&
            longitude >= -180 &&
            longitude <= 180
          ) {
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
        createdAt: undefined,
        month: MonthStatus.UNKNOWN,
        location,
      };
    }

    const month = `${createdAt.getFullYear()}-${String(
      createdAt.getMonth() + 1
    ).padStart(2, "0")}`;

    let location: ExifData["location"] | undefined;
    if (exifData?.GPSLatitude && exifData?.GPSLongitude) {
      try {
        const latArray = Array.isArray(exifData.GPSLatitude)
          ? exifData.GPSLatitude
          : [exifData.GPSLatitude];
        const lonArray = Array.isArray(exifData.GPSLongitude)
          ? exifData.GPSLongitude
          : [exifData.GPSLongitude];

        const latDegrees = latArray[0] || 0;
        const latMinutes = latArray[1] || 0;
        const latSeconds = latArray[2] || 0;
        let latitude = latDegrees + latMinutes / 60 + latSeconds / 3600;

        const lonDegrees = lonArray[0] || 0;
        const lonMinutes = lonArray[1] || 0;
        const lonSeconds = lonArray[2] || 0;
        let longitude = lonDegrees + lonMinutes / 60 + lonSeconds / 3600;

        const latRef = exifData.GPSLatitudeRef;
        if (latRef === "S") {
          latitude = -latitude;
        }

        const lonRef = exifData.GPSLongitudeRef;
        if (lonRef === "W") {
          longitude = -longitude;
        }
        if (
          !isNaN(latitude) &&
          !isNaN(longitude) &&
          latitude >= -90 &&
          latitude <= 90 &&
          longitude >= -180 &&
          longitude <= 180
        ) {
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
      createdAt,
      month,
      location,
    };
  } catch (error) {
    console.warn(`EXIF 데이터 추출 실패: ${file.name}`, error);
    const createdAt = new Date(file.lastModified);
    if (isNaN(createdAt.getTime())) {
      return {
        createdAt: undefined,
        month: MonthStatus.UNKNOWN,
        location: undefined,
      };
    }
    const month = `${createdAt.getFullYear()}-${String(
      createdAt.getMonth() + 1
    ).padStart(2, "0")}`;
    return {
      createdAt,
      month,
      location: undefined,
    };
  }
}

export async function extractExifDataBatch(files: File[]): Promise<ExifData[]> {
  return Promise.all(files.map((file) => extractExifData(file)));
}
