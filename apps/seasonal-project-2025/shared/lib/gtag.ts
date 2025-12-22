/**
 * Google Analytics 이벤트 추적 유틸리티
 */

declare global {
  interface Window {
    gtag?: (
      command: "config" | "event" | "js" | "set",
      targetId: string | Date,
      config?: {
        page_path?: string;
        event_category?: string;
        event_label?: string;
        value?: number;
        [key: string]: unknown;
      }
    ) => void;
  }
}

interface GAEventParams {
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: unknown;
}

/**
 * Google Analytics 이벤트 추적
 * @param action 이벤트 액션 (예: 'click', 'submit', 'download')
 * @param params 이벤트 파라미터
 * @example
 * trackEvent('button_click', { event_category: 'engagement', event_label: '결과 플레이' })
 */
export function trackEvent(action: string, params?: GAEventParams) {
  if (typeof window === "undefined" || !window.gtag) {
    return;
  }

  const eventParams = {
    event_name: action,
    ...params,
  };

  // 디버깅용 로그 (개발 환경에서만)
  if (process.env.NODE_ENV === "development") {
    console.log("GA Event:", action, eventParams);
  }

  window.gtag("event", action, eventParams);
}

/**
 * 버튼 클릭 이벤트 추적 (편의 함수)
 * @param buttonName 버튼 이름
 * @param additionalParams 추가 파라미터
 * @example
 * trackButtonClick('결과 플레이', { value: 1 })
 */
export function trackButtonClick(
  buttonName: string,
  additionalParams?: Omit<GAEventParams, "event_category" | "event_label">
) {
  trackEvent("button_click", {
    event_category: "engagement",
    event_label: buttonName,
    ...additionalParams,
  });
}

/**
 * 분석 완료 이벤트 추적
 * @param photoCount 사진 개수
 * @param monthlyReportCount 월별 리포트 개수
 * @example
 * trackAnalysisComplete(24, 12)
 */
export function trackAnalysisComplete(
  photoCount: number,
  monthlyReportCount: number
) {
  trackEvent("analysis_complete", {
    event_category: "conversion",
    event_label: "AI 분석 완료",
    value: photoCount,
    monthly_report_count: monthlyReportCount,
  });
}

/**
 * 분석 실패 이벤트 추적
 * @param errorMessage 에러 메시지
 * @example
 * trackAnalysisError("Network error")
 */
export function trackAnalysisError(errorMessage?: string) {
  trackEvent("analysis_error", {
    event_category: "error",
    event_label: "AI 분석 실패",
    error_message: errorMessage || "Unknown error",
  });
}
