"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Card } from "@components/common/Card";
import { PhotoUploader } from "@components/photo/PhotoUploader";
import { ProcessingOverlay } from "@components/common/ProcessingOverlay";
import { mockReports } from "@data/mockReports";

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isProcessing) return;
    const timer = setTimeout(() => setIsProcessing(false), 5200);
    return () => clearTimeout(timer);
  }, [isProcessing]);

  return (
    <main className="min-h-screen px-4 py-12 md:px-8 md:py-16 lg:px-12 lg:py-20">
      <ProcessingOverlay active={isProcessing} />
      <div className="mx-auto max-w-7xl space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="mb-6 inline-flex items-center gap-2 rounded-3xl bg-beige-100 px-6 py-3"
          >
            <Sparkles className="h-5 w-5 text-warmGray-600" />
            <span className="text-sm font-medium text-warmGray-700">
              AI 기반 연말 회고
            </span>
          </motion.div>

          <h1 className="mb-4 text-4xl font-bold tracking-tight text-warmGray-900 md:text-5xl lg:text-6xl">
            Project Afterglow
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-warmGray-600 md:text-xl">
            올해의 소중한 순간들을 AI와 함께 되돌아보며, 따뜻한 회고를
            만들어보세요.
          </p>
        </motion.div>

        <Card className="space-y-10" padding="lg">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2 text-left">
              <h2 className="text-2xl font-semibold text-warmGray-900">
                사진 업로드
              </h2>
              <p className="text-warmGray-600">
                최대 30장까지 업로드하고 AI 분석을 시작하세요.
              </p>
            </div>
            <button
              className="rounded-2xl bg-warmGray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-warmGray-800 active:bg-warmGray-700"
              onClick={() => setIsProcessing(true)}
            >
              모의 분석 시작
            </button>
          </div>

          <PhotoUploader
            maxPhotos={30}
            onPhotosSelected={() => setIsProcessing(true)}
          />

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-warmGray-400" />
              <p className="text-sm text-warmGray-600">
                분석 전, 아래 예시를 참고하여 회고를 설계하세요.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {mockReports.map((report) => (
                <div
                  key={report.month}
                  className="group relative overflow-hidden rounded-3xl border border-beige-200 bg-beige-50/60"
                >
                  {/* 콜라주 형태의 사진 그리드 */}
                  <div className="aspect-video w-full">
                    {report.photos.length === 1 ? (
                      <div className="h-full w-full overflow-hidden bg-warmGray-100">
                        <img
                          src={report.photos[0]}
                          alt={report.month}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : report.photos.length === 2 ? (
                      <div className="grid h-full grid-cols-2 gap-0.5">
                        {report.photos.map((photo, idx) => (
                          <div
                            key={idx}
                            className="overflow-hidden bg-warmGray-100"
                          >
                            <img
                              src={photo}
                              alt={`${report.month} ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid h-full grid-cols-2 gap-0.5">
                        {report.photos.slice(0, 3).map((photo, idx) => (
                          <div
                            key={idx}
                            className={`overflow-hidden bg-warmGray-100 ${
                              idx === 0 ? "row-span-2" : ""
                            }`}
                          >
                            <img
                              src={photo}
                              alt={`${report.month} ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                        {report.photos.length > 3 && (
                          <div className="relative overflow-hidden bg-warmGray-900/60">
                            <img
                              src={report.photos[3]}
                              alt={`${report.month} 4`}
                              className="h-full w-full object-cover opacity-50"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-sm font-semibold text-white">
                                +{report.photos.length - 3}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 텍스트 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 flex flex-col justify-end">
                    <div className="mb-2 text-xs font-semibold text-white/80">
                      {report.month}
                    </div>
                    <div className="mb-2 text-xl font-bold text-white">
                      {report.mood}
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed">
                      {report.summary}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}