"use client";

import { useState, useEffect } from "react";

function detectKakaoInApp(): boolean {
  if (typeof window === "undefined") return false;
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes("kakao") || userAgent.includes("wv");
}

export function useKakaoInApp() {
  const [isKakaoInApp, setIsKakaoInApp] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // 1차 체크 UA
    const firstCheck = detectKakaoInApp();
    if (firstCheck) {
      setIsKakaoInApp(true);
      setShowModal(true);
      return;
    }

    // 2차 체크 (카카오 링크 프리뷰 → 실제 WebView 전환 대응)
    const timer = setTimeout(() => {
      const secondCheck = detectKakaoInApp();
      if (secondCheck) {
        setIsKakaoInApp(true);
        setShowModal(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return {
    isKakaoInApp,
    showModal,
    openModal: () => setShowModal(true),
    closeModal: () => setShowModal(false),
  };
}
