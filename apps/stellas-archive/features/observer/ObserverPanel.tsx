import { type CSSProperties, type PointerEvent, type RefObject, useMemo } from "react";
import type { Creature, InterfaceText } from "../game/engine";
import { getEmotionLabel } from "../game/engine";
import { ASSET_PATHS, OBSERVER_CHAMBER_BG_IMAGES } from "../../lib/assets";

type ObserverPanelProps = {
  uiText: InterfaceText;
  isObserverAutoTarget: boolean;
  observerCreature: Creature | null;
  observerStyle: CSSProperties;
  observerYaw: number;
  observerPitch: number;
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

  return (
    <section
      className="w-full h-full max-w-full rounded-none border-2 border-[var(--line)] shadow-[var(--shadow)] relative overflow-hidden px-4 py-4 flex-col flex"
      style={observerChamberBackgroundStyle}
    >
      <h2 className="mb-4">{uiText.observerPanel}</h2>
      <div className="my-4 flex items-center justify-between gap-2">
        <output
          role="status"
          aria-label={`${uiText.observerTarget}: ${summaryTarget}`}
          className="text-[13px] text-[var(--muted)]"
        >
          {uiText.observerTarget}: {summaryTarget}
        </output>
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
      </div>
      {observerCreature ? (
        <div className="flex flex-1 min-h-0 items-center justify-center">
          <div className="relative flex flex-col w-full max-h-20 min-w-0 mb-[20%] justify-center overflow-x-hidden overflow-y-hidden box-border perspective-[900px] p-4 border border-[rgba(130,206,255,0.28)] min-h-[clamp(360px,47vh,470px)] bg-[linear-gradient(140deg,rgba(2,7,20,0.95),rgba(8,14,28,0.88)),radial-gradient(circle at 50% 38%,rgba(122,197,255,0.14),transparent 52%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),inset_0_0_48px_rgba(80,190,255,0.2)] max-w-80">
              <div
                className="relative w-full max-w-full min-w-0 box-border overflow-hidden border-2 border-[rgba(130,220,255,0.45)] [aspect-ratio:16/11] min-h-[280px] h-[min(clamp(280px,34vh,360px),100%)] max-h-full m-0 [background:linear-gradient(160deg,rgba(8,15,30,0.98),rgba(11,24,45,0.87))] [box-shadow:inset_0_0_26px_rgba(96,205,255,0.25),inset_0_0_0_2px_rgba(255,255,255,0.06)]"
              >
              <span
                className="pointer-events-none absolute inset-[7px] z-[2] border border-[rgba(255,255,255,0.08)] [box-shadow:inset_0_0_24px_rgba(111,205,255,0.16)]"
              />
              <span
                className="pointer-events-none absolute left-0 right-0 top-[40%] h-px z-[2] opacity-50 [background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)]"
              />
              <div className="absolute left-3 top-2 right-3 h-7 flex justify-between items-center text-[11px] tracking-[0.26em] text-[rgba(194,239,255,0.95)] uppercase z-[3]">
                <span className="text-[11px] tracking-[0.26em] text-[rgba(194,239,255,0.95)] uppercase text-shadow-[0_0_8px_rgba(98,235,255,0.5)]">
                  LUMINA OBSERVATORY
                </span>
                <span className="text-[#b9f1ff]">{observerCreature.nickname}</span>
              </div>
              <div className="absolute left-2.5 right-2.5 top-[2.6rem] bottom-2.5 border border-[rgba(130,220,255,0.25)] bg-[linear-gradient(180deg,rgba(9,19,36,0.9),rgba(7,16,34,0.75))] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] z-[2]">
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
                  className="absolute left-3 right-3 top-3 bottom-3 flex items-center justify-center overflow-hidden z-[2] bg-[linear-gradient(180deg,rgba(2,8,20,0.4),rgba(8,12,22,0.22)),repeating-linear-gradient(90deg,rgba(128,209,255,0.07) 0 1px,transparent 1px 6px)]"
                >
                  <span
                    className="pointer-events-none absolute h-px w-[calc(100%-12px)] bg-[rgba(140,240,255,0.45)] top-[50%] left-[6px] right-[6px] [transform:translateY(-50%)] [animation:observer-scan_4.2s_linear_infinite]"
                  />
                  <span
                    className="pointer-events-none absolute inset-[4px] [background:radial-gradient(circle_at_50%_80%,transparent,rgba(8,26,42,0.34)_58%)] [mix-blend-mode:multiply]"
                  />
                  <span
                    className="pointer-events-none absolute inset-0 [box-shadow:inset_0_0_22px_rgba(9,17,34,0.6),inset_0_-24px_36px_rgba(16,50,98,0.5)]"
                  />
                  <div
                    ref={observerShellRef}
                    className={`relative m-0 mx-auto w-[min(100%,_clamp(190px,_28vw,_320px))] aspect-square h-auto [touch-action:none] [transform-style:preserve-3d] border-[2px] border-[rgba(125,210,255,0.4)] [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.18),0_0_0_1px_rgba(0,0,0,0.6),0_0_30px_rgba(120,205,255,0.3)] [background:linear-gradient(140deg,rgba(8,14,34,0.96),rgba(4,8,18,0.58)),repeating-linear-gradient(0deg,rgba(125,200,255,0.1)_0,rgba(125,200,255,0.1)_2px,transparent_2px,transparent_6px)] [transform:perspective(840px)_rotateX(10deg)_rotateY(-2deg)] ${
                      isDraggingObserver ? "cursor-grabbing" : "cursor-grab"
                    }`}
                    style={{
                      ...observerOrbStyle,
                      cursor: isDraggingObserver ? "grabbing" : "grab",
                    }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={onPointerUp}
                  >
                    <span
                      className="pointer-events-none absolute inset-0 border border-[rgba(255,255,255,0.2)] z-[2] [background:linear-gradient(180deg,rgba(130,216,255,0.09),transparent_38%),radial-gradient(circle_at_50%_50%,rgba(130,220,255,0.14),transparent_60%)] [mix-blend-mode:screen]"
                    />
                    <span
                      className="pointer-events-none absolute inset-0 opacity-[0.48] z-[2] mix-blend-multiply [background:radial-gradient(circle_at_50%_38%,rgba(170,230,255,0.2),transparent_45%),linear-gradient(0deg,rgba(0,0,0,0.22)_50%,transparent_50.6%)]"
                    />
                    <div
                      className="absolute inset-0 mix-blend-screen"
                    >
                      <span
                        className="absolute inset-0 [background:radial-gradient(circle_at_center,rgba(125,200,255,0.28),rgba(13,19,42,0.1)_45%,transparent_55%)] [mix-blend-mode:screen]"
                      />
                      <span
                        className="absolute inset-0 border-[2px] border-[rgba(255,255,255,0.16)] [transform:translateZ(16px)] [transform-style:preserve-3d] [background:linear-gradient(180deg,rgba(18,30,58,0.72),rgba(9,15,36,0.75)),linear-gradient(90deg,transparent_48%,rgba(125,220,255,0.22)_48%,rgba(125,220,255,0.22)_52%,transparent_52%)] [box-shadow:inset_0_0_20px_rgba(125,220,255,0.28),0_0_16px_rgba(125,220,255,0.28)] mix-blend-normal z-[2]"
                      />
                    </div>
                    <div
                      className="absolute left-1/2 top-1/2"
                      style={{
                        ...observerOrbStyle,
                        ...observerStyle,
                        position: "absolute",
                        width: "var(--observer-orb-size)",
                        height: "var(--observer-orb-size)",
                        left: "50%",
                        top: "50%",
                        transformStyle: "preserve-3d",
                        transform: `translate(-50%, -50%) translateZ(0) rotateX(${observerPitch}deg) rotateY(${observerYaw}deg)`,
                      }}
                      key={observerCreature.id}
                    >
                      <span
                        className="pointer-events-none absolute rounded-sm opacity-40 z-[3] inset-[6px] border border-[rgba(255,255,255,0.18)]"
                      />
                      <span
                        className="absolute inset-0 z-10 rounded-none blur-[2px]"
                        style={{
                          background:
                            "radial-gradient(circle, rgba(255,255,255,0.28), transparent 62%)",
                          transform: "translateZ(4px) scale(var(--observer-halo-scale))",
                          opacity: "calc(0.4 * var(--observer-halo-intensity))",
                          animation: "observer-halo var(--observer-ring-a-speed) ease-in-out infinite",
                        }}
                      />
                      <span
                        className="absolute left-1/2 top-1/2 z-20"
                        style={{
                          width: "var(--observer-core-size)",
                          height: "var(--observer-core-size)",
                          borderRadius: "var(--observer-shape)",
                          transform: "translate(-50%, -50%) translateZ(12px) scale(var(--observer-core-scale))",
                          background:
                            `radial-gradient(circle at 35% 35%, color-mix(in srgb, ${luminaCoreColor} 80%, white), ${luminaCoreColor})`,
                          boxShadow:
                            "0 0 0 2px rgba(255, 255, 255, 0.5), 0 0 24px color-mix(in srgb, var(--lumina-core) 72%, transparent), 0 0 40px color-mix(in srgb, var(--lumina-core) 60%, transparent)",
                          animation: "observer-core var(--observer-ring-c-speed) ease-in-out infinite",
                        }}
                      >
                        <span
                          className="absolute left-1/2 top-1/2 h-[calc(100%+20px)] w-0.5"
                          style={{
                            background: "linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.4) 48%, transparent 100%)",
                            transform: "translate(-50%, -50%)",
                          }}
                        />
                        <span
                          className="absolute left-1/2 top-1/2 w-[calc(100%+20px)] h-0.5"
                          style={{
                            background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 52%, transparent 100%)",
                            transform: "translate(-50%, -50%)",
                          }}
                        />
                      </span>
                      <span
                        className="absolute"
                        style={{
                          border: `2px solid color-mix(in srgb, ${luminaCoreColor} 72%, rgba(255, 255, 255, 0.45))`,
                          inset: "var(--observer-ring-a-inset)",
                          transformStyle: "preserve-3d",
                          transform: "translateZ(24px) rotateX(68deg) rotateZ(0deg)",
                          animation: "observer-ring-a var(--observer-ring-a-speed) linear infinite",
                        }}
                      />
                      <span
                        className="absolute"
                        style={{
                          border: `2px solid color-mix(in srgb, ${luminaCoreColor} 72%, rgba(255, 255, 255, 0.45))`,
                          inset: "var(--observer-ring-b-inset)",
                          transformStyle: "preserve-3d",
                          transform: "translateZ(0px) rotateY(52deg) rotateZ(0deg)",
                          animation: "observer-ring-b var(--observer-ring-b-speed) linear infinite reverse",
                        }}
                      />
                      <span
                        className="absolute"
                        style={{
                          border: `2px solid color-mix(in srgb, ${luminaCoreColor} 72%, rgba(255, 255, 255, 0.45))`,
                          inset: "var(--observer-ring-c-inset)",
                          transformStyle: "preserve-3d",
                          transform: "translateZ(16px) rotateX(8deg) rotateZ(38deg)",
                          animation: "observer-ring-c var(--observer-ring-c-speed) linear infinite",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <output
              role="status"
              aria-label={`${observerCreature.nickname} ${observerCreature.commonName} ${emotionLabel}`}
              className="mt-4 mx-auto text-[13px] text-[var(--muted)]"
            >
              {observerCreature.nickname} ({observerCreature.commonName}) |{" "}
              {emotionLabel}
            </output>
          </div>
        </div>
      ) : (
        <output role="status" aria-label={uiText.noObserverTarget} className="mt-2 text-[13px] text-[var(--muted)]">
          {uiText.noObserverTarget}
        </output>
      )}
    </section>
  );
}
