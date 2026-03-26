import type { CSSProperties } from "react";
import type { Creature, InterfaceText } from "../game/engine";
import { Crosshair } from "lucide-react";

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
  const columns = 6;

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
      <div className="grid gap-2 [grid-template-columns:repeat(6,minmax(0,1fr))] max-h-[58vh] overflow-auto pr-1">
        {filteredRoster.length === 0 ? (
          <div className="text-[13px] text-muted">{uiText.rosterEmpty}</div>
        ) : (
          new Array(Math.ceil(rosterSlice.length / columns) * columns)
            .fill(null)
            .map((_, index) => {
              const creature = rosterSlice[index];
              if (!creature) {
                return (
                  <article
                    key={`empty-slot-${index}`}
                    className="w-full aspect-square border-2 border-dashed border-[rgba(130,199,255,0.45)] bg-[rgba(10,18,38,0.42)] p-2.5"
                    aria-hidden="true"
                  />
                );
              }

              const isSelected = creature.id === selectedCreatureId;
              return (
                <article
                  key={creature.id}
                  role="button"
                  tabIndex={0}
                  aria-label={isSelected ? `${uiText.active} ${creature.nickname}` : `${uiText.select} ${creature.nickname}`}
                  className={`w-full aspect-square border-2 border-lineWeak bg-[rgba(10,18,38,0.72)] p-2.5 flex flex-col justify-center gap-2 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8ff5ff] focus-visible:outline-offset-2 ${
                    isSelected
                      ? "outline outline-[3px] outline-[rgba(127,220,255,0.9)] outline-offset-[-3px] shadow-[0_0_18px_rgba(127,220,255,0.45)]"
                      : ""
                  }`}
                  onClick={() => onSelectCreature(creature.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectCreature(creature.id);
                    }
                  }}
                  data-action="roster-select"
                  data-selected={isSelected ? "true" : "false"}
                >
                  <div className="flex items-center flex-col justify-center gap-2">
                    <span
                      className="relative h-9 w-9 shrink-0"
                    >
                      <span
                        className="grid h-9 w-9 place-items-center rounded-full border border-white/60 bg-[var(--mote-color)] shadow-[0_0_10px_rgba(127,220,255,0.28)]"
                        style={
                          {
                            ["--mote-color" as keyof CSSProperties]: `rgb(${creature.rgb.r}, ${creature.rgb.g}, ${creature.rgb.b})`,
                          } as CSSProperties
                        }
                        aria-label={`${creature.nickname} ${creature.commonName} color`}
                        aria-hidden="true"
                      />
                      <span
                        className={`pointer-events-none absolute inset-0 grid place-items-center rounded-full border-2 ${
                          isSelected
                            ? "border-[#8ff5ff]"
                            : "border-[rgba(130,199,255,0.58)]"
                        }`}
                        aria-hidden="true"
                      >
                        <Crosshair
                          className={`h-6 w-6 ${isSelected ? "text-[#b8f8ff]" : "text-[#94bde2]"}`}
                          aria-hidden="true"
                        />
                      </span>
                    </span>
                    <div className="min-w-0 text-center">
                        <div className="min-w-0 text-[12px] text-[#bfe8ff] font-bold leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                          {creature.nickname}
                        </div>
                        <div className="mt-1 min-w-0 text-[11px] tracking-[0.4px] text-[#9ad6ff] whitespace-nowrap overflow-hidden text-ellipsis">
                          {creature.commonName} · M{creature.mutationStage}
                        </div>
                      </div>
                    </div>
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
