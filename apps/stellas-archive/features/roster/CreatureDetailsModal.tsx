import type { ActionText, Creature, InterfaceText, Locale, Interaction } from "../game/engine";
import { barWidth, getDominantEmotionLabel, SPECIES, TOKEN_COST } from "../game/engine";

function StatBarFill({ width, className }: { width: string; className: string }) {
  return <div className={`h-full border-r-[2px] border-[rgba(255,255,255,0.4)] ${className}`} style={{ width }} />;
}

type CreatureDetailsModalProps = {
  creature: Creature | null;
  uiText: InterfaceText;
  actionText: ActionText;
  locale: Locale;
  token: number;
  onAction: (interaction: Interaction, creature: Creature) => void;
  onSetObserverTarget: (creature: Creature) => void;
};

export function CreatureDetailsModal({
  creature,
  uiText,
  actionText,
  locale,
  token,
  onAction,
  onSetObserverTarget,
}: CreatureDetailsModalProps) {
  if (!creature) {
    return (
      <output role="status" aria-label={uiText.creatureNotFound} className="text-[13px] text-[var(--muted)]">
        {uiText.creatureNotFound}
      </output>
    );
  }

  return (
    <article className="w-full border border-[var(--line-weak)] bg-[rgba(10,18,38,0.72)] p-3">
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
        {uiText.emotion}: <strong>{getDominantEmotionLabel(locale, creature.emotion)}</strong> / {uiText.traits}:{" "}
        {creature.traits.join(", ")}
      </p>
      <div className="mt-2.5 grid gap-2.5">
        <div>
          <div className="flex justify-between text-[13px] text-[#d7dcf8]">
            <span>
              {uiText.hunger} {Math.round(creature.state.hunger)}
            </span>
            <span>
              {creature.state.hunger > 79 ? uiText.high : creature.state.hunger > 39 ? uiText.normal : uiText.low}
            </span>
          </div>
          <div className="mt-1.5 h-[10px] border border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.12)] overflow-hidden">
            <StatBarFill width={barWidth(creature.state.hunger, 100)} className="bg-[#ff7b7b]" />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[13px] text-[#d7dcf8]">
            <span>
              {uiText.cleanliness} {Math.round(creature.state.cleanliness)}
            </span>
            <span>
              {creature.state.cleanliness > 79
              ? uiText.stable
              : creature.state.cleanliness > 39
                ? uiText.normal
                : uiText.unstable}
            </span>
          </div>
          <div className="mt-1.5 h-[10px] border border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.12)] overflow-hidden">
            <StatBarFill width={barWidth(creature.state.cleanliness, 100)} className="bg-[#96f7bf]" />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[13px] text-[#d7dcf8]">
            <span>
              {uiText.affection} {Math.round(creature.state.affection)}
            </span>
            <span>{creature.state.affection > 79 ? uiText.bonded : uiText.friendly}</span>
          </div>
          <div className="mt-1.5 h-[10px] border border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.12)] overflow-hidden">
            <StatBarFill width={barWidth(creature.state.affection, 100)} className="bg-[#f8b4d9]" />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[13px] text-[#d7dcf8]">
            <span>
              {uiText.energy} {Math.round(creature.state.energy)}
            </span>
            <span>{creature.state.energy > 79 ? uiText.high : uiText.low}</span>
          </div>
          <div className="mt-1.5 h-[10px] border border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.12)] overflow-hidden">
            <StatBarFill width={barWidth(creature.state.energy, 100)} className="bg-[#ffd78a]" />
          </div>
        </div>
      </div>
      <div className="mt-2 grid gap-1.5">
        <div className="flex items-center gap-2">
          <span className="w-6 text-right text-[12px] text-[var(--muted)]">R</span>
          <div className="flex-1 h-[10px] border border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.12)] overflow-hidden">
            <StatBarFill width={barWidth(creature.rgb.r, 255)} className="bg-[#ff7b7b]" />
          </div>
          <span className="w-10 text-right text-[13px] text-white">{creature.rgb.r}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 text-right text-[12px] text-[var(--muted)]">G</span>
          <div className="flex-1 h-[10px] border border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.12)] overflow-hidden">
            <StatBarFill width={barWidth(creature.rgb.g, 255)} className="bg-[#79e98c]" />
          </div>
          <span className="w-10 text-right text-[13px] text-white">{creature.rgb.g}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 text-right text-[12px] text-[var(--muted)]">B</span>
          <div className="flex-1 h-[10px] border border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.12)] overflow-hidden">
            <StatBarFill width={barWidth(creature.rgb.b, 255)} className="bg-[#6cb8ff]" />
          </div>
          <span className="w-10 text-right text-[13px] text-white">{creature.rgb.b}</span>
        </div>
      </div>
      <div className="mt-2.5 text-[13px] text-[#e8d5f8]">
        <span className="text-[11px] text-[#95f7de] tracking-[0.3px]">
          {uiText.mutationStage}: {creature.mutationStage}
        </span>
        <br />
        {SPECIES[creature.speciesId]?.description?.[locale]}
      </div>
      <div className="mt-2.5 grid gap-2">
        <button
          className="inline-flex items-center justify-center border-2 border-[rgba(130,199,255,0.8)] bg-[linear-gradient(180deg,rgba(43,84,151,0.72),rgba(17,29,64,0.82))] px-2.5 py-2 text-[#f6fdff] text-[13px] whitespace-nowrap min-h-10 tracking-[0.4px] hover:border-[rgba(130,245,255,1)] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)] disabled:opacity-45 disabled:cursor-not-allowed"
          aria-label={`${actionText.feed} (${TOKEN_COST.feed})`}
          disabled={token < TOKEN_COST.feed}
          onClick={() => onAction("feed", creature)}
          type="button"
        >
          {actionText.feed} ({TOKEN_COST.feed})
        </button>
        <button
          className="inline-flex items-center justify-center border-2 border-[rgba(130,199,255,0.8)] bg-[linear-gradient(180deg,rgba(43,84,151,0.72),rgba(17,29,64,0.82))] px-2.5 py-2 text-[#f6fdff] text-[13px] whitespace-nowrap min-h-10 tracking-[0.4px] hover:border-[rgba(130,245,255,1)] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)] disabled:opacity-45 disabled:cursor-not-allowed"
          aria-label={`${actionText.clean} (${TOKEN_COST.clean})`}
          disabled={token < TOKEN_COST.clean}
          onClick={() => onAction("clean", creature)}
          type="button"
        >
          {actionText.clean} ({TOKEN_COST.clean})
        </button>
        <button
          className="inline-flex items-center justify-center border-2 border-[rgba(130,199,255,0.8)] bg-[linear-gradient(180deg,rgba(43,84,151,0.72),rgba(17,29,64,0.82))] px-2.5 py-2 text-[#f6fdff] text-[13px] whitespace-nowrap min-h-10 tracking-[0.4px] hover:border-[rgba(130,245,255,1)] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)] disabled:opacity-45 disabled:cursor-not-allowed"
          aria-label={`${actionText.play} (${TOKEN_COST.play})`}
          disabled={token < TOKEN_COST.play}
          onClick={() => onAction("play", creature)}
          type="button"
        >
          {actionText.play} ({TOKEN_COST.play})
        </button>
        <button
          className="inline-flex items-center justify-center border-2 border-[rgba(130,199,255,0.8)] bg-[linear-gradient(180deg,rgba(43,84,151,0.72),rgba(17,29,64,0.82))] px-2.5 py-2 text-[#f6fdff] text-[13px] whitespace-nowrap min-h-10 tracking-[0.4px] hover:border-[rgba(130,245,255,1)] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)] disabled:opacity-45 disabled:cursor-not-allowed"
          aria-label={`${actionText.scan} (${TOKEN_COST.scan})`}
          disabled={token < TOKEN_COST.scan}
          onClick={() => onAction("scan", creature)}
          type="button"
        >
          {actionText.scan} ({TOKEN_COST.scan})
        </button>
        <button
          className="inline-flex items-center justify-center border-2 border-[rgba(130,199,255,0.8)] bg-[linear-gradient(180deg,rgba(43,84,151,0.72),rgba(17,29,64,0.82))] px-2.5 py-2 text-[#f6fdff] text-[13px] whitespace-nowrap min-h-10 tracking-[0.4px] hover:border-[rgba(130,245,255,1)] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)] disabled:opacity-45 disabled:cursor-not-allowed"
          aria-label={`${actionText.decorate} (${TOKEN_COST.decorate})`}
          disabled={token < TOKEN_COST.decorate}
          onClick={() => onAction("decorate", creature)}
          type="button"
        >
          {actionText.decorate} ({TOKEN_COST.decorate})
        </button>
      </div>
    </article>
  );
}
