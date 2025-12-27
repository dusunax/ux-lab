"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RotateCcw, Download } from "lucide-react";
import { Button } from "@shared/ui/Button";
import { Timeline } from "@features/report/ui/TimelineSection";
import { useReportSections } from "@features/report/hooks/useReportSections";
import { TitleSection } from "@features/report/ui/TitleSection";
import { SentenceSection } from "@features/report/ui/SentenceSection";
import { PersonalitySection } from "@features/report/ui/PersonalitySection";
import { MeSection } from "@features/report/ui/MeSection";
import { MoodSection } from "@features/report/ui/MoodSection";
import { ContinueSection } from "@features/report/ui/ContinueSection";
// Server Action 대신 API Route 사용
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import type { AnalysisResult } from "@features/report/types";
import { trackPdfDownload, trackPdfDownloadError } from "@shared/lib/gtag";

interface ReportViewProps {
  analysisResult: AnalysisResult;
}

export function ReportView({ analysisResult }: ReportViewProps) {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isPdfReady, setIsPdfReady] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const pdfBlobUrlRef = useRef<string | null>(null);
  const { currentSection, setCurrentSection, registerSection } =
    useReportSections();

  // 배경 그라데이션 생성 (percentage 반영, 자연스러운 전환)
  const getGradientColors = (colors: typeof analysisResult.primaryColor) => {
    if (!colors || colors.length === 0) {
      return "linear-gradient(135deg, #8B7355 0%, #A8967F 50%, #C9BFB0 100%)";
    }

    // 최대 3개로 제한
    const limitedColors = colors.slice(0, 3);

    if (limitedColors.length === 1) {
      return limitedColors[0].hexCode;
    }

    if (limitedColors.length === 2) {
      // 2개 색상인 경우
      const color1 = limitedColors[0];
      const color2 = limitedColors[1];
      const percentage1 = color1.percentage * 100;
      const transitionStart = Math.max(0, percentage1 - 15);
      const transitionEnd = Math.min(100, percentage1 + 15);
      return `linear-gradient(135deg, ${color1.hexCode} 0%, ${color1.hexCode} ${transitionStart}%, ${color2.hexCode} ${transitionEnd}%, ${color2.hexCode} 100%)`;
    }

    // 3개 색상인 경우 - percentage를 누적하여 자연스러운 전환
    const color1 = limitedColors[0];
    const color2 = limitedColors[1];
    const color3 = limitedColors[2];

    const p1 = color1.percentage * 100;
    const p2 = (color1.percentage + color2.percentage) * 100;

    // 각 색상 전환 지점을 부드럽게 설정
    const transition1Start = Math.max(0, p1 - 10);
    const transition1End = Math.min(p2, p1 + 10);
    const transition2Start = Math.max(p1, p2 - 10);
    const transition2End = Math.min(100, p2 + 10);

    return `linear-gradient(135deg, ${color1.hexCode} 0%, ${color1.hexCode} ${transition1Start}%, ${color2.hexCode} ${transition1End}%, ${color2.hexCode} ${transition2Start}%, ${color3.hexCode} ${transition2End}%, ${color3.hexCode} 100%)`;
  };

  const gradientColors = getGradientColors(analysisResult.primaryColor);

  // HTML 콘텐츠 생성 함수
  const generateHtmlContent = async () => {
    const reportElement = document.getElementById("report-content");
    if (!reportElement) {
      throw new Error("리포트 요소를 찾을 수 없습니다.");
    }

    // 모든 이미지가 로드될 때까지 대기
    const images = Array.from(
      reportElement.querySelectorAll("img")
    ) as HTMLImageElement[];

    await Promise.all(
      images.map((img) => {
        if (img.complete && img.naturalWidth > 0) {
          return Promise.resolve();
        }
        // lazy loading 이미지를 즉시 로드
        img.loading = "eager";
        return new Promise<void>((resolve) => {
          const timeout = setTimeout(() => resolve(), 5000);
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

    // 추가 대기 (이미지 렌더링 완료)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 모든 스타일시트 링크 수집
    const stylesheetLinks = Array.from(
      document.querySelectorAll('link[rel="stylesheet"]')
    )
      .map((link) => (link as HTMLLinkElement).href)
      .filter((href) => href && !href.startsWith("data:"));

    // 모든 인라인 스타일 수집
    const inlineStyles = Array.from(document.querySelectorAll("style"))
      .map((style) => style.textContent)
      .filter(Boolean)
      .join("\n");

    // 외부 CSS를 fetch해서 인라인으로 포함
    const fetchedStyles = await Promise.all(
      stylesheetLinks.map(async (href) => {
        try {
          // 절대 URL인 경우에만 fetch
          if (href.startsWith("http://") || href.startsWith("https://")) {
            const response = await fetch(href);
            if (response.ok) {
              return await response.text();
            }
          }
          // 상대 경로나 로컬 URL인 경우 빈 문자열 반환
          return "";
        } catch (error) {
          console.warn(`Failed to fetch CSS from ${href}:`, error);
          return "";
        }
      })
    );

    const allStyles = [...fetchedStyles.filter(Boolean), inlineStyles].join(
      "\n"
    );

    // 전체 HTML 문서 생성 (스타일 포함)
    return `
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
          ${allStyles ? `<style>${allStyles}</style>` : ""}
        </head>
        <body style="margin: 0; padding: 0; background-color: #faf9f7;">
          ${reportElement.outerHTML}
        </body>
      </html>
    `;
  };

  // PDF 미리 생성 (페이지 접근 시 즉시 생성)
  useEffect(() => {
    const generatePdf = async () => {
      // DOM이 완전히 로드될 때까지 대기
      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        setIsGeneratingPdf(true);
        setPdfError(null);
        setIsPdfReady(false);

        let htmlContent: string;
        try {
          htmlContent = await generateHtmlContent();
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "알 수 없는 오류";
          throw new Error(`HTML 콘텐츠 생성 실패: ${errorMessage}`);
        }

        let response: Response;
        try {
          response = await fetch("/api/pdf", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ htmlContent }),
          });
        } catch (error) {
          if (error instanceof TypeError && error.message.includes("fetch")) {
            throw new Error(
              "네트워크 연결을 확인할 수 없습니다. 인터넷 연결을 확인해주세요."
            );
          }
          throw new Error(
            `PDF 생성 서버 요청 실패: ${
              error instanceof Error ? error.message : "알 수 없는 오류"
            }`
          );
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.message ||
            errorData.error ||
            errorData.details ||
            `PDF 생성에 실패했습니다. (상태 코드: ${response.status})`;

          if (response.status === 400) {
            throw new Error(
              "요청 형식이 올바르지 않습니다. 페이지를 새로고침 후 다시 시도해주세요."
            );
          } else if (response.status === 500) {
            throw new Error(
              errorData.details
                ? `서버 오류: ${errorData.details}`
                : "PDF 생성 서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
            );
          } else if (response.status === 503) {
            throw new Error(
              "PDF 생성 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요."
            );
          } else {
            throw new Error(errorMessage);
          }
        }

        let pdfArrayBuffer: ArrayBuffer;
        try {
          pdfArrayBuffer = await response.arrayBuffer();
        } catch (error) {
          throw new Error(
            `PDF 데이터를 받아오는 중 오류가 발생했습니다: ${
              error instanceof Error ? error.message : "알 수 없는 오류"
            }`
          );
        }

        // Blob으로 변환하여 저장
        const blob = new Blob([new Uint8Array(pdfArrayBuffer)], {
          type: "application/pdf",
        });

        if (blob.size === 0) {
          throw new Error("생성된 PDF 파일이 비어있습니다.");
        }

        // 이전 Blob URL이 있으면 해제
        if (pdfBlobUrlRef.current) {
          URL.revokeObjectURL(pdfBlobUrlRef.current);
        }

        // 새로운 Blob URL 생성 및 저장
        pdfBlobUrlRef.current = URL.createObjectURL(blob);
        setIsPdfReady(true);
        setPdfError(null);
      } catch (error) {
        console.error("PDF 생성 실패:", error);
        const errorMessage =
          error instanceof Error ? error.message : "알 수 없는 오류";
        setPdfError(errorMessage);
        setIsPdfReady(false);
        toast.error(`PDF 생성 실패: ${errorMessage}`, {
          duration: 5000,
        });
      } finally {
        setIsGeneratingPdf(false);
      }
    };

    generatePdf();

    // 컴포넌트 언마운트 시 Blob URL 정리
    return () => {
      if (pdfBlobUrlRef.current) {
        URL.revokeObjectURL(pdfBlobUrlRef.current);
        pdfBlobUrlRef.current = null;
      }
    };
  }, [analysisResult]); // analysisResult가 변경되면 PDF 재생성

  const handleExportPdf = async () => {
    // PDF가 준비되지 않았으면 다운로드 불가
    if (!pdfBlobUrlRef.current || !isPdfReady) {
      if (isGeneratingPdf) {
        toast.error("PDF가 아직 생성 중입니다. 잠시 후 다시 시도해주세요.");
      } else if (pdfError) {
        toast.error(`PDF 생성 실패: ${pdfError}`, {
          duration: 5000,
        });
      } else {
        toast.error("PDF가 준비되지 않았습니다. 페이지를 새로고침해주세요.");
      }
      return;
    }

    try {
      setIsExporting(true);

      const link = document.createElement("a");
      link.href = pdfBlobUrlRef.current;
      link.download = `Project-Afterglow-2025-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("PDF 저장이 시작되었습니다!");

      // PDF 다운로드 완료 이벤트 발생
      trackPdfDownload();
      window.dispatchEvent(new Event("pdfDownloadComplete"));
    } catch (error) {
      console.error("PDF 다운로드 실패:", error);
      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류";
      trackPdfDownloadError(errorMessage);
      window.dispatchEvent(
        new CustomEvent("pdfDownloadError", { detail: { error: errorMessage } })
      );

      toast.error(`PDF 다운로드 실패: ${errorMessage}`, {
        duration: 5000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      id="report-content"
      className="break-keep relative min-h-screen scrollbar-hide"
    >
      <TitleSection
        onSectionChange={setCurrentSection}
        sectionId="title"
        registerSection={registerSection}
      />

      <SentenceSection
        onSectionChange={setCurrentSection}
        sectionId="sentence"
        yearSentence={analysisResult.yearSentence}
        registerSection={registerSection}
      />

      <PersonalitySection
        onSectionChange={setCurrentSection}
        sectionId="personality"
        personality={analysisResult.personality}
        registerSection={registerSection}
      />

      <MeSection
        onSectionChange={setCurrentSection}
        sectionId="me"
        personalityType={analysisResult.personalityType}
        favoriteThings={analysisResult.favoriteThings}
        registerSection={registerSection}
      />

      <MoodSection
        onSectionChange={setCurrentSection}
        sectionId="mood"
        keywords={analysisResult.keywords}
        primaryColor={analysisResult.primaryColor}
        gradientColors={gradientColors}
        isCurrentSection={currentSection === "mood"}
        registerSection={registerSection}
      />

      <ContinueSection
        onSectionChange={setCurrentSection}
        sectionId="continue"
        advice={analysisResult.advice}
        luckyItem={analysisResult.luckyItem}
        avoidItem={analysisResult.avoidItem}
        registerSection={registerSection}
      />

      <Timeline reports={analysisResult.monthlyReports} />

      {/* Action Buttons */}
      <footer className="report-footer relative z-20 bg-warmGray-50 py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
          >
            <div className="flex flex-col items-center gap-2">
              <Button
                variant={isPdfReady ? "primary" : "secondary"}
                size="lg"
                onClick={handleExportPdf}
                disabled={!isPdfReady || isExporting || isGeneratingPdf}
                data-ga-label="PDF 저장"
                className={`flex items-center gap-2 ${
                  isGeneratingPdf ? "animate-pulse" : ""
                }`}
              >
                <Download className="w-5 h-5" />
                {isGeneratingPdf
                  ? "PDF 생성 중..."
                  : isExporting
                  ? "PDF 다운로드 중..."
                  : isPdfReady
                  ? "PDF 저장"
                  : pdfError
                  ? "PDF 생성 실패"
                  : "PDF 준비 중..."}
              </Button>
              {pdfError && (
                <p className="text-sm text-red-600 text-center max-w-md">
                  {pdfError}
                </p>
              )}
            </div>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.push("/")}
              data-ga-label="리포트에서 돌아가기"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              돌아가기
            </Button>
          </motion.div>
          <Footer />
        </div>
      </footer>
    </div>
  );
}
