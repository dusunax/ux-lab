import { NextRequest, NextResponse } from "next/server";

// Puppeteer API URL (환경변수로 설정 필수)
const PUPPETEER_API_URL = process.env.PUPPETEER_API_URL;

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel Pro 플랜의 최대 실행 시간

export async function POST(request: NextRequest) {
  try {
    const userAgent = request.headers.get("user-agent") || "unknown";
    const htmlContentSize = request.headers.get("content-length");

    const { htmlContent } = await request.json();

    if (!htmlContent) {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    // HTML 콘텐츠 크기 계산 (바이트)
    const htmlContentBytes = new TextEncoder().encode(htmlContent).length;
    const htmlContentMB = (htmlContentBytes / (1024 * 1024)).toFixed(2);

    console.log("=== PDF 생성 요청 정보 ===");
    console.log("User-Agent:", userAgent);
    console.log(
      "HTML 콘텐츠 크기:",
      `${htmlContentMB} MB (${htmlContentBytes.toLocaleString()} bytes)`
    );
    console.log("Content-Length 헤더:", htmlContentSize || "없음");

    if (!PUPPETEER_API_URL) {
      return NextResponse.json(
        { error: "PUPPETEER_API_URL environment variable is not set" },
        { status: 500 }
      );
    }

    console.log(`Puppeteer API로 요청 전송: ${PUPPETEER_API_URL}/api/pdf`);

    const response = await fetch(`${PUPPETEER_API_URL}/api/pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ htmlContent }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error || `Puppeteer API 요청 실패: ${response.status}`;

      console.error("=== PDF 생성 실패 ===");
      console.error("상태 코드:", response.status);
      console.error("에러 메시지:", errorMessage);
      console.error("User-Agent:", userAgent);
      console.error(
        "HTML 콘텐츠 크기:",
        `${htmlContentMB} MB (${htmlContentBytes.toLocaleString()} bytes)`
      );

      // 413 에러인 경우 추가 정보 제공
      if (response.status === 413) {
        console.error("⚠️ 413 에러: 요청 본문이 너무 큽니다.");
        console.error("디바이스:", userAgent);
        console.error("HTML 크기:", `${htmlContentMB} MB`);
      }

      return NextResponse.json(
        {
          error: "PDF 생성에 실패했습니다.",
          details: errorMessage,
          message:
            response.status === 413
              ? `PDF 생성에 실패했습니다. (상태 코드: 413) - 요청 크기: ${htmlContentMB} MB`
              : errorMessage,
        },
        { status: response.status }
      );
    }

    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    const userAgent = request.headers.get("user-agent") || "unknown";

    console.error("=== PDF 생성 예외 발생 ===");
    console.error("에러:", error);
    console.error("User-Agent:", userAgent);

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
