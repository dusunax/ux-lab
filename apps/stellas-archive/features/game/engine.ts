import { t } from "i18next";
import type { CSSProperties } from "react";
import {
  SupportedLocale,
  SUPPORTED_LOCALES,
  normalizeLocale,
  getActiveLocale,
  MESSAGE_CATALOGS,
  type Locale,
} from "../i18n/i18n";
export type { Locale } from "../i18n/i18n";
export {
  SupportedLocale,
  SUPPORTED_LOCALES,
};

import type {
  ActiveModal,
  ActionText,
  ArchiveEntry,
  FeedInventory,
  FeedItem,
  Creature,
  CreatureState,
  DailyMission,
  DailySignal,
  DailyState,
  EmotionType,
  FilterTab,
  GameMockupMutationConditionType,
  GameMockupMutation,
  GameMockupSpecies,
  GameState,
  GameMockupData,
  GameMockupDataDocument,
  GameMockupNoSqlData,
  GameMockupUser,
  GameMockupUserData,
  InterfaceText,
  Interaction,
  LuminaFlickerProfile,
  LuminaRingProfile,
  LuminaSatelliteProfile,
  LuminaVisualProfile,
  MissionText,
  MutationRule,
  RGB,
  ResearchData,
  Species,
} from "./types";

export type {
  ActiveModal,
  ActionText,
  ArchiveEntry,
  FeedInventory,
  FeedItem,
  Creature,
  CreatureState,
  DailyMission,
  DailySignal,
  DailyState,
  EmotionType,
  GameMockupMutationConditionType,
  GameMockupSpecies,
  GameState,
  GameMockupDataDocument,
  GameMockupNoSqlData,
  GameMockupUser,
  GameMockupUserData,
  InterfaceText,
  Interaction,
  LuminaFlickerProfile,
  LuminaRingProfile,
  LuminaSatelliteProfile,
  LuminaVisualProfile,
  MissionText,
  MutationRule,
  RGB,
  ResearchData,
  Species,
  FilterTab,
} from "./types";

import mockupCore from "../../data/core/v1.json";
import mockupSpecies from "../../data/species/index.json";
import mockupMutationRules from "../../data/mutationRules/index.json";
import mockupUsers from "../../data/users/index.json";

const mockupData = {
  ...mockupCore,
  species: mockupSpecies,
  mutationRules: mockupMutationRules,
};
const userMockupData = mockupUsers as unknown as GameMockupUserData;

const LOCALE_KEYS: readonly Locale[] = [SupportedLocale.En, SupportedLocale.Ko];
const TEMPERAMENTS = ["calm", "curious", "aggressive", "harmonic", "unstable", "mysterious"] as const;
const RARITIES = ["common", "rare", "epic", "legendary"] as const;
const MUTATION_CONDITION_TYPES: readonly GameMockupMutationConditionType[] = [
  "verdant_echo",
  "azure_shell",
  "feral_spark",
  "prism_core",
];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isString = (value: unknown): value is string => typeof value === "string";

const isNumber = (value: unknown): value is number => Number.isFinite(value as number);

const isInArray = <T extends string>(value: unknown, candidates: readonly T[]): value is T =>
  isString(value) && candidates.includes(value as T);

const isRgb = (value: unknown): value is { r: number; g: number; b: number } => {
  if (!isObject(value)) return false;
  const v = value as Record<string, unknown>;
  return isNumber(v.r) && isNumber(v.g) && isNumber(v.b);
};

const isLocalizedStringMap = (value: unknown): value is Record<Locale, string> => {
  if (!isObject(value)) return false;
  return LOCALE_KEYS.every((locale) => isString((value as Record<string, unknown>)[locale]));
};

