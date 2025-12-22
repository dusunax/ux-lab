"use client";

import { motion } from "framer-motion";
import { Base64Image } from "@shared/ui/Base64Image";
import type { MonthlyReport } from "@features/report/types";

interface TimelineProps {
  reports: MonthlyReport[];
}

export function Timeline({ reports }: TimelineProps) {
  return (
    <div className="relative bg-transparent  z-[100] ">
      <div className="relative">
        {/* 상단 그라데이션 오버레이 */}
        <div className="absolute -top-[10vh] left-0 right-0 h-[10vh] bg-gradient-to-b from-transparent via-white/50 to-white pointer-events-none" />
        <div className="bg-white">
          <div className=" max-w-4xl mx-auto px-4 py-20">
            <div className="text-center mb-16">
              <h2 className="text-section-md font-bold text-warmGray-900 mb-4">
                Timeline
              </h2>
              <p className="text-warmGray-600 text-lg">
                올해의 순간들을 되돌아봅니다
              </p>
            </div>
            <div className="space-y-24">
              {reports.map((report, index) => {
                // 짝수 인덱스는 사진이 왼쪽, 홀수 인덱스는 사진이 오른쪽
                const isEven = index % 2 === 0;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="relative"
                  >
                    <div
                      className={`flex flex-col md:flex-row gap-8 items-center ${
                        !isEven ? "md:flex-row-reverse" : ""
                      }`}
                    >
                      {/* 월별 사진 그리드 */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="flex-1 w-full"
                      >
                        {report.photos && report.photos.length > 0 ? (
                          <div
                            className={`grid gap-2 ${
                              report.photos.length === 1
                                ? "grid-cols-1"
                                : report.photos.length === 2
                                ? "grid-cols-2"
                                : "grid-cols-2"
                            }`}
                          >
                            {report.photos
                              .slice(0, 4)
                              .map((photo, photoIndex) => (
                                <motion.div
                                  key={photoIndex}
                                  viewport={{ once: true }}
                                  transition={{
                                    duration: 0.4,
                                    delay: photoIndex * 0.1,
                                  }}
                                  className="relative overflow-hidden rounded-2xl aspect-square bg-warmGray-200"
                                >
                                  <Base64Image
                                    src={photo}
                                    alt={`${report.month} ${photoIndex + 1}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    placeholderText="이미지 없음"
                                  />
                                </motion.div>
                              ))}
                          </div>
                        ) : (
                          <div className="w-full h-64 rounded-2xl bg-warmGray-200 flex items-center justify-center text-warmGray-400">
                            사진이 없습니다
                          </div>
                        )}
                      </motion.div>

                      {/* 월별 정보 (분석 문장) */}
                      <div className="flex-1 w-full space-y-4">
                        <div className="flex items-center gap-3">
                          <h3 className="text-subsection font-bold text-warmGray-900">
                            {report.month}
                          </h3>
                          <span className="px-3 py-1 rounded-full bg-beige-200/60 text-warmGray-700 text-sm font-medium flex items-center gap-1.5">
                            <span>{report.mood.emoji}</span>
                            <span>{report.mood.text}</span>
                          </span>
                        </div>
                        <p className="text-lg text-warmGray-700 leading-relaxed">
                          {report.summary}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
