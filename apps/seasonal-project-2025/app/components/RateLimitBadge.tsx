"use client";

import { useEffect, useState } from "react";
import { getRateLimitStatus } from "@shared/lib/getRateLimitStatus";

export function RateLimitBadge() {
  const [status, setStatus] = useState<{
    remaining: number;
    used: number;
    total: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const result = await getRateLimitStatus();
      setStatus({
        remaining: result.remaining,
        used: result.used,
        total: result.total,
      });
    } catch (error) {
      console.error("Rate limit 상태 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // 5초마다 상태 갱신
    const interval = setInterval(fetchStatus, 5000);

    // 분석 완료 이벤트 리스너
    const handleAnalysisComplete = () => {
      // 분석 완료 후 약간의 지연을 두고 상태 갱신 (DB 업데이트 대기)
      setTimeout(fetchStatus, 1000);
    };

    window.addEventListener("analysisComplete", handleAnalysisComplete);

    return () => {
      clearInterval(interval);
      window.removeEventListener("analysisComplete", handleAnalysisComplete);
    };
  }, []);

  if (isLoading || !status) {
    return null;
  }

  const percentage = (status.used / status.total) * 100;
  const isLow = status.remaining <= 1;

  return (
    <div className="fixed top-4 right-4 z-50 md:top-6 md:right-6">
      <div
        className={`relative px-3 py-2.5 md:px-4 md:py-3 rounded-2xl backdrop-blur-xl border shadow-lg ${
          isLow
            ? "bg-red-50/95 border-red-200/60 text-red-900"
            : "bg-white/95 border-warmGray-200/60 text-warmGray-900"
        }`}
      >
        <div className="flex items-center gap-2.5 md:gap-3">
          <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 36 36"
            >
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className={isLow ? "text-red-200" : "text-warmGray-200"}
                opacity={0.3}
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${percentage}, 100`}
                className={isLow ? "text-red-500" : "text-warmGray-600"}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className={`text-[10px] md:text-xs font-bold ${
                  isLow ? "text-red-600" : "text-warmGray-700"
                }`}
              >
                {status.remaining}
              </span>
            </div>
          </div>
          <div className="flex flex-col min-w-[60px] md:min-w-[70px]">
            <span className="text-[10px] md:text-xs font-medium opacity-70 leading-tight">
              오늘 남은 요청
            </span>
            <span
              className={`text-xs md:text-sm font-bold leading-tight ${
                isLow ? "text-red-600" : "text-warmGray-900"
              }`}
            >
              {status.remaining} / {status.total}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