const isFeedItem = (value: unknown): value is FeedItem => {
  if (!isObject(value)) return false;
  const data = value as Record<string, unknown>;
  const rgbDelta = isObject(data.rgbDelta) ? (data.rgbDelta as Record<string, unknown>) : null;
  const stateDelta = isObject(data.stateDelta) ? (data.stateDelta as Record<string, unknown>) : null;
  if (!isString(data.id)) return false;
  if (!isLocalizedStringMap(data.name)) return false;
  if (data.description !== undefined && !isLocalizedStringMap(data.description)) return false;
  if (!stateDelta) return false;
  const stateEntries = Object.entries(stateDelta);
  if (
    stateEntries.some(
      ([key, item]) => !["hunger", "cleanliness", "affection", "energy"].includes(key) || !isNumber(item),
    )
  ) {
    return false;
  }
  if (!rgbDelta) return false;
  const rgbEntries = Object.entries(rgbDelta);
  if (
    rgbEntries.some(([key, item]) => !["r", "g", "b"].includes(key) || !isNumber(item))
  ) {
    return false;
  }
  return true;
};

const isFeedCollection = (value: unknown): value is Record<string, FeedItem> => {
  if (!isObject(value)) return false;
  return Object.entries(value).every(([id, feed]) => isFeedItem(feed) && feed.id === id);
};

const isVisualProfile = (value: unknown): value is LuminaVisualProfile => {
  if (!isObject(value)) return false;
  const v = value as Record<string, unknown>;
  const rings = isObject(v.rings) ? (v.rings as Record<string, unknown>) : null;
  const flicker = isObject(v.flicker) ? (v.flicker as Record<string, unknown>) : null;
  const satellites = rings && isObject(rings.satellites) ? (rings.satellites as Record<string, unknown>) : null;
  return (
    !!rings &&
    !!flicker &&
    !!satellites &&
    isNumber(rings.count) &&
    isNumber(rings.intensity) &&
    isNumber(rings.spacing) &&
    (rings.scale === undefined || isNumber(rings.scale)) &&
    isNumber(flicker.intensity) &&
    isNumber(satellites.count) &&
    isNumber(satellites.intensity)
  );
};

const isSpecies = (value: unknown): value is GameMockupSpecies => {
  if (!isObject(value)) return false;
  const v = value as Record<string, unknown>;
  return (
    isString(v.id) &&
    isString(v.speciesId) &&
    isString(v.scientificName) &&
    isString(v.commonName) &&
    isRgb(v.baseRgb) &&
    isInArray(v.temperament, TEMPERAMENTS) &&
    isInArray(v.rarity, RARITIES) &&
    Array.isArray(v.traits) &&
    v.traits.every((trait) => isString(trait)) &&
    isVisualProfile(v.visualProfile)
  );
};

const isMutation = (value: unknown): value is GameMockupMutation => {
  if (!isObject(value)) return false;
  const v = value as Record<string, unknown>;
  return (
    isString(v.id) &&
    isString(v.name) &&
    isString(v.resultSpeciesId) &&
    isInArray(v.rarity, RARITIES) &&
    isLocalizedStringMap(v.message) &&
    isInArray(v.conditionType, MUTATION_CONDITION_TYPES)
  );
};

const isGameMockupSpeciesCollection = (value: unknown): value is GameMockupDataDocument["species"] => {
  if (!isObject(value)) return false;
  return Object.entries(value).every(([id, entry]) => isString(id) && isSpecies(entry) && isObject(entry));
};

const isGameMockupMutationCollection = (value: unknown): value is GameMockupDataDocument["mutationRules"] => {
  if (!isObject(value)) return false;
  return Object.entries(value).every(([id, entry]) => isString(id) && isMutation(entry) && isObject(entry));
};

export const STORAGE_KEY = "stellas-archive:game-state-v1";
export const TOKEN_COST: Record<Interaction, number> = {
  feed: 0,
  clean: 1,
  play: 2,
  scan: 3,
  decorate: 5,
};
export const ARCHIVE_PAGE_SIZE = 8;
export const ROSTER_PAGE_SIZE = 6;

const clampVisualFactor = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const clampRingScale = (value: number) => Math.min(1.4, Math.max(0.25, Number.isFinite(value) ? value : 1));

const clampRingCount = (value: number) => Math.max(1, Math.min(4, Math.floor(value)));
const clampFeedStock = (value: number) => Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));

type TraitVisualBoost = {
  rings?: Partial<LuminaRingProfile>;
  flicker?: Partial<LuminaFlickerProfile>;
};

