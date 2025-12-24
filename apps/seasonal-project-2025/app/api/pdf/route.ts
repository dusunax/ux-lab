import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { existsSync } from "fs";

// 로컬 개발 환경 감지
const isProduction = process.env.NODE_ENV === "production";
const isVercel = process.env.VERCEL === "1";

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

    // Vercel 환경과 로컬 환경 구분
    let executablePath: string | undefined;
    let launchArgs: string[];
    let defaultViewport: { width: number; height: number } | null;

    if (isVercel) {
      // Vercel 환경: @sparticuz/chromium 사용
      executablePath = await chromium.executablePath(
        process.env.CHROMIUM_PATH || undefined
      );
      launchArgs = chromium.args;
      defaultViewport = chromium.defaultViewport;
    } else {
      // 로컬 개발 환경: 시스템에 설치된 Chrome/Chromium/Edge 사용
      // Windows: Chrome 및 Edge 설치 경로
      const localAppData = process.env.LOCALAPPDATA || "";
      const programFiles = process.env["ProgramFiles"] || "C:\\Program Files";
      const programFilesX86 =
        process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";

      // Windows에서 Chrome/Edge 경로 찾기 (where 명령어 사용)
      let foundBrowserPath: string | undefined;
      try {
        const { execSync } = require("child_process");
        // Chrome 찾기
        try {
          const chromePath = execSync("where chrome", {
            encoding: "utf-8",
            stdio: "pipe",
          }).trim();
          if (chromePath && existsSync(chromePath)) {
            foundBrowserPath = chromePath;
          }
        } catch {
          // Chrome을 찾지 못함
        }

        // Edge 찾기 (Chrome을 찾지 못한 경우)
        if (!foundBrowserPath) {
          try {
            const edgePath = execSync("where msedge", {
              encoding: "utf-8",
              stdio: "pipe",
            }).trim();
            if (edgePath && existsSync(edgePath)) {
              foundBrowserPath = edgePath;
            }
          } catch {
            // Edge를 찾지 못함
          }
        }
      } catch {
        // where 명령어 실패 시 무시
      }

      const possiblePaths = [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        // where 명령어로 찾은 브라우저 경로
        foundBrowserPath,
        // Chrome 경로
        `${programFiles}\\Google\\Chrome\\Application\\chrome.exe`,
        `${programFilesX86}\\Google\\Chrome\\Application\\chrome.exe`,
        `${localAppData}\\Google\\Chrome\\Application\\chrome.exe`,
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        // Edge 경로 (Chrome 기반이므로 사용 가능)
        `${programFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
        `${programFilesX86}\\Microsoft\\Edge\\Application\\msedge.exe`,
        `${localAppData}\\Microsoft\\Edge\\Application\\msedge.exe`,
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        // Edge Beta/Dev/Canary
        `${localAppData}\\Microsoft\\Edge Beta\\Application\\msedge.exe`,
        `${localAppData}\\Microsoft\\Edge Dev\\Application\\msedge.exe`,
        `${localAppData}\\Microsoft\\Edge Canary\\Application\\msedge.exe`,
      ].filter(Boolean) as string[];

      executablePath = possiblePaths.find((path) => {
        try {
          return existsSync(path);
        } catch {
          return false;
        }
      });

      if (!executablePath) {
        console.error(
          "Chrome/Edge를 찾을 수 없습니다. 시도한 경로:",
          possiblePaths
        );
        throw new Error(
          "로컬 개발 환경에서 Chrome 또는 Edge를 찾을 수 없습니다. Chrome 또는 Edge를 설치하거나 PUPPETEER_EXECUTABLE_PATH 환경 변수를 설정해주세요."
        );
      }

      console.log("사용할 브라우저 경로:", executablePath);

      launchArgs = [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ];
      defaultViewport = { width: 1920, height: 1080 };
    }

    try {
      browser = await puppeteer.launch({
        args: launchArgs,
        defaultViewport: defaultViewport || undefined,
        executablePath,
        headless: true,
      });
    } catch (launchError) {
      console.error("Chromium launch failed:", launchError);
      throw new Error(
        `Chromium 실행 실패: ${
          launchError instanceof Error
            ? launchError.message
            : String(launchError)
        }`
      );
    }

    const page = await browser.newPage();

    // A4 가로형 크기 설정 (297mm x 210mm)
    await page.setViewport({ width: 1123, height: 794 });

    // HTML 내용을 직접 로드
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // 페이지가 완전히 로드될 때까지 대기
    await new Promise((resolve) => setTimeout(resolve, 2000));

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

    // CSS 적용 대기
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // lazy loading 이미지를 강제로 로드
    await page.evaluate(() => {
      // 모든 이미지의 loading 속성을 제거하고 즉시 로드
      const images = Array.from(document.images);
      images.forEach((img) => {
        img.loading = "eager";
        // 이미지가 아직 로드되지 않았으면 강제로 로드
        if (!img.complete) {
          const src = img.src;
          img.src = "";
          img.src = src;
        }
      });
    });

    // 모든 이미지가 로드될 때까지 대기
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images).map((img) => {
          if (img.complete && img.naturalWidth > 0) {
            return Promise.resolve();
          }
          return new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
              resolve(); // 타임아웃 시에도 계속 진행
            }, 10000);

            img.addEventListener("load", () => {
              clearTimeout(timeout);
              resolve();
            });
            img.addEventListener("error", () => {
              clearTimeout(timeout);
              resolve(); // 에러가 나도 계속 진행
            });
          });
        })
      );
    });

    // 추가 대기 (이미지 렌더링 완료)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 이미지가 실제로 렌더링되었는지 확인
    const imagesLoaded = await page.evaluate(() => {
      const images = Array.from(document.images);
      const loadedImages = images.filter(
        (img) => img.complete && img.naturalWidth > 0 && img.naturalHeight > 0
      );
      return {
        total: images.length,
        loaded: loadedImages.length,
        hasDataUrls: images.some((img) => img.src.startsWith("data:")),
        imageInfo: images.map((img) => ({
          src: img.src.substring(0, 50),
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        })),
      };
    });

    console.log("이미지 로딩 상태:", {
      total: imagesLoaded.total,
      loaded: imagesLoaded.loaded,
      hasDataUrls: imagesLoaded.hasDataUrls,
    });

    // 이미지가 로드되지 않았으면 추가 대기
    if (imagesLoaded.loaded < imagesLoaded.total && imagesLoaded.total > 0) {
      console.log("일부 이미지가 로드되지 않았습니다. 추가 대기 중...");
      console.log("이미지 상세 정보:", imagesLoaded.imageInfo);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

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

    // 개발 환경에서는 상세 에러 정보 제공
    const isDevelopment = process.env.NODE_ENV === "development";

    return NextResponse.json(
      {
        error: "PDF 생성에 실패했습니다.",
        details: isDevelopment ? errorMessage : undefined,
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
