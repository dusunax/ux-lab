"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Copy, ExternalLink, X } from "lucide-react";
import { Button } from "@shared/ui/Button";
import { toast } from "sonner";
import { trackButtonClick } from "@shared/lib/gtag";
import { useState, useEffect } from "react";

interface KakaoInAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KakaoInAppModal({ isOpen, onClose }: KakaoInAppModalProps) {
  const [currentUrl, setCurrentUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const handleCopyUrl = async () => {
    if (!currentUrl) return;

    try {
      // 클립보드 API 사용 시도
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(currentUrl);
        setIsCopied(true);
        toast.success("URL이 클립보드에 복사되었습니다.", { duration: 3000 });
        trackButtonClick("카카오톡 모달 - URL 복사");

        // 2초 후 복사 상태 초기화
        setTimeout(() => setIsCopied(false), 2000);
      } else {
        // 클립보드 API가 없는 경우 fallback
        const textArea = document.createElement("textarea");
        textArea.value = currentUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
          setIsCopied(true);
          toast.success("URL이 클립보드에 복사되었습니다.", { duration: 3000 });
          trackButtonClick("카카오톡 모달 - URL 복사");
          setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
          toast.error("복사에 실패했습니다. URL을 직접 선택해서 복사해주세요.");
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      toast.error("복사에 실패했습니다. URL을 직접 선택해서 복사해주세요.");
    }
  };

  const handleClose = () => {
    trackButtonClick("카카오톡 모달 - 닫기");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
          >
            {/* 닫기 버튼 */}
            <button
              onClick={handleClose}
              data-ga-label="카카오톡 모달 - X 버튼 닫기"
              className="absolute top-4 right-4 text-warmGray-400 hover:text-warmGray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 아이콘 */}
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 flex items-center justify-center">
                <span className="text-3xl">💡</span>
              </div>
            </div>

            {/* 제목 */}
            <h3 className="text-xl font-bold text-warmGray-900 text-center mb-3">
              카카오톡 인앱 브라우저 안내
            </h3>

            {/* 내용 */}
            <div className="space-y-3 mb-6">
              <p className="text-sm text-warmGray-600 leading-relaxed text-center">
                카카오톡 인앱 브라우저에서는 <br />
                아래 기능이 제한될 수 있습니다
              </p>
              <div className="flex justify-center">
                <p className="text-center text-sm bg-beige-100 text-warmGray-900 px-4 py-1 border border-beige-100 rounded-full">
                  PDF 다운로드
                </p>
              </div>
              <p className="text-sm text-center text-warmGray-600">
                완벽한 경험을 위해 외부 브라우저에서 열어주세요.
                <br />
                (Chrome, Safari 등)
              </p>
            </div>

            {/* URL 표시 및 복사 */}
            <div className="mb-2">
              <div className="bg-warmGray-50 border border-warmGray-200 rounded-xl px-4 py-2 mb-3">
                <div className="flex items-center gap-2">
                  <p className="flex-1 text-xs text-warmGray-700 break-all select-text">
                    {currentUrl}
                  </p>
                  <button
                    onClick={handleCopyUrl}
                    data-ga-label="카카오톡 모달 - URL 복사"
                    className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                      isCopied
                        ? "bg-green-100 text-green-700"
                        : "bg-warmGray-200 hover:bg-warmGray-300 text-warmGray-700"
                    }`}
                    title="URL 복사"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {isCopied && (
                <p className="text-xs text-green-600 text-center pb-2">
                  ✓ 복사되었습니다
                </p>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex flex-col gap-3">
              <Button
                variant="primary"
                size="md"
                data-ga-label="카카오톡 모달 - 외부 브라우저 열기 버튼"
                className="w-full flex items-center justify-center"
                onClick={() =>
                  (location.href =
                    "kakaotalk://web/openExternal?url=" + currentUrl)
                }
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                외부 브라우저에서 열기
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={handleClose}
                data-ga-label="카카오톡 모달 - 닫기 버튼"
                className="w-full border border-warmGray-900 text-warmGray-900"
              >
                닫기
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

