"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReportView } from "@features/report/ui/ReportView";
import { useAnalysis } from "@features/report/model/AnalysisContext";
import { mockAnalysisResult } from "@features/report/data/mockAnalysisResults";

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { analysisResult } = useAnalysis();
  const exampleId = searchParams.get("example");
  const examples = [mockAnalysisResult];

  // example 쿼리 파라미터가 있으면 example 데이터 사용
  const result = exampleId
    ? examples.find((result) => result.id === parseInt(exampleId, 10))
    : analysisResult;

  useEffect(() => {
    if (!result) {
      router.push("/");
      return;
    }
  }, [result, router]);

  if (!result) {
    return null;
  }

  return <ReportView analysisResult={result} />;
}

export default function ReportPage() {
  return (
    <Suspense fallback={null}>
      <ReportContent />
    </Suspense>
  );
}
