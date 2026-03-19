import type { ActionText, Creature, InterfaceText, Interaction } from "../game/engine";
import { getDominantEmotionLabel, TOKEN_COST } from "../game/engine";
import { MetricRing } from "../ui/MetricRing";
import { ColorProfile } from "../ui/ColorProfile";
import { Apple, Droplets, Scan, Sparkles, Brush } from "lucide-react";

type SpeciesTextMap = Record<string, { description: string }>;

type CreatureDetailsModalProps = {
  creature: Creature | null;
  uiText: InterfaceText;
  actionText: ActionText;
  token: number;
  speciesText: SpeciesTextMap;
  onAction: (interaction: Interaction, creature: Creature) => void;
  onSetObserverTarget: (creature: Creature) => void;
};

function getColorByMetric(value: number) {
  if (value >= 70) return "#85ff9e";
  if (value >= 35) return "#ffd57a";
  return "#ff7b7b";
}

function getMetricTone(value: number, uiText: InterfaceText) {
  if (value >= 70) return uiText.high;
  if (value >= 35) return uiText.normal;
  return uiText.low;
}

export function CreatureDetailsModal({
  creature,
  uiText,
  actionText,
  token,
  speciesText,
  onAction,
  onSetObserverTarget,
}: CreatureDetailsModalProps) {
  if (!creature) {
    return (
      <output role="status" aria-label={uiText.creatureNotFound} className="text-[13px] text-muted">
        {uiText.creatureNotFound}
      </output>
    );
  }

  return (
    <article className="w-full border border-lineWeak bg-[rgba(10,18,38,0.72)] p-3">
      <div className="flex justify-between items-center gap-2">
        <div>
          <div className="text-[13px] text-[#bfe8ff] font-semibold">{creature.commonName}</div>
          <div className="text-[13px] tracking-[0.8px] text-white">{creature.nickname}</div>
        </div>
        <button
          className="border border-[rgba(130,199,255,0.8)] px-2 py-2 text-[#f6fdff] bg-[linear-gradient(180deg,rgba(43,84,151,0.72),rgba(17,29,64,0.82))] min-h-10 hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)]"
          aria-label={`${uiText.select} ${creature.nickname}`}
          onClick={() => onSetObserverTarget(creature)}
          type="button"
        >
          {uiText.select}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-[#95f7de] tracking-[0.3px]">
        {uiText.emotion}: <strong>{getDominantEmotionLabel(creature.emotion)}</strong> / {uiText.traits}:{" "}
        {creature.traits.join(", ")}
      </p>
      <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-4">
        <MetricRing
          label={uiText.hunger}
          value={creature.state.hunger}
          color={getColorByMetric(creature.state.hunger)}
          trackColor="rgba(255,255,255,0.25)"
          stateLabel={getMetricTone(creature.state.hunger, uiText)}
        />
        <MetricRing
          label={uiText.cleanliness}
          value={creature.state.cleanliness}
          color={getColorByMetric(creature.state.cleanliness)}
          trackColor="rgba(255,255,255,0.25)"
          stateLabel={getMetricTone(creature.state.cleanliness, uiText)}
        />
        <MetricRing
          label={uiText.affection}
          value={creature.state.affection}
          color={getColorByMetric(creature.state.affection)}
          trackColor="rgba(255,255,255,0.25)"
          stateLabel={getMetricTone(creature.state.affection, uiText)}
        />
        <MetricRing
          label={uiText.energy}
          value={creature.state.energy}
          color="#87bfff"
          trackColor="rgba(255,255,255,0.25)"
          stateLabel={getMetricTone(creature.state.energy, uiText)}
        />
      </div>
      <ColorProfile rgb={creature.rgb} />
      <div className="mt-2.5 text-[13px] text-[#e8d5f8]">
        <span className="text-[11px] text-[#95f7de] tracking-[0.3px]">
          {uiText.mutationStage}: {creature.mutationStage}
        </span>
        <br />
        {speciesText[creature.speciesId || ""]?.description}
      </div>
      <div className="mt-2.5 grid grid-cols-4 gap-2">
        <button
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap border-2 border-[rgba(130,199,255,0.8)] bg-[linear-gradient(180deg,rgba(43,84,151,0.72),rgba(17,29,64,0.82))] px-2 py-2 text-[13px] text-[#f6fdff] min-h-10 tracking-[0.4px] hover:border-[rgba(130,245,255,1)] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)] disabled:opacity-45 disabled:cursor-not-allowed"
          aria-label={`${actionText.feed} (${TOKEN_COST.feed})`}
          disabled={token < TOKEN_COST.feed}
          onClick={() => onAction("feed", creature)}
          type="button"
        >
          <Apple className="h-[18px] w-[18px]" aria-hidden="true" />
          {actionText.feed} ({TOKEN_COST.feed})
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap border-2 border-[rgba(130,199,255,0.8)] bg-[linear-gradient(180deg,rgba(43,84,151,0.72),rgba(17,29,64,0.82))] px-2 py-2 text-[13px] text-[#f6fdff] min-h-10 tracking-[0.4px] hover:border-[rgba(130,245,255,1)] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)] disabled:opacity-45 disabled:cursor-not-allowed"
          aria-label={`${actionText.clean} (${TOKEN_COST.clean})`}
          disabled={creature.state.energy <= 0 || token < TOKEN_COST.clean}
          onClick={() => onAction("clean", creature)}
          type="button"
        >
          <Droplets className="h-[18px] w-[18px]" aria-hidden="true" />
          {actionText.clean} ({TOKEN_COST.clean})
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap border-2 border-[rgba(130,199,255,0.8)] bg-[linear-gradient(180deg,rgba(43,84,151,0.72),rgba(17,29,64,0.82))] px-2 py-2 text-[13px] text-[#f6fdff] min-h-10 tracking-[0.4px] hover:border-[rgba(130,245,255,1)] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)] disabled:opacity-45 disabled:cursor-not-allowed"
          aria-label={`${actionText.play} (${TOKEN_COST.play})`}
          disabled={creature.state.energy <= 0 || token < TOKEN_COST.play}
          onClick={() => onAction("play", creature)}
          type="button"
        >
          <Sparkles className="h-[18px] w-[18px]" aria-hidden="true" />
          {actionText.play} ({TOKEN_COST.play})
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap border-2 border-[rgba(130,199,255,0.8)] bg-[linear-gradient(180deg,rgba(43,84,151,0.72),rgba(17,29,64,0.82))] px-2 py-2 text-[13px] text-[#f6fdff] min-h-10 tracking-[0.4px] hover:border-[rgba(130,245,255,1)] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)] disabled:opacity-45 disabled:cursor-not-allowed"
          aria-label={`${actionText.scan} (${TOKEN_COST.scan})`}
          disabled={creature.state.energy <= 0 || token < TOKEN_COST.scan}
          onClick={() => onAction("scan", creature)}
          type="button"
        >
          <Scan className="h-[18px] w-[18px]" aria-hidden="true" />
          {actionText.scan} ({TOKEN_COST.scan})
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap border-2 border-[rgba(130,199,255,0.8)] bg-[linear-gradient(180deg,rgba(43,84,151,0.72),rgba(17,29,64,0.82))] px-2 py-2 text-[13px] text-[#f6fdff] min-h-10 tracking-[0.4px] hover:border-[rgba(130,245,255,1)] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)] disabled:opacity-45 disabled:cursor-not-allowed"
          aria-label={`${actionText.decorate} (${TOKEN_COST.decorate})`}
          disabled={creature.state.energy <= 0 || token < TOKEN_COST.decorate}
          onClick={() => onAction("decorate", creature)}
          type="button"
        >
          <Brush className="h-[18px] w-[18px]" aria-hidden="true" />
          {actionText.decorate} ({TOKEN_COST.decorate})
        </button>
      </div>
    </article>
  );
}
