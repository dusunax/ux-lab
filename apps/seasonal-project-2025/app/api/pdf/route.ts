import { NextRequest, NextResponse } from "next/server";
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

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel Pro 플랜의 최대 실행 시간

export async function POST(request: NextRequest) {
  let browser;
  try {
    const { htmlContent } = await request.json();

    if (!htmlContent) {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

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
    await page.setViewportSize({ width: 1123, height: 794 });

    // HTML 내용을 직접 로드
    await page.setContent(htmlContent, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // 페이지가 완전히 로드될 때까지 대기
    await page.waitForTimeout(2000);

    // CSS override - exportToPdfServer.ts와 동일한 CSS 적용
    const pdfCss = `
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
      
      #report-content > section:last-of-type {
        page-break-after: auto !important;
        break-after: auto !important;
      }
      
      @page {
        size: A4 landscape;
        margin: 0;
      }
      
      @page :last {
        size: A4 landscape;
        margin: 0;
      }
      
      body {
        margin: 0;
        padding: 0;
      }
      
      section:empty {
        display: none !important;
      }
      
      #report-content > div:not(section),
      section#timeline {
        page-break-before: avoid !important;
        break-before: avoid !important;
      }
      
      .timeline-content {
        display: block !important;
        visibility: visible !important;
      }
      
      .timeline-list {
        display: block !important;
        visibility: visible !important;
      }
      
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
      
      .timeline-header + .timeline-list {
        page-break-before: avoid !important;
        break-before: avoid !important;
      }
      
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
      
      .timeline-list > li:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
      }
      
      section#timeline:last-child,
      #report-content > section#timeline:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
      }
      
      .timeline-list > li > div[class*="flex"] {
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        align-items: center !important;
        justify-content: center !important;
        height: 100vh !important;
        min-height: 100vh !important;
        display: flex !important;
      }
      
      .image-grid-container {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        align-self: center !important;
      }
      
      .image-grid {
        max-height: 50vh !important;
        min-height: 50vh !important;
        height: 50vh !important;
        display: grid !important;
        align-self: center !important;
        margin: auto 0 !important;
      }
      
      .timeline-list:after {
        display: none !important;
      }
      
      div:empty:not(.timeline-list *):not(.timeline-content *) {
        display: none !important;
        height: 0 !important;
      }
      
      .timeline-list > div[class*="relative"] > div {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
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
      
      div[class*="grid"] {
        opacity: 1 !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      .report-footer,
      div.report-footer,
      #report-content > div.report-footer {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
      }
      
      .mood-gradient-overlay {
        display: none !important;
      }
      
      .timeline-top-gradient {
        display: none !important;
      }
    `;

    await page.addStyleTag({ content: pdfCss });

    await page.waitForTimeout(1000);

    // PDF 생성
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
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

    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    console.error("PDF 생성 실패:", error);

    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("브라우저 종료 실패:", closeError);
      }
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        error: "PDF 생성에 실패했습니다.",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
