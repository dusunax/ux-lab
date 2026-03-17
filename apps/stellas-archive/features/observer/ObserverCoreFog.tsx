import { useEffect, useMemo, useRef, useState } from "react";
import { ObserverCoreCanvas } from "./ObserverCoreCanvas";

type ObserverCoreFogProps = {
  color: string;
  yaw: number;
  pitch: number;
  dragOffsetX: number;
  dragOffsetY: number;
};

export function ObserverCoreFog({ color, yaw, pitch, dragOffsetX, dragOffsetY }: ObserverCoreFogProps) {
  const [mounted, setMounted] = useState(false);
  const [isPixelBurst, setPixelBurst] = useState(false);
  const [burstScale, setBurstScale] = useState(1.018);
  const patternIndexRef = useRef(0);

  const burstPatterns = useMemo(
    () => [
      { clearMs: 1500, burstScale: 1.018 },
      { clearMs: 2600, burstScale: 1.028 },
      { clearMs: 2200, burstScale: 0.992 },
    ],
    [],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let scheduleId: ReturnType<typeof setTimeout> | null = null;
    let burstEndId: ReturnType<typeof setTimeout> | null = null;

    const loop = () => {
      const pattern = burstPatterns[patternIndexRef.current];
      patternIndexRef.current = (patternIndexRef.current + 1) % burstPatterns.length;
      scheduleId = setTimeout(() => {
        setBurstScale(pattern.burstScale);
        setPixelBurst(true);
        burstEndId = setTimeout(() => {
          setPixelBurst(false);
          loop();
        }, 200);
      }, pattern.clearMs);
    };

    loop();

    return () => {
      if (scheduleId) clearTimeout(scheduleId);
      if (burstEndId) clearTimeout(burstEndId);
    };
  }, [burstPatterns]);

  if (!mounted) {
    return (
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-[40] overflow-hidden"
        style={{
          width: "100%",
          height: "100%",
          transform: "translate(-50%, -50%)",
        }}
      />
    );
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[40] overflow-hidden"
    >
      <ObserverCoreCanvas
        color={color}
        yaw={yaw}
        pitch={pitch}
        isPixelBurst={isPixelBurst}
        burstScale={isPixelBurst ? burstScale : 1}
        dragOffsetX={dragOffsetX}
        dragOffsetY={dragOffsetY}
      />
    </div>
  );
}
