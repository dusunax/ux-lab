import type { Creature, Interaction, InterfaceText, ActionText, Locale } from "../game/engine";
import { barWidth, getDominantEmotionLabel, TOKEN_COST } from "../game/engine";
import { Apple, Droplets, Scan, Sparkles } from "lucide-react";

type ActiveCreaturePanelProps = {
  selectedCreature: Creature | null;
  uiText: InterfaceText;
  actionText: ActionText;
  token: number;
  locale: Locale;
  performAction: (interaction: Interaction, creature: Creature) => void;
  onOpenRoster: () => void;
  onOpenCreatureDetails: () => void;
  showActions?: boolean;
  highlightActions?: Interaction[];
};

function StatBarFill({
  width,
  className,
}: {
  width: string;
  className: string;
}) {
  return <div className={`h-full border-r-[2px] border-[rgba(255,255,255,0.4)] ${className}`} style={{ width }} />;
}

export function ActiveCreaturePanel({
  selectedCreature,
  uiText,
  actionText,
  token,
  locale,
  performAction,
  onOpenRoster,
  onOpenCreatureDetails,
  showActions = true,
  highlightActions = [],
}: ActiveCreaturePanelProps) {
  const buttonClass = (action: "feed" | "clean" | "play" | "scan") =>
    `inline-flex items-center justify-center gap-2 whitespace-nowrap border-2 border-[rgba(130,199,255,0.8)] bg-[linear-gradient(180deg,rgba(43,84,151,0.72),rgba(17,29,64,0.82))] px-2 py-2 text-[13px] text-[#f6fdff] min-h-10 tracking-[0.4px] hover:border-[rgba(130,245,255,1)] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)] disabled:opacity-45 disabled:cursor-not-allowed ${
      highlightActions.includes(action) ? "border-[rgba(255,230,120,0.9)] shadow-[0_0_14px_rgba(255,231,132,0.36)]" : ""
    }`;

  return (
    <section className="rounded-none border-2 border-[var(--line)] bg-[var(--card)] px-4 py-4 shadow-[var(--shadow)]">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <h2>{uiText.active}</h2>
        <button
          className="border border-[rgba(130,199,255,0.58)] bg-[rgba(11,18,40,0.8)] px-2 py-2 text-[12px] text-[#f2fcff] tracking-[0.3px] hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.28)]"
          onClick={onOpenCreatureDetails}
          type="button"
        >
          {uiText.creatureDetails}
        </button>
      </div>
      {selectedCreature && (
        <article className="w-full border border-[var(--line-weak)] bg-[rgba(10,18,38,0.72)] p-3 relative">
          <div className="flex justify-between items-center gap-2">
            <div>
              <div className="text-[13px] text-[#bfe8ff] font-semibold">{uiText.active} Lumina</div>
              <div className="text-[13px] tracking-[0.8px] text-white">{selectedCreature.nickname}</div>
            </div>
            <button
              className="border border-[rgba(130,199,255,0.8)] px-2 py-2 text-[#f6fdff] bg-[linear-gradient(180deg,rgba(43,84,151,0.72),rgba(17,29,64,0.82))] min-h-10 hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)]"
              onClick={onOpenRoster}
              type="button"
            >
              {uiText.select}
            </button>
          </div>
          <p className="mt-1 mb-0 text-[13px] text-[var(--muted)]">
            {selectedCreature.commonName} · {getDominantEmotionLabel(locale, selectedCreature.emotion)}
          </p>
          <div className="mt-2.5 grid gap-2">
            <div className="grid gap-1">
              <span className="text-[13px] text-[#def1ff]">
                {uiText.hunger} {Math.round(selectedCreature.state.hunger)}
              </span>
              <div className="h-[10px] border border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.12)] overflow-hidden">
                <StatBarFill width={barWidth(selectedCreature.state.hunger, 100)} className="bg-[#ff7b7b]" />
              </div>
            </div>
            <div className="grid gap-1">
              <span className="text-[13px] text-[#def1ff]">
                {uiText.cleanliness} {Math.round(selectedCreature.state.cleanliness)}
              </span>
              <div className="h-[10px] border border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.12)] overflow-hidden">
                <StatBarFill width={barWidth(selectedCreature.state.cleanliness, 100)} className="bg-[#79e98c]" />
              </div>
            </div>
            <div className="grid gap-1">
              <span className="text-[13px] text-[#def1ff]">
                {uiText.affection} {Math.round(selectedCreature.state.affection)}
              </span>
              <div className="h-[10px] border border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.12)] overflow-hidden">
                <StatBarFill width={barWidth(selectedCreature.state.affection, 100)} className="bg-[#ffd78a]" />
              </div>
            </div>
          </div>
          <div className="mt-2 grid gap-1.5">
            <div className="flex items-center gap-2">
              <span className="w-6 text-right text-[12px] text-[var(--muted)]">R</span>
              <div className="flex-1 h-[10px] border border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.12)] overflow-hidden">
                <StatBarFill width={barWidth(selectedCreature.rgb.r, 255)} className="bg-[#ff7b7b]" />
              </div>
              <span className="w-10 text-right text-[13px] text-white">{selectedCreature.rgb.r}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 text-right text-[12px] text-[var(--muted)]">G</span>
              <div className="flex-1 h-[10px] border border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.12)] overflow-hidden">
                <StatBarFill width={barWidth(selectedCreature.rgb.g, 255)} className="bg-[#79e98c]" />
              </div>
              <span className="w-10 text-right text-[13px] text-white">{selectedCreature.rgb.g}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 text-right text-[12px] text-[var(--muted)]">B</span>
              <div className="flex-1 h-[10px] border border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.12)] overflow-hidden">
                <StatBarFill width={barWidth(selectedCreature.rgb.b, 255)} className="bg-[#6cb8ff]" />
              </div>
              <span className="w-10 text-right text-[13px] text-white">{selectedCreature.rgb.b}</span>
            </div>
          </div>
          {showActions ? (
            <div className="grid grid-cols-4 gap-2 mt-2">
              <button
                className={buttonClass("feed")}
                disabled={token < TOKEN_COST.feed}
                aria-label={`${actionText.feed} (${TOKEN_COST.feed})`}
                onClick={() => performAction("feed", selectedCreature)}
                data-action="feed"
                type="button"
              >
                <Apple className="h-[18px] w-[18px]" aria-hidden="true" />
                {actionText.feed} ({TOKEN_COST.feed})
              </button>
              <button
                className={buttonClass("clean")}
                disabled={token < TOKEN_COST.clean}
                aria-label={`${actionText.clean} (${TOKEN_COST.clean})`}
                onClick={() => performAction("clean", selectedCreature)}
                data-action="clean"
                type="button"
              >
                <Droplets className="h-[18px] w-[18px]" aria-hidden="true" />
                {actionText.clean} ({TOKEN_COST.clean})
              </button>
              <button
                className={buttonClass("play")}
                disabled={token < TOKEN_COST.play}
                aria-label={`${actionText.play} (${TOKEN_COST.play})`}
                onClick={() => performAction("play", selectedCreature)}
                data-action="play"
                type="button"
              >
                <Sparkles className="h-[18px] w-[18px]" aria-hidden="true" />
                {actionText.play} ({TOKEN_COST.play})
              </button>
              <button
                className={buttonClass("scan")}
                disabled={token < TOKEN_COST.scan}
                aria-label={`${actionText.scan} (${TOKEN_COST.scan})`}
                onClick={() => performAction("scan", selectedCreature)}
                data-action="scan"
                type="button"
              >
                <Scan className="h-[18px] w-[18px]" aria-hidden="true" />
                {actionText.scan} ({TOKEN_COST.scan})
              </button>
            </div>
          ) : null}
        </article>
      )}
      {!selectedCreature ? (
        <output role="status" aria-label={uiText.creatureNotFound} className="text-[13px] text-[var(--muted)]">
          {uiText.creatureNotFound}
        </output>
      ) : null}
    </section>
  );
}