const TRAIT_VISUAL_BOOSTS: Record<string, TraitVisualBoost> = {
  glow: {
    rings: {
      intensity: 0.16,
      satellites: { count: 0, intensity: 0 },
    },
    flicker: { intensity: 0.05 },
  },
  stable: {
    flicker: { intensity: -0.08 },
    rings: { intensity: -0.05 },
  },
  adaptive: {
    rings: {
      satellites: { count: 0, intensity: 0.18 },
    },
  },
  scatter: {
    rings: { spacing: 0.08 },
  },
  volatile: {
    rings: {
      intensity: 0.16,
      satellites: { count: 0, intensity: 0.14 },
    },
    flicker: { intensity: 0.22 },
  },
  pulse: {
    flicker: { intensity: 0.28 },
  },
  growth: {
    rings: { count: 1 },
  },
  prismatic: {
    rings: {
      satellites: { count: 1, intensity: 0.2 },
    },
    flicker: { intensity: 0.08 },
  },
  memoryEcho: {
    rings: { spacing: 0.05 },
    flicker: { intensity: 0.06 },
  },
  feral: {
    rings: {
      satellites: { count: 1, intensity: 0.22 },
    },
    flicker: { intensity: 0.18 },
  },
};

function applyVisualBoost(
  base: LuminaVisualProfile,
  traits: readonly string[] | undefined,
): LuminaVisualProfile {
  const merged = {
    rings: { ...base.rings },
    flicker: { ...base.flicker },
  } as LuminaVisualProfile;

  if (!traits || traits.length === 0) {
    return merged;
  }

  traits.forEach((traitKey) => {
    const boost = TRAIT_VISUAL_BOOSTS[traitKey];
    if (!boost) return;

    if (boost.rings?.count) {
      merged.rings.count += boost.rings.count;
    }
    if (boost.rings?.intensity) {
      merged.rings.intensity += boost.rings.intensity;
    }
    if (boost.rings?.spacing) {
      merged.rings.spacing += boost.rings.spacing;
    }

    if (boost.flicker?.intensity) {
      merged.flicker.intensity += boost.flicker.intensity;
    }

    if (boost.rings?.satellites?.count) {
      merged.rings.satellites = {
        count: (merged.rings.satellites?.count ?? 0) + boost.rings.satellites.count,
        intensity: merged.rings.satellites?.intensity ?? 0,
      };
    }
    if (boost.rings?.satellites?.intensity) {
      merged.rings.satellites = {
        count: merged.rings.satellites?.count ?? 0,
        intensity: (merged.rings.satellites?.intensity ?? 0) + boost.rings.satellites.intensity,
      };
    }
  });

  return withVisualProfile(merged);
}

export function withVisualProfile(value: LuminaVisualProfile): LuminaVisualProfile {
  const baseSatellites = value.rings.satellites;
  return {
    rings: {
      count: clampRingCount(value.rings.count),
      intensity: clampVisualFactor(value.rings.intensity),
      spacing: clampVisualFactor(value.rings.spacing),
      scale: clampRingScale(value.rings.scale ?? 1),
      satellites: {
        count: clampRingCount(baseSatellites?.count ?? 0),
        intensity: clampVisualFactor(baseSatellites?.intensity ?? 0),
      },
    },
    flicker: {
      intensity: clampVisualFactor(value.flicker.intensity),
    },
  };
}

const isGameMockupNoSqlData = (value: unknown): value is GameMockupNoSqlData => {
  if (!isObject(value)) return false;
  const data = value as Record<string, unknown>;
  return (
    isNumber(data.dataVersion) &&
    data.dataVersion > 0 &&
    Array.isArray(data.starterIds) &&
    data.starterIds.every((id) => isString(id)) &&
    Array.isArray(data.starterNicknames) &&
    data.starterNicknames.every((name) => isString(name)) &&
    isVisualProfile(data.defaultVisualProfile) &&
    isFeedCollection(data.feeds) &&
    isObject(data.species) &&
    isGameMockupSpeciesCollection(data.species) &&
    isObject(data.mutationRules) &&
    isGameMockupMutationCollection(data.mutationRules)
  );
};

