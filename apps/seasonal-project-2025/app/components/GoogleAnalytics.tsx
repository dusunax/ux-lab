"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

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
    dataLayer?: unknown[];
  }
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  useEffect(() => {
    if (!gaId || typeof window === "undefined") return;

    // 페이지 전환 추적
    const url =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    if (window.gtag) {
      window.gtag("config", gaId, {
        page_path: url,
      });
    }
  }, [pathname, searchParams, gaId]);

  // 모든 버튼 클릭 자동 추적
  useEffect(() => {
    if (!gaId || typeof window === "undefined" || !window.gtag) return;

    const handleButtonClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // 버튼 요소 찾기 (button 태그이거나 button 역할을 가진 요소)
      const button = target.closest("button, [role='button'], a[href]");
      if (!button) return;

      // data-ga-ignore 속성이 있으면 추적하지 않음
      if (button.hasAttribute("data-ga-ignore")) return;

      // 버튼 텍스트 추출
      let buttonLabel = "";

      // 1. data-ga-label 속성 우선
      const dataLabel = button.getAttribute("data-ga-label");
      if (dataLabel) {
        buttonLabel = dataLabel;
      } else {
        // 2. aria-label
        const ariaLabel = button.getAttribute("aria-label");
        if (ariaLabel) {
          buttonLabel = ariaLabel;
        } else {
          // 3. 버튼 내부 텍스트
          const textContent = button.textContent?.trim();
          if (textContent) {
            buttonLabel = textContent;
          } else {
            // 4. title 속성
            const title = button.getAttribute("title");
            if (title) {
              buttonLabel = title;
            } else {
              buttonLabel = "Unknown Button";
            }
          }
        }
      }

      // Google Analytics 이벤트 전송
      const eventParams = {
        event_name: "button_click",
        event_category: "engagement",
        event_label: buttonLabel,
        page_path: window.location.pathname + window.location.search,
      };

      // 디버깅용 로그 (개발 환경에서만)
      if (process.env.NODE_ENV === "development") {
        console.log("GA Button Click:", eventParams);
      }

      window.gtag("event", "button_click", eventParams);
    };

    document.addEventListener("click", handleButtonClick, true);

    return () => {
      document.removeEventListener("click", handleButtonClick, true);
    };
  }, [gaId]);

  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_path: window.location.pathname + window.location.search,
          });
        `}
      </Script>
    </>
  );
}
