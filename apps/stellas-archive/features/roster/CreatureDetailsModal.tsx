import { useMemo, useState } from "react";
import type {
  ActionText,
  Creature,
  FeedInventory,
  FeedItem,
  InterfaceText,
  Interaction,
} from "../game/engine";
import { getDominantEmotionLabel, TOKEN_COST } from "../game/engine";
import { MetricRing } from "../ui/MetricRing";
import { ColorProfile } from "../ui/ColorProfile";
import { Apple, CircleHelp, Droplets, Scan, Sparkles } from "lucide-react";
import { ModalShell } from "../ui/ModalShell";
import { getActiveLocale } from "../i18n/i18n";

type SpeciesTextMap = Record<string, { description: string }>;

type FeedOption = {
  id: string;
  name: string;
  symbolColor?: string;
  stock: number;
  description?: string;
  stateDelta?: {
    hunger?: number;
    cleanliness?: number;
    affection?: number;
    energy?: number;
  };
  rgbDelta?: {
    r?: number;
    g?: number;
    b?: number;
  };
};

type CreatureDetailsModalProps = {
  creature: Creature | null;
  uiText: InterfaceText;
  actionText: ActionText;
  token: number;
  feeds: Record<string, FeedItem>;
  feedInventory: FeedInventory;
  speciesText: SpeciesTextMap;
  onAction: (interaction: Interaction, creature: Creature, feedItemId?: string) => void;
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

function formatSignedValue(value: number) {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function buildStateDeltaRows(option: FeedOption, uiText: InterfaceText) {
  const rows = [
    {
      label: uiText.hunger,
      value: option.stateDelta?.hunger,
    },
    {
      label: uiText.cleanliness,
      value: option.stateDelta?.cleanliness,
    },
    {
      label: uiText.affection,
      value: option.stateDelta?.affection,
    },
    {
      label: uiText.energy,
      value: option.stateDelta?.energy,
    },
  ];

  return rows.filter((row) => row.value !== undefined) as Array<{ label: string; value: number }>;
}

function buildRgbDeltaRows(option: FeedOption) {
  if (!option.rgbDelta) return [] as Array<{ label: "R" | "G" | "B"; value: number }>;
  return ([
    { label: "R", value: option.rgbDelta.r },
    { label: "G", value: option.rgbDelta.g },
    { label: "B", value: option.rgbDelta.b },
  ] as Array<{ label: "R" | "G" | "B"; value?: number }>).filter((row) => row.value !== undefined) as Array<{
    label: "R" | "G" | "B";
    value: number;
  }>;
}

export function CreatureDetailsModal({
  creature,
  uiText,
  actionText,
  token,
  feeds,
  feedInventory,
  speciesText,
  onAction,
  onSetObserverTarget,
}: CreatureDetailsModalProps) {
  const [isFeedMenuOpen, setIsFeedMenuOpen] = useState(false);
  const [activeFeedDescription, setActiveFeedDescription] = useState<FeedOption | null>(null);
  const activeLocale = getActiveLocale();
  const feedOptions = useMemo(
    () =>
      Object.values(feeds)
        .filter((feed) => (feedInventory[feed.id] ?? 0) > 0)
        .map((feed) => ({
          id: feed.id,
          name: feed.name[activeLocale] ?? feed.name.en ?? Object.values(feed.name)[0] ?? feed.id,
          symbolColor: feed.symbolColor,
          stock: feedInventory[feed.id] ?? 0,
          description: feed.description?.[activeLocale] ?? feed.description?.en ?? Object.values(feed.description ?? {})[0],
          stateDelta: feed.stateDelta,
          rgbDelta: feed.rgbDelta,
        })),
    [feeds, feedInventory, activeLocale],
  );

  const renderActionLabel = (actionLabel: string, cost: number) =>
    `${actionLabel}${cost > 0 ? ` (${cost})` : ""}`;
  const isFeedDisabled = token < TOKEN_COST.feed;

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
          data-testid="details-select-button"
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
        <div className="mt-2.5 space-y-2">
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              data-testid="details-action-feed"
              className={`inline-flex items-center justify-center gap-2 whitespace-nowrap border-2 border-[rgba(130,199,255,0.8)] bg-[linear-gradient(180deg,rgba(43,84,151,0.72),rgba(17,29,64,0.82))] px-2 py-2 text-[13px] text-[#f6fdff] min-h-10 tracking-[0.4px] hover:border-[rgba(130,245,255,1)] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)] disabled:opacity-45 disabled:cursor-not-allowed ${isFeedDisabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`}
              aria-label={renderActionLabel(actionText.feed, TOKEN_COST.feed)}
              data-action="feed"
              aria-expanded={isFeedMenuOpen}
              aria-controls="feed-accordion-creature"
              onClick={() => setIsFeedMenuOpen((value) => !value)}
            disabled={isFeedDisabled}
          >
            <Apple className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            {renderActionLabel(actionText.feed, TOKEN_COST.feed)}
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap border-2 border-[rgba(130,199,255,0.8)] bg-[linear-gradient(180deg,rgba(43,84,151,0.72),rgba(17,29,64,0.82))] px-2 py-2 text-[13px] text-[#f6fdff] min-h-10 tracking-[0.4px] hover:border-[rgba(130,245,255,1)] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)] disabled:opacity-45 disabled:cursor-not-allowed"
            aria-label={`${actionText.clean} (${TOKEN_COST.clean})`}
            disabled={creature.state.energy <= 0 || token < TOKEN_COST.clean}
            onClick={() => onAction("clean", creature)}
            type="button"
          >
            <Droplets className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            {actionText.clean} ({TOKEN_COST.clean})
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap border-2 border-[rgba(130,199,255,0.8)] bg-[linear-gradient(180deg,rgba(43,84,151,0.72),rgba(17,29,64,0.82))] px-2 py-2 text-[13px] text-[#f6fdff] min-h-10 tracking-[0.4px] hover:border-[rgba(130,245,255,1)] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)] disabled:opacity-45 disabled:cursor-not-allowed"
            aria-label={`${actionText.play} (${TOKEN_COST.play})`}
            disabled={creature.state.energy <= 0 || token < TOKEN_COST.play}
            onClick={() => onAction("play", creature)}
            type="button"
          >
            <Sparkles className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            {actionText.play} ({TOKEN_COST.play})
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap border-2 border-[rgba(130,199,255,0.8)] bg-[linear-gradient(180deg,rgba(43,84,151,0.72),rgba(17,29,64,0.82))] px-2 py-2 text-[13px] text-[#f6fdff] min-h-10 tracking-[0.4px] hover:border-[rgba(130,245,255,1)] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)] disabled:opacity-45 disabled:cursor-not-allowed"
            aria-label={`${actionText.scan} (${TOKEN_COST.scan})`}
            disabled={creature.state.energy <= 0 || token < TOKEN_COST.scan}
            onClick={() => onAction("scan", creature)}
            type="button"
          >
            <Scan className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            {actionText.scan} ({TOKEN_COST.scan})
          </button>
        </div>
        <div
          id="feed-accordion-creature"
          role="region"
          aria-hidden={!isFeedMenuOpen}
          className={`${isFeedMenuOpen ? "grid gap-2" : "hidden"}`}
        >
          {feedOptions.length === 0 ? (
            <output className="rounded-none border border-lineWeak bg-[rgba(8,14,32,0.72)] px-3 py-2 text-[12px] text-muted">
              {uiText.noFeed}
            </output>
          ) : (
            feedOptions.map((feed) => (
              <div key={feed.id} className="relative grid gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onAction("feed", creature, feed.id);
                      setActiveFeedDescription(null);
                    }}
                    data-testid={`details-feed-option-${feed.id}`}
                    className="grid min-w-0 flex-1 grid-cols-[auto_1fr_auto] items-center gap-2 border-2 border-[rgba(130,199,255,0.72)] bg-[rgba(8,14,32,0.75)] px-2.5 py-1 text-[12px] text-[#f6fdff] tracking-[0.35px] hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)]"
                    aria-label={`${feed.name} x${feed.stock}`}
                  >
                    <span
                      aria-hidden="true"
                      className="h-3 w-3 rounded-full border border-white/25"
                      style={{ backgroundColor: feed.symbolColor }}
                    />
                    <span className="min-w-0 truncate text-left">{feed.name}</span>
                    <span className="grid h-5 w-10 shrink-0 place-items-center rounded-full border border-[rgba(130,199,255,0.8)] bg-[rgba(10,20,44,0.9)] text-[11px] text-[#d6ecff]">
                      {`x${feed.stock}`}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="grid h-8 w-8 shrink-0 place-items-center border border-[rgba(130,199,255,0.8)] bg-[rgba(10,20,44,0.9)] text-[#d6ecff] hover:border-[#8ff5ff] hover:shadow-[0_0_12px_rgba(127,232,255,0.35)]"
                    data-testid={`details-feed-details-${feed.id}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveFeedDescription(activeFeedDescription?.id === feed.id ? null : feed);
                    }}
                    aria-label={`${uiText.feedDetails}: ${feed.name}`}
                    aria-controls={`feed-detail-creature-${feed.id}`}
                    aria-expanded={activeFeedDescription?.id === feed.id}
                  >
                    <CircleHelp className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {activeFeedDescription ? (
        <ModalShell
          title={`${activeFeedDescription.name} ${uiText.feedDetails}`}
          onClose={() => setActiveFeedDescription(null)}
          closeLabel={uiText.close}
        >
          <div className="grid gap-3 text-[12px] text-[#d8ecff]">
            <div className="rounded-none border border-lineWeak bg-[rgba(8,14,32,0.72)] px-3 py-2 leading-snug text-[#e9f6ff]">
              {activeFeedDescription.description || uiText.noDescription}
            </div>
            <div className="text-[11px] text-[#95f7de] tracking-[0.3px]">
              {uiText.stock}: x{activeFeedDescription.stock}
            </div>
            {buildStateDeltaRows(activeFeedDescription, uiText).length > 0 ? (
              <div className="border border-lineWeak bg-[rgba(8,14,32,0.72)] p-2">
                <p className="mb-1 text-[#95f7de]">{uiText.stateChange}</p>
                <div className="grid gap-1.5">
                  {buildStateDeltaRows(activeFeedDescription, uiText).map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3">
                      <span>{row.label}</span>
                      <span className={row.value > 0 ? "text-[#85ff9e]" : "text-[#ff9f9f]"}>{formatSignedValue(row.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {buildRgbDeltaRows(activeFeedDescription).length > 0 ? (
              <div className="border border-lineWeak bg-[rgba(8,14,32,0.72)] p-2">
                <p className="mb-1 text-[#95f7de]">{uiText.colorShift}</p>
                <div className="grid gap-1.5">
                  {buildRgbDeltaRows(activeFeedDescription).map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3">
                      <span>{row.label}</span>
                      <span>{formatSignedValue(row.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </ModalShell>
      ) : null}
    </article>
  );
}
