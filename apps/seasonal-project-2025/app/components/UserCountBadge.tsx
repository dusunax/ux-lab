"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getTotalUserCount } from "@shared/lib/getTotalUserCount";

export function UserCountBadge() {
  const [count, setCount] = useState<number | null>(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    getTotalUserCount()
      .then(setCount)
      .catch((e) => console.error("총 사용자 수 조회 실패:", e));
  }, []);

  useEffect(() => {
    if (count === null) return;

    const start = performance.now();
    const duration = 1000;

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.floor(count * progress));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [count]);

  return (
    <p
      className={`text-sm md:text-base text-warmGray-500 text-center mt-4 transition-opacity duration-200 md:mt-6 ${
        display ? "opacity-100" : "opacity-0"
      }`}
    >
      ✨ 지금까지{" "}
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: count ? 1 : 0, y: display ? 0 : 20 }}
        transition={{ duration: 0.4 }}
        className="font-semibold text-warmGray-700 inline-block"
      >
        {count ? display.toLocaleString() : "0"}명
      </motion.span>
      이 한 해를 돌아봤어요. ✨
    </p>
  );
}
