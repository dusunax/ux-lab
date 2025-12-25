import { NextRequest, NextResponse } from "next/server";

// Puppeteer API URL (환경변수로 설정 필수)
const PUPPETEER_API_URL = process.env.PUPPETEER_API_URL;

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel Pro 플랜의 최대 실행 시간

export async function POST(request: NextRequest) {
  try {
    const { htmlContent } = await request.json();

    if (!htmlContent) {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

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
      console.error("Puppeteer API 요청 실패:", errorMessage);

      return NextResponse.json(
        {
          error: "PDF 생성에 실패했습니다.",
          details: errorMessage,
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
    console.error("PDF 생성 실패:", error);

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
