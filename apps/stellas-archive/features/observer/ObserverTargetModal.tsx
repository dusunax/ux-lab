import type { CSSProperties } from "react";
import type { Creature, InterfaceText } from "../game/engine";

type ObserverTargetModalProps = {
  uiText: InterfaceText;
  creatures: Creature[];
  isObserverAutoTarget: boolean;
  observerTargetId: string | null;
  onAuto: () => void;
  onSelect: (id: string) => void;
};

export function ObserverTargetModal({
  uiText,
  creatures,
  isObserverAutoTarget,
  observerTargetId,
  onAuto,
  onSelect,
}: ObserverTargetModalProps) {
  return (
    <div className="grid gap-2 max-h-[58vh] overflow-auto pr-1">
      <div className="text-[13px] text-[var(--muted)]">{uiText.observerDescription}</div>
      <button
        className={`rounded-none border border-[rgba(130,199,255,0.9)] px-2 py-2 text-[12px] text-left tracking-[0.2px] min-h-[30px] ${
          isObserverAutoTarget
            ? "bg-[rgba(45,93,170,0.7)] border-[rgba(143,245,255,1)] text-[#ffffff] font-semibold shadow-[0_0_12px_rgba(127,232,255,0.3)]"
            : "bg-[rgba(8,14,30,0.72)] hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.24)]"
        } text-[#eaf6ff]`}
        aria-label={uiText.observerAuto}
        aria-pressed={isObserverAutoTarget}
        onClick={onAuto}
        type="button"
      >
        {uiText.observerAuto}
      </button>
      {creatures.map((creature) => (
        <article
          key={creature.id}
          className={`rounded-none border ${
            !isObserverAutoTarget && observerTargetId === creature.id ? "border-[rgba(143,245,255,1)] shadow-[0_0_10px_rgba(127,220,255,0.28)]" : "border-transparent"
          }`}
        >
          <button
            className={`w-full flex items-center gap-2 rounded-none border px-2 py-2 text-left text-[13px] leading-tight ${
              !isObserverAutoTarget && observerTargetId === creature.id
                ? "border-[rgba(143,245,255,1)] bg-[rgba(45,93,170,0.72)] text-[#ffffff] font-semibold shadow-[0_0_12px_rgba(127,232,255,0.3)]"
                : "border-[rgba(130,199,255,0.32)] bg-[rgba(8,14,32,0.85)] text-[#f2fcff] hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.2)]"
            }`}
            aria-label={`${creature.nickname} ${creature.commonName}`}
            aria-pressed={!isObserverAutoTarget && observerTargetId === creature.id}
            onClick={() => onSelect(creature.id)}
            type="button"
          >
            <span
              className="inline-block h-9 w-9 shrink-0 rounded border border-white/60 bg-[var(--mote-color)] shadow-[0_0_10px_rgba(127,220,255,0.28)]"
              style={{ ["--mote-color" as keyof CSSProperties]: `rgb(${creature.rgb.r}, ${creature.rgb.g}, ${creature.rgb.b})` } as CSSProperties}
              aria-label={`${creature.nickname} ${creature.commonName} color`}
              aria-hidden="true"
            />
            <span>{creature.nickname}</span>
            <span>({creature.commonName})</span>
          </button>
        </article>
      ))}
    </div>
  );
}
