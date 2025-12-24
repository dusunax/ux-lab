"use server";

import { chromium } from "playwright-core";

// Vercel 환경에서 Chromium 실행 경로 가져오기
let chromiumExecutablePath: string | undefined;

try {
  // @playwright/browser-chromium이 설치되어 있으면 사용
  const chromiumPkg = require("@playwright/browser-chromium");
  chromiumExecutablePath = chromiumPkg.executablePath?.();
} catch {
  // 설치되지 않았으면 기본 경로 사용
  chromiumExecutablePath = undefined;
}

/**
 * Playwright를 사용하여 리포트를 PDF로 내보내기 (서버 사이드)
 * @param htmlContent 리포트 페이지의 HTML 내용
 * @returns PDF Buffer
 */
export async function exportToPdfServer(htmlContent: string): Promise<Buffer> {
  let browser;
  try {
    // Vercel serverless 환경에서 Chromium 실행 경로 지정
    const executablePath =
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || chromiumExecutablePath;

    const launchOptions: Parameters<typeof chromium.launch>[0] = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    };

    if (executablePath) {
      launchOptions.executablePath = executablePath;
    }

    browser = await chromium.launch(launchOptions);

    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
    });

    // A4 가로형 크기 설정 (297mm x 210mm)
    await page.setViewportSize({ width: 1123, height: 794 }); // A4 가로형 픽셀 (96 DPI 기준)

    // HTML 내용을 직접 로드
    await page.setContent(htmlContent, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // 페이지가 완전히 로드될 때까지 대기
    await page.waitForTimeout(2000);

    // CSS override: 모든 fixed 요소를 relative로, opacity를 1로 변경
    await page.addStyleTag({
      content: `
        *[style*="position: fixed"] {
          position: relative !important;
          opacity: 1 !important;
          transform: none !important;
          top: auto !important;
          left: auto !important;
          right: auto !important;
          bottom: auto !important;
          width: 100% !important;
          height: auto !important;
        }
        
        section {
          position: relative !important;
          height: 100vh !important;
          min-height: 100vh !important;
          max-height: 100vh !important;
          display: block !important;
          page-break-after: always !important;
          page-break-inside: avoid !important;
          overflow: hidden !important;
          break-after: page !important;
          break-before: avoid !important;
        }
        
        /* Timeline section은 일반 section과 다르게 처리 */
        section#timeline {
          height: auto !important;
          min-height: auto !important;
          max-height: none !important;
          page-break-after: auto !important;
          break-after: auto !important;
          overflow: visible !important;
        }

        .timeline-list {
          height: 100vh !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
        }
        
        div[style*="opacity"] {
          position: relative !important;
          opacity: 1 !important;
          transform: none !important;
          height: 100vh !important;
          min-height: 100vh !important;
          max-height: 100vh !important;
        }
        
        /* 마지막 섹션과 Timeline 사이 빈 페이지 방지 */
        #report-content > section:last-of-type {
          page-break-after: auto !important;
          break-after: auto !important;
        }
        
        /* 빈 페이지 방지 */
        @page {
          size: A4 landscape;
          margin: 0;
        }
        
        /* 빈 페이지 완전 제거 */
        @page :last {
          size: A4 landscape;
          margin: 0;
        }
        
        body {
          margin: 0;
          padding: 0;
        }
        
        /* 빈 section 요소 제거 */
        section:empty {
          display: none !important;
        }
        
        /* Timeline 섹션 처리 */
        #report-content > div:not(section),
        section#timeline {
          page-break-before: avoid !important;
          break-before: avoid !important;
        }
        
        /* Timeline 컨텐츠 영역 보이기 */
        .timeline-content {
          display: block !important;
          visibility: visible !important;
        }
        
        /* Timeline space-y 컨테이너 보이기 */
        .timeline-list {
          display: block !important;
          visibility: visible !important;
        }
        
        /* Timeline 헤더 영역을 PDF에서 100vh로 만들고 중앙 정렬 */
        .timeline-content {
          padding-top: 0 !important;
          padding-bottom: 0 !important;
        }

        .timeline-header {
          height: 99vh !important;
          min-height: 100vh !important;
          max-height: 100vh !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
          text-align: center !important;
          margin: 0 !important;
          padding: 0 !important;
          page-break-after: always !important;
          break-after: page !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        .timeline-header h2,
        .timeline-header p {
          margin-left: auto !important;
          margin-right: auto !important;
          margin-top: 0 !important;
          margin-bottom: 0 !important;
        }
        
        .timeline-header h2 {
          margin-bottom: 1rem !important;
        }
        
        /* Timeline 헤더 다음 빈 공간 제거 */
        .timeline-header + .timeline-list {
          page-break-before: avoid !important;
          break-before: avoid !important;
        }
        
        /* Timeline 각 row가 한 페이지를 차지하도록 */
        .timeline-list > li {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: always !important;
          break-after: page !important;
          min-height: 100vh !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          opacity: 1 !important;
        }
        
        /* Timeline 각 row 내부 콘텐츠의 위아래 여백 동일하게 및 세로 중앙 정렬 */
        .timeline-list > li > div[class*="flex"] {
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          align-items: center !important;
          justify-content: center !important;
          height: 100vh !important;
          min-height: 100vh !important;
          display: flex !important;
        }
        
        /* 이미지 그리드를 포함하는 motion.div 컨테이너 중앙 정렬 */
        .image-grid-container {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          align-self: center !important;
        }
        
        /* 이미지 그리드 컨테이너 중앙 정렬 */
        .image-grid {
          max-height: 50vh !important;
          min-height: 50vh !important;
          height: 50vh !important;
          display: grid !important;
          align-self: center !important;
          margin: auto 0 !important;
        }
        
        /* Timeline 섹션 다음 빈 페이지 방지 */
        .timeline-list:after {
          display: none !important;
        }
        
        /* 빈 div 요소 제거 (Timeline 내부는 제외) */
        div:empty:not(.timeline-list *):not(.timeline-content *) {
          display: none !important;
          height: 0 !important;
        }
        
        /* Timeline 내부 콘텐츠가 잘리지 않도록 */
        .timeline-list > div[class*="relative"] > div {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* 이미지와 텍스트가 잘리지 않도록 */
        img {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        p, h2, h3, h4 {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          orphans: 3 !important;
          widows: 3 !important;
        }
        
        /* Timeline 그리드 이미지가 잘리지 않도록 */
        div[class*="grid"] {
          opacity: 1 !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* PDF 출력에서 푸터 숨기기 */
        .report-footer,
        div.report-footer,
        #report-content > div.report-footer {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          overflow: hidden !important;
        }
        
        /* PDF 출력에서 MoodSection 원형 그라데이션 숨기기 */
        .mood-gradient-overlay {
          display: none !important;
        }
        
        /* PDF 출력에서 Timeline 상단 그라데이션 숨기기 */
        .timeline-top-gradient {
          display: none !important;
        }
      `,
    });

    // 추가 대기 (CSS 적용 완료)
    await page.waitForTimeout(2000);

    // A4 가로형 PDF 생성 (각 섹션당 한 페이지)
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true, // 가로형
      printBackground: true,
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
      },
      preferCSSPageSize: false,
      displayHeaderFooter: false,
      scale: 1.0,
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("PDF 생성 실패:", error);

    // Vercel 환경에서의 에러를 더 명확하게 전달
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isVercelError =
      errorMessage.includes("chromium") ||
      errorMessage.includes("executable") ||
      errorMessage.includes("browser");

    if (isVercelError) {
      throw new Error(
        "PDF 생성에 실패했습니다. Vercel 환경에서는 Playwright 실행에 제한이 있을 수 있습니다. 잠시 후 다시 시도해주세요."
      );
    }

    throw new Error(`PDF 생성 실패: ${errorMessage}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("브라우저 종료 실패:", closeError);
      }
    }
  }
}