const normalizeMockupData = (raw: GameMockupNoSqlData): GameMockupData => {
  return {
    dataVersion: raw.dataVersion,
    defaultVisualProfile: raw.defaultVisualProfile,
    starterIds: raw.starterIds,
    starterNicknames: raw.starterNicknames,
    feeds: Object.fromEntries(
      Object.entries(raw.feeds).map(([id, feed]) => [
        id,
        {
          ...feed,
          id,
        },
      ]),
    ) as Record<string, FeedItem>,
    species: Object.fromEntries(
      Object.entries(raw.species).map(([id, species]) => [
        species.speciesId || species.id || id,
        {
          ...species,
          id: species.id || id,
          speciesId: species.speciesId,
          visualProfile: withVisualProfile(species.visualProfile),
        },
      ]),
    ),
    mutationRules: Object.fromEntries(
      Object.entries(raw.mutationRules).map(([id, rule]) => [
        rule.id,
        {
          ...rule,
          id: rule.id ?? id,
        },
      ]),
    ),
  };
};

const readGameMockupData = (raw: unknown): GameMockupData => {
  if (isGameMockupNoSqlData(raw)) return normalizeMockupData(raw);
  throw new Error("Invalid mockup-data-v1.json schema");
};

const gameMockup = readGameMockupData(mockupData);
const getUserInventoryById = (
  userId = userMockupData.activeUserId,
): FeedInventory => {
  const user = userMockupData.users[userId];
  if (!user) return {};
  return Object.entries(user.feedInventory ?? {}).reduce<FeedInventory>((acc, [feedId, stock]) => {
    if (FEEDS[feedId]) {
      acc[feedId] = clampFeedStock(stock);
    }
    return acc;
  }, {});
};

const getActiveUserProfileById = (userId = userMockupData.activeUserId): GameMockupUser | null => {
  return userMockupData.users[userId] ?? null;
};

export const getActiveUserTokens = (userId = userMockupData.activeUserId): number => {
  const user = getActiveUserProfileById(userId);
  if (!user) return 15;
  return Number.isFinite(user.tokens) ? clamp(user.tokens, 0, 999) : 15;
};

export const DEFAULT_LUMINA_VISUAL_PROFILE: LuminaVisualProfile = withVisualProfile(gameMockup.defaultVisualProfile);

export function getCreatureVisualProfile(creature: Pick<Creature, "speciesId" | "traits"> | null): LuminaVisualProfile {
  if (!creature) return DEFAULT_LUMINA_VISUAL_PROFILE;
  const species = SPECIES[creature.speciesId];
  const speciesProfile = species?.visualProfile ?? DEFAULT_LUMINA_VISUAL_PROFILE;
  return applyVisualBoost(speciesProfile, creature.traits);
}

const LOCALE_CATALOGS = MESSAGE_CATALOGS;

export const INTERFACE_TEXT: Record<Locale, InterfaceText> = {
  [SupportedLocale.En]: LOCALE_CATALOGS[SupportedLocale.En].interfaceText,
  [SupportedLocale.Ko]: LOCALE_CATALOGS[SupportedLocale.Ko].interfaceText,
};

export const ACTION_TEXT: Record<Locale, ActionText> = {
  [SupportedLocale.En]: LOCALE_CATALOGS[SupportedLocale.En].actionText,
  [SupportedLocale.Ko]: LOCALE_CATALOGS[SupportedLocale.Ko].actionText,
};

export const MISSION_TEXT: Record<Locale, MissionText> = {
  [SupportedLocale.En]: LOCALE_CATALOGS[SupportedLocale.En].missionText,
  [SupportedLocale.Ko]: LOCALE_CATALOGS[SupportedLocale.Ko].missionText,
};

const getMutationCondition = (conditionType: GameMockupMutation["conditionType"]) => {
  switch (conditionType) {
    case "verdant_echo":
      return (c: Creature) =>
        c.state.cleanliness >= 80 &&
        c.state.hunger >= 60 &&
        c.rgb.g >= 220 &&
        c.rgb.r < 190;
    case "azure_shell":
      return (c: Creature) => c.rgb.b >= 220 && c.state.affection >= 70 && c.emotion === "calm";
    case "feral_spark":
      return (c: Creature) => c.rgb.r >= 220 && c.state.hunger <= 45 && c.state.cleanliness <= 55;
    case "prism_core":
      return (c: Creature) =>
        Math.abs(c.rgb.r - c.rgb.g) < 10 &&
        Math.abs(c.rgb.g - c.rgb.b) < 10 &&
        (c.rgb.r + c.rgb.g + c.rgb.b) / 3 > 180;
    default:
      return () => false;
  }
};

