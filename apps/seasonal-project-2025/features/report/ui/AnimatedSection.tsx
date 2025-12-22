"use client";

import { useRef, useEffect, ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { SectionId } from "@features/report/hooks/useReportSections";

interface AnimatedSectionProps {
  sectionId: SectionId;
  registerSection?: (id: SectionId, ref: React.RefObject<HTMLElement>) => void;
  children: ReactNode;
  backgroundClassName?: string;
  backgroundStyle?: React.CSSProperties;
  hasScale?: boolean;
  wrapperClassName?: string;
}

export function AnimatedSection({
  sectionId,
  registerSection,
  children,
  backgroundClassName = "bg-black",
  backgroundStyle,
  hasScale = false,
  wrapperClassName = "flex items-center justify-center",
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });

  useEffect(() => {
    if (registerSection) {
      registerSection(sectionId, ref);
    }
  }, [registerSection, sectionId]);

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [50, 0, 0, -50]);
  const scale = hasScale
    ? useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.8, 1, 1, 0.8])
    : undefined;

  return (
    <>
      <section
        ref={ref}
        className={`relative h-screen bg-black ${backgroundClassName}`}
      />
      <motion.div
        style={{
          opacity,
          y,
          ...(scale && { scale }),
          ...backgroundStyle,
        }}
        className={`fixed inset-0 z-10 ${wrapperClassName} ${backgroundClassName}`}
      >
        {children}
      </motion.div>
    </>
  );
}
