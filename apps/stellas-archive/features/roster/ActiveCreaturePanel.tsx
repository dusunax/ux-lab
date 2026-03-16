import type { Creature, Interaction, InterfaceText, ActionText } from "../game/engine";
import { getDominantEmotionLabel, TOKEN_COST } from "../game/engine";
import { Apple, Droplets, Scan, Sparkles } from "lucide-react";
import { MetricRing } from "../ui/MetricRing";
import { ColorProfile } from "../ui/ColorProfile";

function getMetricTone(value: number, uiText: InterfaceText) {
  if (value >= 70) return uiText.high;
  if (value >= 35) return uiText.normal;
  return uiText.low;
}

function getMetricColor(value: number) {
  if (value >= 70) return "#85ff9e";
  if (value >= 35) return "#ffd57a";
  return "#ff7b7b";
}

type ActiveCreaturePanelProps = {
  selectedCreature: Creature | null;
  uiText: InterfaceText;
  actionText: ActionText;
  token: number;
  performAction: (interaction: Interaction, creature: Creature) => void;
  onOpenRoster: () => void;
  onOpenCreatureDetails: () => void;
  showActions?: boolean;
  highlightActions?: Interaction[];
};

export function ActiveCreaturePanel({
  selectedCreature,
  uiText,
  actionText,
  token,
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
        {selectedCreature.commonName} · {getDominantEmotionLabel(selectedCreature.emotion)}
      </p>
      <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-4">
        <MetricRing
          label={uiText.hunger}
          value={selectedCreature.state.hunger}
          color={getMetricColor(selectedCreature.state.hunger)}
          trackColor="rgba(255,255,255,0.25)"
          stateLabel={getMetricTone(selectedCreature.state.hunger, uiText)}
        />
        <MetricRing
          label={uiText.cleanliness}
          value={selectedCreature.state.cleanliness}
          color={getMetricColor(selectedCreature.state.cleanliness)}
          trackColor="rgba(255,255,255,0.25)"
          stateLabel={getMetricTone(selectedCreature.state.cleanliness, uiText)}
        />
        <MetricRing
          label={uiText.affection}
          value={selectedCreature.state.affection}
          color={getMetricColor(selectedCreature.state.affection)}
          trackColor="rgba(255,255,255,0.25)"
          stateLabel={getMetricTone(selectedCreature.state.affection, uiText)}
        />
        <MetricRing
          label={uiText.energy}
          value={selectedCreature.state.energy}
          color="#87bfff"
          trackColor="rgba(255,255,255,0.25)"
          stateLabel={getMetricTone(selectedCreature.state.energy, uiText)}
        />
      </div>
          <ColorProfile rgb={selectedCreature.rgb} title="RGB Profile" />
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
                disabled={selectedCreature.state.energy <= 0 || token < TOKEN_COST.clean}
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
                disabled={selectedCreature.state.energy <= 0 || token < TOKEN_COST.play}
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
                disabled={selectedCreature.state.energy <= 0 || token < TOKEN_COST.scan}
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
