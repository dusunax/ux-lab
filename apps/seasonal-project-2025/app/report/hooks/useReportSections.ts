import { useState, useEffect, useCallback, useRef } from "react";
import type { RefObject } from "react";

export type SectionId =
  | "title"
  | "sentence"
  | "personality"
  | "me"
  | "mood"
  | "continue"
  | "timeline";

export interface Section {
  id: SectionId;
  name: string;
  hasScale?: boolean;
}

export const SECTIONS: Section[] = [
  { id: "title", name: "Your 2025", hasScale: true },
  { id: "sentence", name: "올해의 한 문장" },
  { id: "personality", name: "성향" },
  { id: "me", name: "Me at 2025" },
  { id: "mood", name: "Mood at 2025" },
  { id: "continue", name: "2026 to be continue" },
];

/**
 * 섹션 ref를 등록하고 현재 섹션을 자동으로 감지하는 훅
 */
export function useReportSections() {
  const [currentSection, setCurrentSection] = useState<SectionId>("title");
  const sectionRefsRef = useRef<Map<SectionId, RefObject<HTMLElement>>>(
    new Map()
  );
  const observerMapRef = useRef<Map<SectionId, IntersectionObserver>>(
    new Map()
  );

  // Intersection Observer 설정 함수
  const setupObserver = useCallback((sectionId: SectionId) => {
    const ref = sectionRefsRef.current.get(sectionId);
    if (!ref?.current) return;

    // 이미 observer가 있으면 스킵
    if (observerMapRef.current.has(sectionId)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setCurrentSection(sectionId);
          }
        });
      },
      {
        threshold: [0, 0.5, 1],
        rootMargin: "-20% 0px -20% 0px",
      }
    );

    observer.observe(ref.current);
    observerMapRef.current.set(sectionId, observer);
  }, []);

  // 섹션 ref 등록 (메모이제이션)
  const registerSection = useCallback(
    (id: SectionId, ref: RefObject<HTMLElement>) => {
      sectionRefsRef.current.set(id, ref);
      // ref가 등록되면 observer 설정 (약간의 지연을 두어 DOM이 준비되도록)
      setTimeout(() => {
        setupObserver(id);
      }, 0);
    },
    [setupObserver]
  );

  // cleanup: 모든 observer 해제
  useEffect(() => {
    return () => {
      observerMapRef.current.forEach((observer) => observer.disconnect());
      observerMapRef.current.clear();
    };
  }, []);

  return {
    currentSection,
    setCurrentSection,
    registerSection,
  };
}
