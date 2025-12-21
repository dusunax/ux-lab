"use client";

import { useState } from "react";
import { getPhotoUrl } from "@shared/lib/getPhotoUrl";

interface Base64ImageProps {
  /**
   * base64 문자열 또는 data URL
   */
  src: string | undefined | null;
  /**
   * 이미지 alt 텍스트
   */
  alt?: string;
  /**
   * 추가 CSS 클래스
   */
  className?: string;
  /**
   * 이미지 로드 실패 시 표시할 placeholder 텍스트
   */
  placeholderText?: string;
  /**
   * lazy loading 사용 여부
   */
  loading?: "lazy" | "eager";
  /**
   * 이미지 로드 실패 시 콜백
   */
  onError?: (error: Error) => void;
}

/**
 * base64 문자열 또는 data URL을 지원하는 이미지 컴포넌트
 */
export function Base64Image({
  src,
  alt = "",
  className = "",
  placeholderText = "이미지 없음",
  loading = "lazy",
  onError,
}: Base64ImageProps) {
  const [hasError, setHasError] = useState(false);
  const photoUrl = getPhotoUrl(src);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error("Base64Image 로드 실패:", {
      src: src?.substring(0, 50) + "...",
      photoUrl: photoUrl?.substring(0, 50) + "...",
    });
    setHasError(true);
    if (onError) {
      onError(new Error("이미지 로드 실패"));
    }
  };

  // src가 없으면 placeholder 표시
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-warmGray-200 text-warmGray-500 text-sm ${className}`}
      >
        <span>{placeholderText}</span>
      </div>
    );
  }

  // photoUrl 변환 실패 또는 에러 발생 시 placeholder 표시
  if (!photoUrl || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-warmGray-200 text-warmGray-500 text-sm ${className}`}
      >
        <span>{placeholderText}</span>
      </div>
    );
  }

  return (
    <img
      src={photoUrl}
      alt={alt}
      className={className}
      loading={loading}
      onError={handleError}
    />
  );
}
