"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Card } from "@components/common/Card";
import { PhotoUploader } from "@components/photo/PhotoUploader";

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-12 md:px-8 md:py-16 lg:px-12 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-16 text-center"
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

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-warmGray-900 md:text-5xl lg:text-6xl">
            Project Afterglow
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-warmGray-600 md:text-xl">
            올해의 소중한 순간들을 AI와 함께 되돌아보며, 따뜻한 회고를 만들어보세요.
          </p>
        </motion.div>

        <Card>
          <PhotoUploader maxPhotos={30} />
        </Card>
      </div>
    </main>
  );
}