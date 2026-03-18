import { type CSSProperties, type PointerEvent, type RefObject, useMemo } from "react";
import type { Creature, InterfaceText } from "../game/engine";
import { getEmotionLabel } from "../game/engine";
import { ASSET_PATHS, OBSERVER_CHAMBER_BG_IMAGES } from "../../lib/assets";
import { ObserverCoreFog } from "./ObserverCoreFog";

type ObserverPanelProps = {
  uiText: InterfaceText;
  isObserverAutoTarget: boolean;
  observerCreature: Creature | null;
  observerStyle: CSSProperties;
  observerYaw: number;
  observerPitch: number;
  observerDragOffset: {
    x: number;
    y: number;
  };
  isDraggingObserver: boolean;
  observerShellRef: RefObject<HTMLDivElement | null>;
  onObserverTargetOpen: () => void;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
};

export function ObserverPanel({
  uiText,
  isObserverAutoTarget,
  observerCreature,
  observerStyle,
  observerYaw,
  observerPitch,
  observerDragOffset,
  isDraggingObserver,
  observerShellRef,
  onObserverTargetOpen,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: ObserverPanelProps) {
  const summaryTarget = isObserverAutoTarget
    ? uiText.observerAuto
    : observerCreature?.nickname ?? uiText.noObserverTarget;
  const luminaCoreColor = observerCreature
    ? `rgb(${observerCreature.rgb.r}, ${observerCreature.rgb.g}, ${observerCreature.rgb.b})`
    : "rgb(128, 210, 255)";
  const luminaCoreColorWithAlpha = useMemo(() => {
    const [r, g, b] = luminaCoreColor
      .replace("rgb(", "")
      .replace(")", "")
      .split(",")
      .map((value) => Number.parseInt(value.trim(), 10));
    return {
      strong: `rgba(${r}, ${g}, ${b}, 0.7)`,
      soft: `rgba(${r}, ${g}, ${b}, 0.45)`,
      mid: `rgba(${r}, ${g}, ${b}, 0.2)`,
    };
  }, [luminaCoreColor]);
  const emotionLabel = useMemo(
    () => (observerCreature ? getEmotionLabel(observerCreature.emotion) : ""),
    [observerCreature],
  );

  const observerOrbStyle: CSSProperties = useMemo(
    () => ({
      ["--observer-orb-size" as keyof CSSProperties]: "190px",
      ["--observer-core-size" as keyof CSSProperties]: "80px",
      ["--observer-shape" as keyof CSSProperties]: "50%",
      ["--observer-ring-a-inset" as keyof CSSProperties]: "8px",
      ["--observer-ring-b-inset" as keyof CSSProperties]: "10px",
      ["--observer-ring-c-inset" as keyof CSSProperties]: "18px",
      ["--observer-halo-scale" as keyof CSSProperties]: "1",
      ["--observer-core-scale" as keyof CSSProperties]: "1",
      ["--observer-core-pulse" as keyof CSSProperties]: "1",
      ["--observer-core-glow" as keyof CSSProperties]: "1",
      ["--observer-halo-intensity" as keyof CSSProperties]: "1",
      ["--observer-ring-a-speed" as keyof CSSProperties]: "6.8s",
      ["--observer-ring-b-speed" as keyof CSSProperties]: "8.8s",
      ["--observer-ring-c-speed" as keyof CSSProperties]: "10.6s",
      ["--lumina-core" as keyof CSSProperties]: luminaCoreColor,
    }),
    [luminaCoreColor],
  );

  const observerChamberBackgroundStyle: CSSProperties = useMemo(
    () => ({
      backgroundImage: `url(${ASSET_PATHS.imgs.observerChamber}), ${OBSERVER_CHAMBER_BG_IMAGES.base}, ${OBSERVER_CHAMBER_BG_IMAGES.cornerGlow}, ${OBSERVER_CHAMBER_BG_IMAGES.cornerPulse}`,
      backgroundSize: "contain, auto, auto, auto",
      backgroundPosition: "center, center, center, center",
      backgroundRepeat: "no-repeat",
      backgroundBlendMode: "normal, screen, normal, normal",
    }),
    [],
  );
  const observerOrbTransform = isDraggingObserver
    ? "perspective(840px) rotateX(10deg) rotateY(-2deg) scale(0.965)"
    : "perspective(840px) rotateX(10deg) rotateY(-2deg) scale(1)";

  return (
    <section
      className="w-full h-full max-w-full rounded-none border-2 border-primary shadow-[0_0_30px_rgba(102,240,255,0.15)] relative overflow-hidden px-4 py-4 flex-col flex"
      style={observerChamberBackgroundStyle}
    >
      <h2 className="mb-4">{uiText.observerPanel}</h2>
      <div className="my-4 flex flex-col gap-1">
        <div className="grid grid-cols-1 gap-2">
          <button
            className="inline-flex min-h-9 items-center justify-center border-2 border-[rgba(130,199,255,0.8)] bg-[linear-gradient(180deg,rgba(43,84,151,0.72),rgba(17,29,64,0.82))] px-2.5 py-2 text-[15px] text-[#f6fdff] tracking-[0.4px] hover:border-[rgba(130,245,255,1)] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)]"
            aria-label={uiText.observerTarget}
            onClick={onObserverTargetOpen}
            type="button"
          >
            {uiText.observerTarget}
          </button>
        </div>
        <output
          role="status"
          aria-label={`${uiText.observerTarget}: ${summaryTarget}`}
          className="text-sm text-muted self-end"
        >
          {uiText.observerTarget}: {summaryTarget}
        </output>
      </div>
      {observerCreature ? (
        <div className="flex flex-1 min-h-0 items-center justify-center">
          <div className="relative flex flex-col w-full max-h-20 min-w-0 mb-[20%] justify-center overflow-x-hidden overflow-y-hidden box-border perspective-[900px] p-4 border border-[rgba(130,206,255,0.28)] min-h-[clamp(360px,47vh,470px)] bg-transparent shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),inset_0_0_48px_rgba(80,190,255,0.2)] max-w-80">
            <div
              className="relative w-full max-w-full min-w-0 box-border overflow-hidden border-2 border-[rgba(130,220,255,0.45)] [aspect-ratio:16/9] min-h-[320px] h-[min(clamp(280px,34vh,360px),100%)] max-h-full m-0 bg-transparent [box-shadow:inset_0_0_26px_rgba(96,205,255,0.25),inset_0_0_0_2px_rgba(255,255,255,0.06)]"
            >
              <div className="flex flex-col text-center text-[11px] tracking-[0.26em] text-[rgba(194,239,255,0.95)] uppercase z-[3]">
                <span className="mt-4 text-[11px] tracking-[0.26em] text-[rgba(194,239,255,0.95)] uppercase text-shadow-[0_0_8px_rgba(98,235,255,0.5)]">
                  LUMINA OBSERVATORY
                </span>
              </div>
              <div className="absolute left-2.5 right-2.5 top-[2.6rem] bottom-2.5 border border-[rgba(130,220,255,0.25)] bg-transparent shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] z-[2]">
                <span
                  className="pointer-events-none absolute inset-0 z-[2] border-[1px] border-[rgba(125,225,255,0.14)] [box-shadow:inset_0_0_28px_rgba(95,220,255,0.16)]"
                />
                <span
                  className="absolute left-[14px] top-[12%] h-[14px] w-[14px] border border-[rgba(130,240,255,0.7)] border-b-0 border-r-0 z-[4]"
                />
                <span
                  className="absolute right-[14px] top-[12%] h-[14px] w-[14px] border border-[rgba(130,240,255,0.7)] border-b-0 border-l-0 z-[4]"
                />
                <span
                  className="absolute bottom-[14px] left-[14px] h-[14px] w-[14px] border border-[rgba(130,240,255,0.7)] border-t-0 border-r-0 z-[4]"
                />
                <span
                  className="absolute bottom-[14px] right-[14px] h-[14px] w-[14px] border border-[rgba(130,240,255,0.7)] border-t-0 border-l-0 z-[4]"
                />
                <div
                  className="absolute left-3 right-3 top-3 bottom-3 flex items-center justify-center overflow-hidden bg-transparent"
                >
                  <span
                    className="observer-aura-layer pointer-events-none absolute -inset-12 mix-blend-screen opacity-30"
                    style={{
                      zIndex: 0,
                      background: `radial-gradient(circle at 50% 50%, ${luminaCoreColorWithAlpha.strong} 0%, ${luminaCoreColorWithAlpha.soft} 24%, ${luminaCoreColorWithAlpha.mid} 48%, transparent 78%)`,
                    }}
                  />
                  <span
                    className="pointer-events-none absolute inset-[4px] [background:radial-gradient(circle_at_50%_80%,transparent,rgba(8,26,42,0.34)_58%)] [mix-blend-mode:multiply] z-[2]"
                  />
                  <span
                    className="pointer-events-none absolute inset-0 [box-shadow:inset_0_0_22px_rgba(9,17,34,0.6),inset_0_-24px_36px_rgba(16,50,98,0.5)] z-[3]"
                  />
                  <div
                    ref={observerShellRef}
                    className={`relative m-0 mx-auto w-[min(100%,_clamp(190px,_28vw,_320px))] aspect-square h-auto [touch-action:none] [transform-style:preserve-3d] bg-transparent z-[4] ${
                      isDraggingObserver ? "cursor-grabbing" : "cursor-grab"
                    }`}
                    style={{
                      ...observerOrbStyle,
                      cursor: isDraggingObserver ? "grabbing" : "grab",
                      transform: observerOrbTransform,
                      transition: "transform 110ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={onPointerUp}
                  >
                    <ObserverCoreFog
                      color={luminaCoreColor}
                      yaw={observerYaw}
                      pitch={observerPitch}
                      dragOffsetX={observerDragOffset.x}
                      dragOffsetY={observerDragOffset.y}
                    />
                  </div>
                </div>
              </div>
            </div>
            <output
              role="status"
              aria-label={`${observerCreature.nickname} ${observerCreature.commonName} ${emotionLabel}`}
              className="translate-y-6 inline-flex mx-auto w-fit max-w-full items-center rounded-md border border-[rgba(130,210,255,0.45)] bg-[rgba(6,12,24,0.84)] px-3 py-1.5 text-xs tracking-[0.15em] text-[#d5f1ff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_0_16px_rgba(120,220,255,0.18)]"
            >
              {observerCreature.nickname} ({observerCreature.commonName}) |{" "}
              {emotionLabel}
            </output>
          </div>
        </div>
      ) : (
        <output role="status" aria-label={uiText.noObserverTarget} className="mt-2 text-[13px] text-muted">
          {uiText.noObserverTarget}
        </output>
      )}
    </section>
  );
}