export const SPECIES = gameMockup.species as Record<string, Species>;
export const FEEDS = gameMockup.feeds as Record<string, FeedItem>;

const SPECIES_ID_LOOKUP_BY_UUID: Record<string, string> = Object.fromEntries(
  Object.entries(SPECIES).map(([speciesId, value]) => [value.id, speciesId]),
);

export const normalizeSpeciesId = (speciesId: string) => {
  if (SPECIES[speciesId]) return speciesId;
  return SPECIES_ID_LOOKUP_BY_UUID[speciesId] || speciesId;
};

export const STARTER_IDS = gameMockup.starterIds;

export const getDefaultFeedInventory = (
  source: Record<string, FeedItem> = FEEDS,
  userId?: string
): FeedInventory => {
  const userInventory = getUserInventoryById(userId);
  const next: FeedInventory = {};
  Object.entries(source).forEach(([id]) => {
    next[id] = clampFeedStock(userInventory[id] ?? 0);
  });
  return next;
};

export const MUTATION_RULES_BY_ID = Object.entries(gameMockup.mutationRules).reduce(
  (acc, [id, rule]) => {
    acc[id] = {
      ...rule,
      id,
      condition: getMutationCondition(rule.conditionType),
    };
    return acc;
  },
  {} as Record<string, MutationRule>,
);
export const MUTATION_RULES = Object.values(MUTATION_RULES_BY_ID);

export function getLocaleFromBrowser(): Locale {
  if (typeof window === "undefined") return SupportedLocale.En;
  const language = window.navigator.language.toLowerCase();
  return language.startsWith("ko") ? SupportedLocale.Ko : SupportedLocale.En;
}

export function getTodayText(value: string, locale: Locale = getActiveLocale()) {
  const date = new Date(value);
  const locales = locale === SupportedLocale.Ko ? "ko-KR" : "en-US";
  return date.toLocaleString(locales, { month: "short", day: "numeric" });
}

export function getEmotionLabel(emotion: EmotionType, locale: Locale = getActiveLocale()) {
  const emotionText = LOCALE_CATALOGS[locale].emotionText;
  return emotionText[emotion] ?? emotionText.neutral;
}

export function getMissionText(locale: Locale = getActiveLocale()): MissionText {
  return MISSION_TEXT[locale];
}

