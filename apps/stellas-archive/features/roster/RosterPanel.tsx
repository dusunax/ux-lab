import type { InterfaceText } from "../game/engine";

type RosterPanelProps = {
  total: number;
  speciesCount: number;
  activeName: string;
  topSpecies: string[];
  uiText: InterfaceText;
  onOpenRoster: () => void;
};

export function RosterPanel({
  total,
  speciesCount,
  activeName,
  topSpecies,
  uiText,
  onOpenRoster,
}: RosterPanelProps) {
  return (
    <section className="rounded-none border-2 border-primary bg-panel px-4 py-4 shadow-[0_0_30px_rgba(102,240,255,0.15)] relative">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2>{uiText.creatures}</h2>
        <button
          className="border border-[rgba(130,199,255,0.58)] bg-[rgba(11,18,40,0.8)] px-2 py-2 text-[12px] text-[#f2fcff] tracking-[0.3px] hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.28)]"
          onClick={onOpenRoster}
          type="button"
        >
          {uiText.more}
        </button>
      </div>
      <div className="mb-2 grid gap-1.5 p-2.5 border border-[rgba(126,205,255,0.28)] bg-[rgba(8,14,32,0.66)]">
        <output
          role="status"
          aria-label={`${uiText.creatures} ${total}`}
          className="text-[13px] text-muted"
        >
          총 {uiText.creatures}: {total}
        </output>
        <div className="text-[13px] text-muted">총 종류: {speciesCount}</div>
        <div className="text-[13px] text-muted">현재 활성: {activeName}</div>
        <div className="text-[13px] text-muted">주요 종: {topSpecies.join(", ") || uiText.rosterEmpty}</div>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <button
          className="inline-flex items-center justify-center border-2 border-[rgba(130,199,255,0.8)] bg-[linear-gradient(180deg,rgba(43,84,151,0.72),rgba(17,29,64,0.82))] text-[#f6fdff] min-h-10 px-2.5 py-2 tracking-[0.4px] hover:border-[rgba(130,245,255,1)] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)]"
          aria-label={uiText.select}
          onClick={onOpenRoster}
          type="button"
        >
          {uiText.select}
        </button>
      </div>
    </section>
  );
}
