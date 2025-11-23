"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@ux-lab/ui";

interface PDFUploaderProps {
  onExtract: (data: {
    companyName?: string;
    position?: string;
    notes?: string;
  }) => void;
}

export default function PDFUploader({ onExtract }: PDFUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // 동적 import로 pdfjs-dist 로드 (클라이언트 사이드에서만)
    if (typeof window === "undefined") {
      throw new Error("PDF extraction is only available in the browser");
    }

    const pdfjsLib = await import("pdfjs-dist");

    // Worker 설정 - CDN에서 worker 로드
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";

    // 모든 페이지에서 텍스트 추출
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }

    return fullText;
  };

  const parsePDFContent = (text: string) => {
    // 기본적인 정보 추출 시도
    const lines = text.split("\n").filter((line) => line.trim());

    let companyName = "";
    let position = "";

    // 회사명 패턴 찾기 (일반적인 패턴들)
    const companyPatterns = [
      /(?:회사명|회사|기업|기관)[\s:：]*([^\n]+)/i,
      /([가-힣]+(?:주식회사|㈜|\(주\)|Corporation|Corp|Inc|Ltd|Co\.))/i,
    ];

    for (const pattern of companyPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        companyName = match[1].trim();
        break;
      }
    }

    // 포지션 패턴 찾기
    const positionPatterns = [
      /(?:포지션|직무|직책|채용|모집)[\s:：]*([^\n]+)/i,
      /(프론트엔드|백엔드|풀스택|프로덕트|디자이너|개발자|매니저|엔지니어|분석가)[^\n]*/i,
    ];

    for (const pattern of positionPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        position = match[1].trim();
        break;
      }
    }

    // 첫 번째 줄이 회사명일 가능성
    if (!companyName && lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length < 50 && !firstLine.includes("http")) {
        companyName = firstLine;
      }
    }

    return {
      companyName: companyName || "",
      position: position || "",
      notes: text.substring(0, 500), // 처음 500자만 메모로 저장
    };
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      alert("PDF 파일만 업로드 가능합니다.");
      return;
    }

    setIsProcessing(true);
    setUploadedFileName(file.name);

    try {
      const text = await extractTextFromPDF(file);
      const extractedData = parsePDFContent(text);
      onExtract(extractedData);
    } catch (error) {
      console.error("PDF 파싱 오류:", error);
      alert("PDF 파일을 읽는 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = () => {
    setUploadedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        PDF 파일 업로드 (선택)
      </label>
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
          id="pdf-upload"
          disabled={isProcessing}
        />
        <label
          htmlFor="pdf-upload"
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
        {uploadedFileName && (
          <div className="flex items-center gap-2 px-3 py-2 bg-soft-pink/10 rounded-lg border border-soft-pink/20">
            <FileText className="w-4 h-4 text-soft-pink" />
            <span className="text-sm text-gray-700 truncate max-w-[200px]">
              {uploadedFileName}
            </span>
            <button
              onClick={handleRemove}
              className="p-1 hover:bg-soft-pink/20 rounded transition-colors"
              title="제거"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500">
        PDF 파일을 업로드하면 회사명, 포지션 등 정보를 자동으로 추출합니다.
      </p>
    </div>
  );
}
