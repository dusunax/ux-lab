"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, X } from "lucide-react";
import { Button } from "@components/common/Button";
import { resizeImage } from "@utils/imageResize";

interface PhotoUploaderProps {
  onPhotosSelected?: (photos: File[]) => void;
  maxPhotos?: number;
}

export function PhotoUploader({ onPhotosSelected, maxPhotos = 30 }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files).slice(0, maxPhotos - photos.length);
    const resizedFiles: File[] = [];

    for (const file of fileArray) {
      if (file.type.startsWith("image/")) {
        try {
          const resizedFile = await resizeImage(file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.85,
          });
          resizedFiles.push(resizedFile);
        } catch (error) {
          console.error("이미지 리사이징 실패:", error);
          resizedFiles.push(file);
        }
      }
    }

    const newPhotos = [...photos, ...resizedFiles];
    setPhotos(newPhotos);

    const newPreviews = resizedFiles.map((file) => URL.createObjectURL(file));
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

        <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
          <div className="rounded-3xl bg-white p-4">
            <Upload className="h-8 w-8 text-warmGray-500" />
          </div>
          <div>
            <p className="mb-1 text-lg font-medium text-warmGray-900">
              사진을 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-sm text-warmGray-600">최대 {maxPhotos}장까지 업로드 가능합니다</p>
          </div>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            파일 선택
          </Button>
        </div>
      </motion.div>

      {previews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
        >
          {previews.map((preview, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="group relative aspect-square overflow-hidden rounded-2xl bg-warmGray-100"
            >
              <img src={preview} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
              <button
                onClick={() => handleRemovePhoto(index)}
                className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}