"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import type { AnalysisResult } from "@features/report/types";

interface AnalysisContextType {
  analysisResult: AnalysisResult | null;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  uploadedPhotos: File[];
  setUploadedPhotos: (photos: File[]) => void;
  uploadedPhotoPreviews: string[];
  setUploadedPhotoPreviews: (previews: string[]) => void;
  photoBase64s: string[];
  setPhotoBase64s: (base64s: string[]) => void;
  clearAnalysisData: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(
  undefined
);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [uploadedPhotoPreviews, setUploadedPhotoPreviews] = useState<string[]>(
    []
  );
  const [photoBase64s, setPhotoBase64s] = useState<string[]>([]);

  const clearAnalysisData = useCallback(() => {
    setAnalysisResult(null);
    setUploadedPhotos([]);
    uploadedPhotoPreviews.forEach((url) => URL.revokeObjectURL(url));
    setUploadedPhotoPreviews([]);
    setPhotoBase64s([]);
  }, [uploadedPhotoPreviews]);

  return (
    <AnalysisContext.Provider
      value={{
        analysisResult,
        setAnalysisResult,
        uploadedPhotos,
        setUploadedPhotos,
        uploadedPhotoPreviews,
        setUploadedPhotoPreviews,
        photoBase64s,
        setPhotoBase64s,
        clearAnalysisData,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);

  console.log("context", context);
  if (context === undefined) {
    throw new Error("useAnalysis must be used within an AnalysisProvider");
  }
  return context;
}

