"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mockAnalysisResult } from "@features/report/data/mockAnalysisResults";
import { ExampleModal } from "./ExampleModal";
import { Base64Image } from "@shared/ui/Base64Image";
import type { AnalysisResult } from "@features/report/types";

export function Examples() {
  const router = useRouter();
  const [selectedExample, setSelectedExample] = useState<AnalysisResult | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleExampleClick = (example: AnalysisResult) => {
    // md 이하(모바일)에서는 모달 대신 바로 이동
    if (window.innerWidth < 768) {
      router.push("/report?example=" + example.id);
      return;
    }
    // md 이상에서는 모달 표시
    setSelectedExample(example);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedExample(null);
  };

  return (
    <>
      <div className="space-y-4 mt-16">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-warmGray-400" />
          <p className="text-sm text-warmGray-600">
            분석 전, 아래 예시 카드 결과를 참고하세요.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[mockAnalysisResult].map((example, index) => (
            <ExampleCard
              key={index}
              example={example}
              index={index}
              onClick={() => handleExampleClick(example)}
            />
          ))}
        </div>
      </div>

      <ExampleModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        analysisResult={selectedExample}
      />
    </>
  );
}

interface ExampleCardProps {
  example: AnalysisResult;
  index: number;
  onClick: () => void;
}

function ExampleCard({ example, index, onClick }: ExampleCardProps) {
  // 모든 월별 리포트의 사진들을 합쳐서 전체 이미지 중에서 선택
  const allPhotos = example.monthlyReports.flatMap(
    (report) => report.photos || []
  );
  // 썸네일로 사용할 이미지 선택 (최대 4개)
  const previewPhotos = allPhotos.slice(0, 4);

  return (
    <button
      onClick={onClick}
      data-ga-label="예시 카드 클릭"
      className="group relative overflow-hidden rounded-3xl border border-beige-200 bg-beige-50/60 transition-all duration-200 hover:border-beige-300 hover:bg-beige-50 hover:shadow-md cursor-pointer text-left w-full"
    >
      {/* 콜라주 형태의 사진 그리드 */}
      <div className="aspect-video w-full">
        {previewPhotos.length === 1 ? (
          <div className="h-full w-full overflow-hidden bg-warmGray-100">
            <Base64Image
              src={previewPhotos[0]}
              alt={`example image`}
              className="h-full w-full object-cover"
              placeholderText="이미지 없음"
            />
          </div>
        ) : previewPhotos.length === 2 ? (
          <div className="grid h-full grid-cols-2 gap-0.5">
            {previewPhotos.map((photo, idx) => (
              <div key={idx} className="overflow-hidden bg-warmGray-100">
                <Base64Image
                  src={photo}
                  alt={`example image ${idx + 1}`}
                  className="h-full w-full object-cover"
                  placeholderText="이미지 없음"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid h-full grid-cols-2 gap-0.5">
            {/* 첫 번째 이미지: 왼쪽 전체 (row-span-2) */}
            <div className="row-span-2 overflow-hidden bg-warmGray-100">
              <Base64Image
                src={previewPhotos[0]}
                alt={`example image 1`}
                className="h-full w-full object-cover"
                placeholderText="이미지 없음"
              />
            </div>
            {/* 두 번째 이미지: 오른쪽 위 */}
            <div className="overflow-hidden bg-warmGray-100">
              <Base64Image
                src={previewPhotos[1]}
                alt={`example image 2`}
                className="h-full w-full object-cover"
                placeholderText="이미지 없음"
              />
            </div>
            {/* 세 번째 이미지 또는 추가 이미지 카운트: 오른쪽 아래 */}
            {previewPhotos.length === 3 ? (
              <div className="overflow-hidden bg-warmGray-100">
                <Base64Image
                  src={previewPhotos[2]}
                  alt={`example image 3`}
                  className="h-full w-full object-cover"
                  placeholderText="이미지 없음"
                />
              </div>
            ) : (
              <div className="relative overflow-hidden bg-warmGray-900/60">
                <Base64Image
                  src={previewPhotos[2]}
                  alt={`example image 3`}
                  className="h-full w-full object-cover opacity-50"
                  placeholderText=""
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    +{previewPhotos.length - 2}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 텍스트 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 flex flex-col justify-end">
        <div className="mb-2 text-xl font-bold text-white line-clamp-2">
          {example.yearSentence}
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {example.keywords.slice(0, 3).map((keyword, idx) => (
            <span
              key={idx}
              className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-white/90"
            >
              {keyword.emoji} {keyword.text}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
