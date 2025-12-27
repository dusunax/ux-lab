import express, { Request, Response } from "express";
import cors from "cors";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const app = express();
const PORT = process.env.PORT || 8080;

// 미들웨어
app.use(cors());
app.use(express.json({ limit: "100mb" }));

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "puppeteer-api" });
});

// PDF 생성 엔드포인트
app.post("/api/pdf", async (req: Request, res: Response) => {
  let browser;
  try {
    const { htmlContent } = req.body;

    if (!htmlContent) {
      return res.status(400).json({ error: "HTML content is required" });
    }

    // Cloud Run 환경 감지
    const isCloudRun = process.env.K_SERVICE !== undefined;
    let executablePath: string | undefined;
    let launchArgs: string[];

    if (isCloudRun) {
      // Cloud Run 환경: 시스템 Chromium 또는 @sparticuz/chromium 사용
      try {
        // 먼저 @sparticuz/chromium 시도
        executablePath = await chromium.executablePath(
          process.env.CHROMIUM_PATH || undefined
        );
        launchArgs = chromium.args;
      } catch {
        // @sparticuz/chromium 실패 시 시스템 Chromium 사용
        executablePath =
          process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium";
        launchArgs = [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--single-process",
        ];
      }
    } else {
      // 로컬 개발 환경: 시스템 Chrome 사용
      const { execSync } = await import("child_process");
      const { existsSync } = await import("fs");

      let foundBrowserPath: string | undefined;
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

      executablePath = foundBrowserPath;
      launchArgs = [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ];
    }

    if (!executablePath) {
      throw new Error("Chromium executable path not found");
    }

    // 브라우저 실행
    browser = await puppeteer.launch({
      args: launchArgs,
      defaultViewport: chromium.defaultViewport || {
        width: 1920,
        height: 1080,
      },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();

    // A4 가로형 크기 설정
    await page.setViewport({ width: 1123, height: 794 });

    // HTML 내용 로드
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // 외부 CSS를 인라인으로 변환
    await page.evaluate(async () => {
      const stylesheets = Array.from(
        document.querySelectorAll('link[rel="stylesheet"]')
      ) as HTMLLinkElement[];

      for (const link of stylesheets) {
        try {
          const href = link.href;
          // 절대 URL인 경우에만 fetch
          if (
            href &&
            (href.startsWith("http://") || href.startsWith("https://"))
          ) {
            const response = await fetch(href);
            if (response.ok) {
              const cssText = await response.text();
              // 스타일 태그 생성
              const style = document.createElement("style");
              style.textContent = cssText;
              link.parentNode?.insertBefore(style, link);
              link.remove();
            }
          }
        } catch (error) {
          console.warn(`Failed to inline CSS from ${link.href}:`, error);
          // 실패해도 계속 진행
        }
      }
    });

    // 페이지 로딩 대기
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 폰트 로딩 대기
    await page.evaluate(() => {
      return document.fonts.ready;
    });

    // PDF 생성용 CSS 스타일 적용
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
        font-family: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif !important;
      }
      
      * {
        font-family: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif !important;
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
        padding-top: 0 !important;
        padding-bottom: 0 !important;
      }
      
      .timeline-list {
        display: block !important;
        visibility: visible !important;
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
        Array.from(document.images).map((img: HTMLImageElement) => {
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

    // PDF 생성 (크기 최적화를 위해 scale 조정)
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
      scale: 0.85, // 1.0에서 0.85로 낮춰서 파일 크기 감소 (품질은 여전히 양호)
    });

    // PDF 크기 로깅
    const pdfSizeMB = (pdfBuffer.length / (1024 * 1024)).toFixed(2);
    console.log(
      `생성된 PDF 크기: ${pdfSizeMB} MB (${pdfBuffer.length.toLocaleString()} bytes)`
    );

    await browser.close();

    // PDF 반환
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="report-${Date.now()}.pdf"`
    );
    res.send(Buffer.from(pdfBuffer));
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

    res.status(500).json({
      error: "PDF 생성에 실패했습니다.",
      message: errorMessage,
    });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Puppeteer API 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
