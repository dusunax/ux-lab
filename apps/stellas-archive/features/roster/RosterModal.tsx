import type { CSSProperties } from "react";
import type { Creature, InterfaceText } from "../game/engine";
import { SPECIES, getDominantEmotionLabel } from "../game/engine";

type RosterModalProps = {
  uiText: InterfaceText;
  selectedCreatureId: string;
  rosterSpeciesTabs: Array<{ id: string; label: string; count: number }>;
  rosterFilter: string;
  filteredRoster: Creature[];
  rosterSlice: Creature[];
  rosterPageCount: number;
  safeRosterPage: number;
  onChangeFilter: (filter: string) => void;
  onSelectCreature: (id: string) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function RosterModal({
  uiText,
  selectedCreatureId,
  rosterSpeciesTabs,
  rosterFilter,
  filteredRoster,
  rosterSlice,
  rosterPageCount,
  safeRosterPage,
  onChangeFilter,
  onSelectCreature,
  onPrevPage,
  onNextPage,
}: RosterModalProps) {
  return (
    <>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {rosterSpeciesTabs.map((tab) => (
          <button
            key={tab.id}
            className={`rounded-none border border-[rgba(130,199,255,0.9)] px-2 py-2 text-[12px] tracking-[0.2px] min-h-[30px] text-[#eaf6ff] bg-[rgba(8,14,30,0.72)] ${
              rosterFilter === tab.id
                ? "bg-[rgba(45,93,170,0.7)] border-[rgba(143,245,255,1)]"
                : "hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.24)]"
            }`}
            aria-label={`Creature filter ${tab.label}`}
            onClick={() => onChangeFilter(tab.id)}
            type="button"
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>
      <div className="grid gap-2 max-h-[58vh] overflow-auto pr-1">
        {filteredRoster.length === 0 ? (
          <div className="text-[13px] text-muted">{uiText.rosterEmpty}</div>
        ) : (
          rosterSlice.map((creature) => {
            const isSelected = creature.id === selectedCreatureId;
            return (
              <article
                key={creature.id}
                className={`w-full border-2 border-lineWeak p-3 bg-[rgba(10,18,38,0.72)] ${
                  isSelected
                    ? "outline outline-[3px] outline-[rgba(127,220,255,0.9)] outline-offset-[-3px] shadow-[0_0_18px_rgba(127,220,255,0.45)]"
                    : ""
                }`}
              >
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-9 w-9 shrink-0 rounded border border-white/60 bg-[var(--mote-color)] shadow-[0_0_10px_rgba(127,220,255,0.28)]"
                      style={
                        {
                          ["--mote-color" as keyof CSSProperties]: `rgb(${creature.rgb.r}, ${creature.rgb.g}, ${creature.rgb.b})`,
                        } as CSSProperties
                      }
                      aria-label={`${creature.nickname} ${creature.commonName} color`}
                      aria-hidden="true"
                    />
                    <div>
                    <div className="text-[13px] text-[#bfe8ff] font-bold">
                      {creature.commonName} ({SPECIES[creature.speciesId || ""]?.rarity ?? "common"})
                    </div>
                    <div className="text-[13px] tracking-[0.8px] text-white">{creature.nickname}</div>
                    </div>
                  </div>
                  <button
                    className="border border-[rgba(130,199,255,0.8)] px-2 py-2 text-[#f6fdff] bg-[linear-gradient(180deg,rgba(43,84,151,0.72),rgba(17,29,64,0.82))] min-h-10 hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)]"
                    aria-label={isSelected ? `${uiText.active} ${creature.nickname}` : `${uiText.select} ${creature.nickname}`}
                    onClick={() => onSelectCreature(creature.id)}
                    type="button"
                  >
                    {isSelected ? uiText.active : uiText.select}
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-[#95f7de] tracking-[0.3px]">
                  {uiText.emotion}: <strong>{getDominantEmotionLabel(creature.emotion)}</strong> / {uiText.traits}:{" "}
                  {creature.traits.join(", ")}
                </p>
                <p className="mt-1 text-[12px] text-muted">
                  R{creature.rgb.r} / G{creature.rgb.g} / B{creature.rgb.b} / {uiText.mutationStage}{" "}
                  {creature.mutationStage}
                </p>
              </article>
            );
          })
        )}
      </div>
      <div className="mt-2 flex items-center justify-center gap-2.5">
        <button
          className="min-w-[42px] border border-[rgba(128,209,255,0.45)] bg-[rgba(5,10,22,0.9)] text-[#f6fdff] px-3 py-1.5 hover:border-[#7febbff] hover:shadow-[0_0_12px_rgba(127,232,255,0.3)] disabled:opacity-45"
          aria-label="Previous roster page"
          onClick={onPrevPage}
          disabled={safeRosterPage <= 0}
          type="button"
        >
          ◀
        </button>
        <span className="text-[13px] text-muted">
          {safeRosterPage + 1} / {rosterPageCount}
        </span>
        <button
          className="min-w-[42px] border border-[rgba(128,209,255,0.45)] bg-[rgba(5,10,22,0.9)] text-[#f6fdff] px-3 py-1.5 hover:border-[#7febbff] hover:shadow-[0_0_12px_rgba(127,232,255,0.3)] disabled:opacity-45"
          aria-label="Next roster page"
          onClick={onNextPage}
          disabled={safeRosterPage >= rosterPageCount - 1}
          type="button"
        >
          ▶
        </button>
      </div>
    </>
  );
}