export function getActionName(action: Interaction, locale: Locale = getActiveLocale()) {
  return ACTION_TEXT[locale][action];
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function formatDateLabel(value: string, locale: Locale = getActiveLocale()) {
  return getTodayText(value, locale);
}

export function getTodayKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function isYesterday(targetDate: string, fromDate: string) {
  const a = new Date(targetDate);
  const b = new Date(fromDate);
  const diff = b.getTime() - a.getTime();
  return diff >= 24 * 60 * 60 * 1000 && diff < 48 * 60 * 60 * 1000;
}

export function creatureSpeciesFallback(speciesId: string) {
  return speciesId.replace(/^species_/, "species ");
}

export function getDominantEmotion(rgb: RGB): EmotionType {
  const { r, g, b } = rgb;

  if (r > g + 30 && r > b + 30) return "agitated";
  if (g > r + 30 && g > b + 30) return "curious";
  if (b > r + 30 && b > g + 30) return "calm";
  if (Math.abs(r - b) < 20 && r > 160 && b > 160) return "mystic";
  if (Math.abs(r - g) < 20 && r > 160 && g > 160) return "feral";
  if (Math.abs(g - b) < 20 && g > 160 && b > 160) return "harmonic";

  if (g >= r + 10 && g >= b + 10) return "curious";
  if (b >= r + 10 && b >= g + 10) return "attached";

  return "neutral";
}

export function getDominantEmotionLabel(emotion: EmotionType, locale: Locale = getActiveLocale()) {
  return getEmotionLabel(emotion, locale);
}

export function applyRgbDelta(current: RGB, delta: Partial<RGB>): RGB {
  return {
    r: clamp(current.r + (delta.r ?? 0), 0, 255),
    g: clamp(current.g + (delta.g ?? 0), 0, 255),
    b: clamp(current.b + (delta.b ?? 0), 0, 255),
  };
}

export function getStableInt(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getColorOffset(seed: string, maxOffset: number, channel: 0 | 1 | 2) {
  const seedValue = getStableInt(`${seed}-${channel}`);
  return (seedValue % (maxOffset * 2 + 1)) - maxOffset;
}

export function createCreature(speciesId: string, nickname: string, variantSeed?: string): Creature {
  const speciesData = SPECIES[speciesId];
  const luminaOffsetSeed = variantSeed || `${speciesId}-${nickname}`;
  const luminaVariance = speciesId === "species_lumina";
  const variantRgb = luminaVariance
    ? {
        r: clamp(speciesData.baseRgb.r + getColorOffset(luminaOffsetSeed, 16, 0), 0, 255),
        g: clamp(speciesData.baseRgb.g + getColorOffset(luminaOffsetSeed, 10, 1), 0, 255),
        b: clamp(speciesData.baseRgb.b + getColorOffset(luminaOffsetSeed, 10, 2), 0, 255),
      }
    : speciesData.baseRgb;

  return {
    id: `${speciesId}-${crypto.randomUUID().slice(0, 6)}`,
    speciesId,
    scientificName: speciesData.scientificName,
    commonName: speciesData.commonName,
    nickname,
    rgb: variantRgb,
    state: {
      hunger: 70,
      cleanliness: 72,
      affection: 50,
      energy: 75,
    },
    emotion: getDominantEmotion(variantRgb),
    traits: speciesData.traits,
    mutationStage: 0,
    discoveredAt: Date.now(),
  };
}

export function createMissionPool(locale: Locale = getActiveLocale()): DailyMission[] {
  const missionText = getMissionText(locale);
  return [
    {
      id: crypto.randomUUID(),
      label: missionText.feedLabel,
      requiredAction: "feed",
      completed: false,
      optional: missionText.feedOptional,
    },
    {
      id: crypto.randomUUID(),
      label: missionText.scanLabel,
      requiredAction: "scan",
      completed: false,
      optional: missionText.scanOptional || undefined,
    },
    {
      id: crypto.randomUUID(),
      label: missionText.playLabel,
      requiredAction: "play",
      completed: false,
      optional: missionText.playOptional,
    },
  ];
}

export function createDailySignal(creatures: Creature[], locale: Locale = getActiveLocale()): DailySignal | null {
  if (!creatures.length) return null;
  const sorted = [...creatures].sort((a, b) => {
    const aScore = (100 - a.state.cleanliness) + (100 - a.state.hunger) + a.state.affection * -1;
    const bScore = (100 - b.state.cleanliness) + (100 - b.state.hunger) + b.state.affection * -1;
    return bScore - aScore;
  });

  const target = sorted[0];
  const action: Interaction =
    target.state.hunger < 55 ? "feed" : target.state.cleanliness < 55 ? "clean" : "play";
  const actionLabel = getActionName(action, locale);
  const message = t("targetStatusUrgent", {
    name: target.nickname,
    species: target.commonName,
    action: actionLabel,
  });

  return {
    creatureId: target.id,
    message,
    requiredAction: action,
    resolved: false,
    rewardClaimed: false,
  };
}

export function nextDayState(
  prev: DailyState | null,
  creatures: Creature[],
  locale: Locale = getActiveLocale(),
): DailyState {
  const today = getTodayKey();
  const previousDate = prev?.lastVisitDate;
  const streak =
    previousDate && isYesterday(previousDate, today) ? (prev?.streak ?? 0) + 1 : 1;
  const missions = createMissionPool(locale).slice(0, 2);

  return {
    lastVisitDate: today,
    streak,
    signal: createDailySignal(creatures, locale),
    missions: missions.map((m) => ({ ...m, completed: false })),
  };
}

export const initialState = (locale: Locale = SupportedLocale.En): GameState => {
  const activeUserId = userMockupData.activeUserId;
  const today = getTodayKey();

  const starter = STARTER_IDS.map((id, index) =>
    createCreature(
      id,
      gameMockup.starterNicknames[index] ?? `Archive Echo ${index + 1}`,
      `starter-${index}`,
    ),
  );

  return {
    version: 1,
    locale,
    tokens: getActiveUserTokens(activeUserId),
    creatures: starter,
    selectedCreatureId: starter[0]?.id ?? "",
    feedInventory: getDefaultFeedInventory(FEEDS, activeUserId),
    archive: [],
    researchData: { observation: 0, mutation: 0, emotion: 0 },
    daily: {
      lastVisitDate: today,
      streak: 1,
      signal: createDailySignal(starter, locale),
      missions: createMissionPool(locale).slice(0, 2).map((m) => ({ ...m, completed: false })),
    },
  };
};

export const loadState = (fallbackLocale: Locale = SupportedLocale.En): GameState => {
  if (typeof window === "undefined") return initialState();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const activeUserId = userMockupData.activeUserId;
  if (!raw) return initialState(fallbackLocale);
  try {
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed.daily?.lastVisitDate) return initialState(fallbackLocale);

    const nextLocale = normalizeLocale(parsed.locale, fallbackLocale);
    let normalizedState = {
      ...parsed,
      locale: nextLocale,
      creatures: (parsed.creatures ?? []).map((creature) => ({
        ...creature,
        speciesId: normalizeSpeciesId(creature.speciesId ?? "species_lumina"),
      })),
      feedInventory: (() => {
        const mergedInventory: FeedInventory = { ...getDefaultFeedInventory(FEEDS, activeUserId) };
        Object.entries(parsed.feedInventory ?? {}).forEach(([id, rawStock]) => {
          if (FEEDS[id]) {
            mergedInventory[id] = clampFeedStock(Number(rawStock));
          }
        });
        return mergedInventory;
      })(),
      tokens:
        typeof parsed.tokens === "number"
          ? clamp(parsed.tokens, 0, 999)
          : getActiveUserTokens(activeUserId),
      archive: parsed.archive ?? [],
      researchData: parsed.researchData ?? { observation: 0, mutation: 0, emotion: 0 },
      daily: {
        lastVisitDate: parsed.daily.lastVisitDate,
        streak: parsed.daily.streak || 1,
        signal: parsed.daily.signal
          ? {
              ...parsed.daily.signal,
              rewardClaimed: parsed.daily.signal.rewardClaimed ?? false,
            }
          : null,
        missions: parsed.daily.missions ?? [],
      },
    };
    const today = getTodayKey();
    if (parsed.daily.lastVisitDate !== today) {
      normalizedState.daily = nextDayState(parsed.daily, parsed.creatures, normalizedState.locale);
    }

    if (!normalizedState.creatures?.length) {
      return initialState();
    }
    return normalizedState;
  } catch {
    return initialState(fallbackLocale);
  }
};

export const saveState = (state: GameState) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export function evaluateMutation(creature: Creature): { rule: MutationRule | null; nextSpecies: string } {
  for (const rule of MUTATION_RULES) {
    if (creature.speciesId !== rule.resultSpeciesId && rule.condition(creature)) {
      return {
        rule,
        nextSpecies: rule.resultSpeciesId,
      };
    }
  }

  return { rule: null, nextSpecies: creature.speciesId };
}

export function createArchiveEntry(creature: Creature, species: Species, reason: string): ArchiveEntry {
  return {
    id: crypto.randomUUID(),
    time: new Date().toISOString(),
    species: species.commonName,
    name: creature.nickname,
    rgb: creature.rgb,
    emotion: creature.emotion,
    condition: `${creature.state.hunger}/${creature.state.cleanliness}/${creature.state.affection}`,
    reason,
  };
}

export function barWidth(value: number, max: number) {
  return `${clamp(value, 0, max) / max * 100}%`;
}

export function getObserverProfile(creature: Creature | null) {
  if (!creature) {
    return {
      "--observer-orb-size": "150px",
      "--observer-core-size": "68px",
      "--observer-shape": "50%",
      "--observer-ring-a-inset": "8px",
      "--observer-ring-b-inset": "10px",
      "--observer-ring-c-inset": "18px",
      "--observer-halo-scale": "1",
      "--observer-core-scale": "1",
      "--observer-core-pulse": "1",
      "--observer-core-glow": "1",
      "--observer-halo-intensity": "1",
      "--observer-ring-a-speed": "6.8s",
      "--observer-ring-b-speed": "8.8s",
      "--observer-ring-c-speed": "10.6s",
    } as CSSProperties;
  }

  const shapeBySpecies: Record<string, string> = {
    species_lumina: "50%",
    species_mote: "54% 46% 58% 42%",
    species_glint: "36% 64% 34% 66%",
    species_verdant_echo: "50% 50% 50% 50% / 58% 42% 58% 42%",
    species_azure_shell: "58% 42% 64% 36% / 40% 55% 45% 60%",
    species_feral_spark: "30% 70% 35% 65%",
    species_prism_core: "46% 54% 46% 54% / 54% 46% 54% 46%",
  };

  const hueShape = shapeBySpecies[creature.speciesId] ?? "50%";
  const coreSize = 58 + Math.round(creature.state.affection * 0.22);
  const ringAInset = 6 + Math.round(creature.state.energy * 0.06);
  const ringBInset = 5 + Math.round(creature.state.hunger * 0.04);
  const ringCInset = 12 + Math.round(creature.mutationStage * 2);
  const emotionBias =
    creature.emotion === "agitated" || creature.emotion === "feral"
      ? 1.12
      : creature.emotion === "mystic" || creature.emotion === "harmonic"
        ? 1.08
        : 1;
  const emotionSpeedBias =
    creature.emotion === "agitated" || creature.emotion === "feral"
      ? 1.5
      : creature.emotion === "mystic" || creature.emotion === "harmonic"
        ? 0.95
        : 1;

  const corePulse = 0.78 + creature.state.affection * 0.0022 + creature.state.cleanliness * 0.0012;
  const coreGlow =
    0.8 +
    creature.state.affection * 0.002 +
    (creature.state.energy > 82 ? 0.18 : 0) +
    (creature.state.hunger > 82 ? 0.06 : 0);
  const orbBase = 144 + Math.round(creature.state.cleanliness * 0.18);
  const orbitSpeedBase = 8 - Math.round(creature.state.energy * 0.04);
  const ringBBase = 10.2 - Math.round(creature.state.hunger * 0.03);
  const ringCBase = 13.0 - Math.round(creature.state.affection * 0.05);

  return {
    "--observer-orb-size": `${clamp(orbBase, 140, 188)}px`,
    "--observer-core-size": `${clamp(coreSize, 52, 88)}px`,
    "--observer-shape": hueShape,
    "--observer-ring-a-inset": `${clamp(ringAInset, 6, 18)}px`,
    "--observer-ring-b-inset": `${clamp(ringBInset, 4, 16)}px`,
    "--observer-ring-c-inset": `${clamp(ringCInset, 14, 28)}px`,
    "--observer-halo-scale": emotionBias.toFixed(2),
    "--observer-core-scale": `${clamp(
      (coreSize - 58) / 80 + creature.state.cleanliness / 150 + creature.mutationStage * 0.03,
      0.8,
      1.45,
    ).toFixed(2)}`,
    "--observer-core-pulse": clamp(corePulse, 0.88, 1.35).toFixed(2),
    "--observer-core-glow": clamp(coreGlow, 0.88, 1.62).toFixed(2),
    "--observer-halo-intensity":
      (creature.emotion === "agitated" || creature.emotion === "feral" ? "1.45" : "1").toString(),
    "--observer-ring-a-speed": `${clamp(orbitSpeedBase / emotionSpeedBias, 2.2, 6.8).toFixed(2)}s`,
    "--observer-ring-b-speed": `${clamp(ringBBase / emotionSpeedBias, 3.6, 9.8).toFixed(2)}s`,
    "--observer-ring-c-speed": `${clamp(ringCBase / emotionSpeedBias, 4.2, 11.2).toFixed(2)}s`,
  } as CSSProperties;
}
