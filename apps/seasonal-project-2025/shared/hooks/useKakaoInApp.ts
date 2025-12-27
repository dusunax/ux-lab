"use client";

import { useState, useEffect } from "react";

/**
 * 카카오톡 인앱 브라우저 감지
 */
function detectKakaoInApp(): boolean {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent;
  return ua.includes("KakaoTalk") || ua.includes("KAKAO");
}

/**
 * 카카오톡 인앱 브라우저 감지 훅
 */
export function useKakaoInApp() {
  const [isKakaoInApp, setIsKakaoInApp] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const isKakao = detectKakaoInApp();
    setIsKakaoInApp(isKakao);

    if (isKakao) {
      setShowModal(true);
    }
  }, []);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  return {
    isKakaoInApp,
    showModal,
    openModal,
    closeModal,
  };
}
