/**
 * Google Analytics 이벤트 추적 유틸리티
 */

/**
 * Google Analytics 이벤트 이름 enum
 */
export enum GAEventName {
  // 사진 분석 이벤트
  ANALYSIS_START = "analysis_start",
  ANALYSIS_COMPLETE = "analysis_complete",
  ANALYSIS_ERROR = "analysis_error",
  
  // PDF 다운로드 이벤트
  PDF_DOWNLOAD_START = "pdf_download_start",
  PDF_DOWNLOAD = "pdf_download",
  PDF_DOWNLOAD_ERROR = "pdf_download_error",
  
  // 버튼 클릭 이벤트 (동적 생성)
  BUTTON_CLICK = "button_click",
}

declare global {
  interface Window {
    gtag?: (
      command: "config" | "event" | "js" | "set",
      targetId: string | Date,
      config?: {
        page_path?: string;
        value?: number;
        [key: string]: unknown;
      }
    ) => void;
  }
}

interface GAEventParams {
  value?: number;
  [key: string]: unknown;
}

/**
 * Google Analytics 이벤트 추적
 * @param eventName 이벤트 이름
 * @param params 이벤트 파라미터
 * @example
 * trackEvent('사진_분석_시작', { photo_count: 24 })
 */
export function trackEvent(eventName: string, params?: GAEventParams) {
  if (typeof window === "undefined" || !window.gtag) {
    return;
  }

  const eventParams = {
    event_name: eventName,
    ...params,
  };

  // 디버깅용 로그 (개발 환경에서만)
  if (process.env.NODE_ENV === "development") {
    console.log("GA Event:", eventName, eventParams);
  }

  window.gtag("event", eventName, eventParams);
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
  additionalParams?: GAEventParams
) {
  trackEvent(`${GAEventName.BUTTON_CLICK}_${buttonName}`, additionalParams);
}

/**
 * 사진 분석 시작 이벤트 추적
 * @param photoCount 사진 개수
 * @example
 * trackAnalysisStart(24)
 */
export function trackAnalysisStart(photoCount: number) {
  trackEvent(GAEventName.ANALYSIS_START, {
    photo_count: photoCount,
  });
}

/**
 * 사진 분석 완료 이벤트 추적
 * @param photoCount 사진 개수
 * @param monthlyReportCount 월별 리포트 개수
 * @example
 * trackAnalysisComplete(24, 12)
 */
export function trackAnalysisComplete(
  photoCount: number,
  monthlyReportCount: number
) {
  trackEvent(GAEventName.ANALYSIS_COMPLETE, {
    photo_count: photoCount,
    monthly_report_count: monthlyReportCount,
  });
}

/**
 * 사진 분석 실패 이벤트 추적
 * @param errorMessage 에러 메시지
 * @example
 * trackAnalysisError("Network error")
 */
export function trackAnalysisError(errorMessage?: string) {
  trackEvent(GAEventName.ANALYSIS_ERROR, {
    error_message: errorMessage || "Unknown error",
  });
}

/**
 * PDF 다운로드 시작 이벤트 추적
 * @example
 * trackPdfDownloadStart()
 */
export function trackPdfDownloadStart() {
  trackEvent(GAEventName.PDF_DOWNLOAD_START);
}

/**
 * PDF 다운로드 완료 이벤트 추적
 * @example
 * trackPdfDownload()
 */
export function trackPdfDownload() {
  trackEvent(GAEventName.PDF_DOWNLOAD);
}

/**
 * PDF 다운로드 실패 이벤트 추적
 * @param errorMessage 에러 메시지
 * @example
 * trackPdfDownloadError("PDF 생성 실패")
 */
export function trackPdfDownloadError(errorMessage?: string) {
  trackEvent(GAEventName.PDF_DOWNLOAD_ERROR, {
    error_message: errorMessage || "Unknown error",
  });
}

/**
 * 버튼 이름을 소문자와 언더스코어로 정규화
 * @param label 원본 라벨
 * @returns 정규화된 라벨
 */
function normalizeButtonLabel(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * 버튼에서 라벨 추출
 * @param button 버튼 요소
 * @returns 정규화된 버튼 라벨 (소문자, 언더스코어 구분)
 */
function extractButtonLabel(button: Element): string {
  let label = "";

  // 1. data-ga-label 속성 우선
  const dataLabel = button.getAttribute("data-ga-label");
  if (dataLabel) {
    label = dataLabel;
  } else {
    // 2. aria-label
    const ariaLabel = button.getAttribute("aria-label");
    if (ariaLabel) {
      label = ariaLabel;
    } else {
      // 3. 버튼 내부 텍스트
      const textContent = button.textContent?.trim();
      if (textContent) {
        label = textContent;
      } else {
        // 4. title 속성
        const title = button.getAttribute("title");
        if (title) {
          label = title;
        } else {
          label = "Unknown Button";
        }
      }
    }
  }

  return normalizeButtonLabel(label);
}

/**
 * 모든 버튼 클릭 자동 추적 설정
 * @returns cleanup 함수 (이벤트 리스너 제거)
 * @example
 * useEffect(() => {
 *   return setupAutoButtonTracking();
 * }, []);
 */
export function setupAutoButtonTracking(): () => void {
  if (typeof window === "undefined" || !window.gtag) {
    return () => {};
  }

  const handleButtonClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    const button = target.closest("button, [role='button'], a[href]");
    if (!button) return;

    // data-ga-ignore 속성이 있으면 추적하지 않음
    if (button.hasAttribute("data-ga-ignore")) return;

    const buttonLabel = extractButtonLabel(button);

    trackButtonClick(buttonLabel, {
      page_path: window.location.pathname + window.location.search,
    });
  };

  document.addEventListener("click", handleButtonClick, true);

  return () => {
    document.removeEventListener("click", handleButtonClick, true);
  };
}
