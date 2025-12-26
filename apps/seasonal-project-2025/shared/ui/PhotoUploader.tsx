"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FileStackIcon, Plus, Upload, X } from "lucide-react";
import { Button } from "@shared/ui/Button";

interface PhotoUploaderProps {
  onPhotosSelected?: (photos: File[]) => void;
  maxPhotos?: number;
}

export function PhotoUploader({
  onPhotosSelected,
  maxPhotos = 24,
}: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<string[]>([]);

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  // AI 분석 완료 후 photos 초기화
  useEffect(() => {
    const handleAnalysisComplete = () => {
      // 모든 preview URL 클리어
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
      setPhotos([]);
      setPreviews([]);
    };

    window.addEventListener("analysisComplete", handleAnalysisComplete);
    return () => {
      window.removeEventListener("analysisComplete", handleAnalysisComplete);
    };
  }, []);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files).slice(0, maxPhotos - photos.length);
    const imageFiles = fileArray.filter((file) =>
      file.type.startsWith("image/")
    );

    const newPhotos = [...photos, ...imageFiles];
    setPhotos(newPhotos);

    const newPreviews = imageFiles.map((file) => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);

    onPhotosSelected?.(newPhotos);
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    URL.revokeObjectURL(previews[index]);
    setPhotos(newPhotos);
    setPreviews(newPreviews);
    onPhotosSelected?.(newPhotos);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative rounded-3xl border-2 border-dashed transition-colors duration-200 
          ${
            isDragging
              ? "border-warmGray-400 bg-beige-50"
              : photos.length > 0
              ? "border-warmGray-500 bg-beige-50/80"
              : "border-warmGray-300 bg-beige-50/50"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        <div className="flex flex-col gap-4 px-6 sm:px-6 py-6 md:px-10 md:py-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            {photos.length > 0 ? (
              <>
                <div className="flex items-center gap-2 rounded-full border border-warmGray-600 px-4 py-2 text-warmGray-900">
                  <FileStackIcon className="w-5 h-5 text-warmGray-500" />
                  <span className="text-sm font-medium">
                    {photos.length}장 첨부됨
                  </span>
                </div>
                <div>
                  <p className="mb-1 text-lg font-medium text-warmGray-900">
                    사진이 첨부되었습니다
                  </p>
                  <p className="text-sm text-warmGray-600">
                    최대 {maxPhotos}장까지 추가 업로드 가능합니다
                  </p>
                  <p className="text-sm text-warmGray-600"></p>
                </div>
                <Button
                  variant={
                    photos.length === maxPhotos ? "secondary" : "primary"
                  }
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1"
                  disabled={photos.length >= maxPhotos}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                  사진 추가
                </Button>
                <span className="text-sm text-warmGray-600"></span>
              </>
            ) : (
              <>
                <div className="rounded-3xl bg-white p-4 sm:block hidden">
                  <Upload className="h-8 w-8 text-warmGray-500" />
                </div>
                <div>
                  <p className="mb-1 text-lg font-medium text-warmGray-900">
                    <span className="sm:block hidden">
                      사진을 드래그하거나 클릭하여 업로드
                    </span>
                  </p>
                  <p className="text-sm text-warmGray-600">
                    최대 {maxPhotos}장까지 업로드 가능합니다
                  </p>
                </div>
                <Button
                  variant={
                    photos.length === maxPhotos ? "secondary" : "primary"
                  }
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  사진 선택
                </Button>
              </>
            )}

            {previews.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-3 pt-4 border-t border-warmGray-400"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-semibold text-warmGray-900">
                    첨부된 사진{" "}
                    <span className="text-warmGray-500">
                      ({previews.length}장)
                    </span>
                  </h3>
                </div>
                <div className="grid gap-3 sm:gap-4 grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                  {previews.map((preview, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.03,
                        ease: "easeOut",
                      }}
                      whileHover={{ scale: 1.02 }}
                      className="group relative aspect-square overflow-hidden lg:rounded-lg rounded-md bg-warmGray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      <button
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute right-2 top-2 rounded-full bg-black/60 backdrop-blur-sm p-1.5 hover:bg-black/80 transition-all duration-200 shadow-lg"
                        aria-label={`사진 ${index + 1} 삭제`}
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
      <div className="space-y-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-2xl bg-beige-50/80 border border-beige-200 px-4 py-3"
        >
          <p className="text-sm text-warmGray-600 leading-relaxed">
            <span className="font-medium text-warmGray-700">💡 안내:</span> 사진
            편집 프로그램을 사용했거나, 메신저를 통해 공유한 파일은 촬영 날짜가
            다를 수 있습니다.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl bg-beige-50/80 border border-beige-200 px-4 py-3"
        >
          <p className="text-sm text-warmGray-600 leading-relaxed">
            <span className="font-medium text-warmGray-700">🔒 사진:</span>{" "}
            업로드한 사진은 저장되지 않습니다. AI 분석과 PDF 생성을 위한 용도
            외에는 사용되지 않습니다.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
