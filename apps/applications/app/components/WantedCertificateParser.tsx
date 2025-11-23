"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X, CheckCircle2 } from "lucide-react";
import { Button } from "@ux-lab/ui";
import { Application, ApplicationStatus } from "../types/application";

interface WantedCertificateParserProps {
  onParse: (
    applications: Omit<Application, "id" | "createdAt" | "updatedAt">[]
  ) => void;
}

export default function WantedCertificateParser({
  onParse,
}: WantedCertificateParserProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [parsedApplications, setParsedApplications] = useState<
    Omit<Application, "id" | "createdAt" | "updatedAt">[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    if (typeof window === "undefined") {
      throw new Error("PDF extraction is only available in the browser");
    }

    const pdfjsLib = await import("pdfjs-dist");
    // Worker 설정 - public 폴더의 worker 파일 사용
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }

    return fullText;
  };

  const parseWantedCertificate = (
    text: string
  ): Omit<Application, "id" | "createdAt" | "updatedAt">[] => {
    const applications: Omit<Application, "id" | "createdAt" | "updatedAt">[] =
      [];

    // 원티드 증명서인지 확인
    if (
      !text.includes("취업활동 증명서") &&
      !text.includes("원티드") &&
      !text.includes("wanted")
    ) {
      throw new Error("원티드 취업활동 증명서가 아닙니다.");
    }

    // 모든 날짜 찾기 (YYYY.MM.DD 형식)
    const dateMatches = [...text.matchAll(/(\d{4})\.(\d{2})\.(\d{2})/g)];

    for (const dateMatch of dateMatches) {
      const dateIndex = dateMatch.index!;
      const year = dateMatch[1];
      const month = dateMatch[2];
      const day = dateMatch[3];
      const dateStr = `${year}-${month}-${day}`;

      // 날짜 다음 300자 내에서 정보 추출
      const context = text.substring(dateIndex, dateIndex + 300);

      // 기업명 찾기: 한글로 시작하고 괄호나 특수문자가 있을 수 있음
      // 주소나 연락처가 아닌 한글 회사명 패턴
      const companyPatterns = [
        /([가-힣]+(?:\([가-힣A-Z]+\))?(?:\(주\)|㈜)?)/, // 기본 패턴
        /([가-힣]+(?:\([^)]+\))?)/, // 괄호 포함
      ];

      let companyName = "";
      for (const pattern of companyPatterns) {
        const match = context.match(pattern);
        if (match && match[1]) {
          const candidate = match[1].trim();
          // 주소나 연락처가 아닌지 확인
          if (
            candidate.length > 1 &&
            candidate.length < 50 &&
            !candidate.includes("@") &&
            !candidate.includes("번길") &&
            !candidate.includes("로 ") &&
            !candidate.includes("구 ") &&
            !candidate.includes("시 ") &&
            !candidate.includes("동 ") &&
            !candidate.includes("층") &&
            !candidate.includes("호") &&
            !candidate.match(/^\d/) // 숫자로 시작하지 않음
          ) {
            companyName = candidate.replace(/\(주\)|㈜/g, "").trim();
            break;
          }
        }
      }

      // 연락처 찾기 (이메일)
      const emailMatch = context.match(
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
      );
      const contact = emailMatch ? emailMatch[1] : "";

      // 상태 찾기
      let status: ApplicationStatus = "rejected";
      if (context.includes("불합격") || context.includes("합격거절")) {
        status = "rejected";
      } else if (context.includes("최종합격")) {
        status = "final_passed";
      } else if (context.includes("면접")) {
        status = "interview";
      } else if (context.includes("서류통과") || context.includes("서류합격")) {
        status = "document_passed";
      } else if (context.includes("지원함") || context.includes("지원")) {
        status = "applied";
      }

      // 기업명이 있고 중복이 아닌 경우에만 추가
      if (companyName) {
        // 중복 체크 (같은 날짜, 같은 회사명)
        const isDuplicate = applications.some(
          (app) =>
            app.appliedDate === dateStr && app.companyName === companyName
        );

        if (!isDuplicate) {
          applications.push({
            companyName,
            position: "", // 증명서에는 포지션이 없음
            appliedDate: dateStr,
            status,
            source: "wanted",
            notes: contact ? `연락처: ${contact}` : undefined,
          });
        }
      }
    }

    // 날짜순으로 정렬
    applications.sort((a, b) => {
      return (
        new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime()
      );
    });

    return applications;
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // PDF 파일만 필터링
    const pdfFiles = files.filter((file) => file.type === "application/pdf");
    if (pdfFiles.length === 0) {
      alert("PDF 파일만 업로드 가능합니다.");
      return;
    }

    if (pdfFiles.length < files.length) {
      alert(
        `${
          files.length - pdfFiles.length
        }개의 파일이 PDF가 아니어서 제외되었습니다.`
      );
    }

    setIsProcessing(true);
    setUploadedFiles(pdfFiles);
    setParsedApplications([]);

    try {
      const allApplications: Omit<
        Application,
        "id" | "createdAt" | "updatedAt"
      >[] = [];

      // 모든 PDF 파일 처리
      for (const file of pdfFiles) {
        try {
          const text = await extractTextFromPDF(file);
          const applications = parseWantedCertificate(text);
          allApplications.push(...applications);
        } catch (error: any) {
          console.error(`파일 ${file.name} 파싱 오류:`, error);
          alert(
            `${file.name}: ${
              error.message || "PDF 파일을 읽는 중 오류가 발생했습니다."
            }`
          );
        }
      }

      if (allApplications.length === 0) {
        alert("지원 내역을 찾을 수 없습니다. PDF 형식을 확인해주세요.");
        setIsProcessing(false);
        return;
      }

      // 중복 제거 (같은 날짜, 같은 회사명)
      const uniqueApplications = allApplications.filter(
        (app, index, self) =>
          index ===
          self.findIndex(
            (a) =>
              a.appliedDate === app.appliedDate &&
              a.companyName === app.companyName
          )
      );

      setParsedApplications(uniqueApplications);
    } catch (error: any) {
      console.error("PDF 파싱 오류:", error);
      alert(error.message || "PDF 파일을 읽는 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddAll = () => {
    if (parsedApplications.length > 0) {
      onParse(parsedApplications);
      setParsedApplications([]);
      setUploadedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setUploadedFiles([]);
    setParsedApplications([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-soft-pink/20 shadow-soft">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          원티드 취업활동 증명서 업로드
        </label>
        {uploadedFiles.length > 0 && parsedApplications.length > 0 && (
          <Button
            onClick={handleAddAll}
            className="flex items-center gap-2 bg-gradient-to-r from-soft-pink to-soft-blue text-white hover:from-soft-pink/90 hover:to-soft-blue/90 shadow-soft rounded-lg text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            {parsedApplications.length}개 항목 추가
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="wanted-cert-upload"
          disabled={isProcessing}
        />
        <label
          htmlFor="wanted-cert-upload"
          className={`flex items-center gap-2 px-4 py-2 border border-soft-pink/30 rounded-lg shadow-soft cursor-pointer transition-all bg-white/80 backdrop-blur-sm hover:bg-white/90 ${
            isProcessing ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-soft-pink border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-600">처리 중...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">PDF 업로드</span>
            </>
          )}
        </label>
        {uploadedFiles.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-soft-pink/10 rounded-lg border border-soft-pink/20"
              >
                <FileText className="w-4 h-4 text-soft-pink" />
                <span className="text-sm text-gray-700 truncate max-w-[200px]">
                  {file.name}
                </span>
              </div>
            ))}
            <button
              onClick={handleRemove}
              className="p-1 hover:bg-soft-pink/20 rounded transition-colors"
              title="모두 제거"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}
      </div>

      {parsedApplications.length > 0 && (
        <div className="mt-3 p-3 bg-soft-blue/10 rounded-lg border border-soft-blue/20">
          <p className="text-sm font-medium text-gray-700 mb-2">
            추출된 지원 내역 ({parsedApplications.length}개)
          </p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {parsedApplications.map((app, index) => (
              <div
                key={index}
                className="text-xs text-gray-600 p-2 bg-white/50 rounded border border-soft-pink/10"
              >
                <div className="font-medium">{app.companyName}</div>
                <div className="text-gray-500">
                  {app.appliedDate} ·{" "}
                  {app.status === "rejected" ? "불합격" : app.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        원티드에서 발급한 취업활동 증명서 PDF를 업로드하면 지원 내역을 자동으로
        추출합니다.
      </p>
    </div>
  );
}
