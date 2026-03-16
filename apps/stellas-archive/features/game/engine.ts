import { t } from "i18next";
import type { CSSProperties } from "react";
import {
  SupportedLocale,
  SUPPORTED_LOCALES,
  normalizeLocale,
  getActiveLocale,
  MESSAGE_CATALOGS,
  type Locale as LocaleFromI18n,
} from "../i18n/i18n";

export type Locale = LocaleFromI18n;
export { SupportedLocale, SUPPORTED_LOCALES };

export type EmotionType =
  | "neutral"
  | "calm"
  | "curious"
  | "agitated"
  | "harmonic"
  | "mystic"
  | "feral"
  | "attached"
  | "lonely";

export type RGB = { r: number; g: number; b: number };

export type CreatureState = {
  hunger: number;
  cleanliness: number;
  affection: number;
  energy: number;
};

export type Species = {
  id: string;
  scientificName: string;
  commonName: string;
  baseRgb: RGB;
  temperament: "calm" | "curious" | "aggressive" | "harmonic" | "unstable" | "mysterious";
  rarity: "common" | "rare" | "epic" | "legendary";
  traits: string[];
};

export type Creature = {
  id: string;
  speciesId: string;
  scientificName: string;
  commonName: string;
  nickname: string;
  rgb: RGB;
  state: CreatureState;
  emotion: EmotionType;
  traits: string[];
  mutationStage: number;
  discoveredAt: number;
};

export type ArchiveEntry = {
  id: string;
  time: string;
  species: string;
  name: string;
  rgb: RGB;
  emotion: EmotionType;
  condition: string;
  reason: string;
};

export type Interaction = "feed" | "clean" | "play" | "scan" | "decorate";

export type DailySignal = {
  creatureId: string;
  message: string;
  requiredAction: Interaction;
  resolved: boolean;
  rewardClaimed: boolean;
};

export type DailyMission = {
  id: string;
  label: string;
  requiredAction: Interaction;
  completed: boolean;
  optional?: string;
};

export type DailyState = {
  lastVisitDate: string;
  streak: number;
  signal: DailySignal | null;
  missions: DailyMission[];
};

export type ResearchData = {
  observation: number;
  mutation: number;
  emotion: number;
};

export type GameState = {
  version: number;
  locale: Locale;
  tokens: number;
  creatures: Creature[];
  selectedCreatureId: string;
  archive: ArchiveEntry[];
  researchData: ResearchData;
  daily: DailyState;
};

export type ActiveModal = null | "missions" | "archive" | "roster" | "creature-details" | "observer-targets";
export type FilterTab = "all" | string;

export type MutationRule = {
  id: string;
  name: string;
  resultSpeciesId: string;
  rarity: Species["rarity"];
  condition: (creature: Creature) => boolean;
  message: Record<Locale, string>;
};

export type InterfaceText = {
  langSwitch: string;
  pageTitle: string;
  subtitle: string;
  labStatus: string;
  tokens: string;
  streak: string;
  research: string;
  todaySignal: string;
  noSignal: string;
  resolved: string;
  needsAction: string;
  dailyMissions: string;
  missionCompleted: string;
  missionPending: string;
  actionRowHint: string;
  signalDone: string;
  signalRewardHint: string;
  archive: string;
  archiveEmpty: string;
  creatures: string;
  all: string;
  active: string;
  select: string;
  emotion: string;
  traits: string;
  mutationStage: string;
  species: string;
  metaEmotion: string;
  metaState: string;
  missionEmpty: string;
  requiredAction: string;
  defaultNotice: string;
  noToken: string;
  creatureNotFound: string;
  rosterEmpty: string;
  more: string;
  close: string;
  creatureDetails: string;
  missionDetails: string;
  continueMissions: string;
  signalRewardClaimed: string;
  observerTargets: string;
  missionsCleared: string;
  days: string;
  hunger: string;
  cleanliness: string;
  affection: string;
  energy: string;
  deckResonance: string;
  colorTracked: string;
  respondedWith: string;
  recoveredHunger: string;
  careStable: string;
  high: string;
  normal: string;
  low: string;
  stable: string;
  unstable: string;
  bonded: string;
  friendly: string;
  neutral: string;
  observerTarget: string;
  observerAuto: string;
  observerPanel: string;
  observerDescription: string;
  noObserverTarget: string;
  stellaComment: string;
};

export type ActionText = Record<Interaction, string>;

export type MissionText = {
  feedLabel: string;
  feedOptional: string;
  scanLabel: string;
  scanOptional: string;
  playLabel: string;
  playOptional: string;
};

export const STORAGE_KEY = "stellas-archive:game-state-v1";
export const TOKEN_COST: Record<Interaction, number> = {
  feed: 1,
  clean: 1,
  play: 2,
  scan: 3,
  decorate: 5,
};
export const ARCHIVE_PAGE_SIZE = 8;
export const ROSTER_PAGE_SIZE = 6;

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

export const SPECIES: Record<string, Species> = {
  species_lumina: {
    id: "species_lumina",
    scientificName: "Luminidae sapiens",
    commonName: "Lumina",
    baseRgb: { r: 120, g: 100, b: 160 },
    temperament: "calm",
    rarity: "common",
    traits: ["glow", "stable"],
  },
  species_mote: {
    id: "species_mote",
    scientificName: "Motenia driftra",
    commonName: "Mote",
    baseRgb: { r: 80, g: 150, b: 90 },
    temperament: "curious",
    rarity: "common",
    traits: ["adaptive", "scatter"],
  },
  species_glint: {
    id: "species_glint",
    scientificName: "Glintus impulsa",
    commonName: "Glint",
    baseRgb: { r: 160, g: 90, b: 90 },
    temperament: "aggressive",
    rarity: "common",
    traits: ["volatile", "pulse"],
  },
  species_verdant_echo: {
    id: "species_verdant_echo",
    scientificName: "Verdantia echoensis",
    commonName: "Verdant Echo",
    baseRgb: { r: 90, g: 220, b: 120 },
    temperament: "curious",
    rarity: "rare",
    traits: ["growth", "adaptive"],
  },
  species_azure_shell: {
    id: "species_azure_shell",
    scientificName: "Azurum stabilis",
    commonName: "Azure Shell",
    baseRgb: { r: 100, g: 100, b: 220 },
    temperament: "calm",
    rarity: "rare",
    traits: ["stable", "memoryEcho"],
  },
  species_feral_spark: {
    id: "species_feral_spark",
    scientificName: "Feralis impuls",
    commonName: "Feral Spark",
    baseRgb: { r: 220, g: 120, b: 80 },
    temperament: "aggressive",
    rarity: "rare",
    traits: ["volatile", "feral"],
  },
  species_prism_core: {
    id: "species_prism_core",
    scientificName: "Prismata nexus",
    commonName: "Prism Core",
    baseRgb: { r: 180, g: 180, b: 180 },
    temperament: "harmonic",
    rarity: "epic",
    traits: ["prismatic", "harmonic"],
  },
};

export const STARTER_IDS = ["species_lumina", "species_mote", "species_glint"];

export const MUTATION_RULES: MutationRule[] = [
  {
    id: "verdant_echo",
    name: "Verdant Echo",
    resultSpeciesId: "species_verdant_echo",
    rarity: "rare",
    message: {
      en: "Sustained green growth stabilized the form.",
      ko: "장기 녹색 성장으로 형태가 안정됐습니다.",
    },
    condition: (c) =>
      c.state.cleanliness >= 80 &&
      c.state.hunger >= 60 &&
      c.rgb.g >= 220 &&
      c.rgb.r < 190,
  },
  {
    id: "azure_shell",
    name: "Azure Shell",
    resultSpeciesId: "species_azure_shell",
    rarity: "rare",
    message: {
      en: "High blue coherence triggered a bonding shell variant.",
      ko: "높은 청색 응집이 결합성 외피 변이를 촉발했습니다.",
    },
    condition: (c) => c.rgb.b >= 220 && c.state.affection >= 70 && c.emotion === "calm",
  },
  {
    id: "feral_spark",
    name: "Feral Spark",
    resultSpeciesId: "species_feral_spark",
    rarity: "rare",
    message: {
      en: "A red surge destabilized the field into feral motion.",
      ko: "적색 과충전이 장을 격정적인 불안정 상태로 바꿨습니다.",
    },
    condition: (c) => c.rgb.r >= 220 && c.state.hunger <= 45 && c.state.cleanliness <= 55,
  },
  {
    id: "prism_core",
    name: "Prism Core",
    resultSpeciesId: "species_prism_core",
    rarity: "epic",
    message: {
      en: "RGB balance collapsed into a harmonic plate.",
      ko: "RGB 균형이 조화판으로 수렴했습니다.",
    },
    condition: (c) =>
      Math.abs(c.rgb.r - c.rgb.g) < 10 &&
      Math.abs(c.rgb.g - c.rgb.b) < 10 &&
      (c.rgb.r + c.rgb.g + c.rgb.b) / 3 > 180,
  },
];

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
  const species = SPECIES[speciesId];
  const luminaOffsetSeed = variantSeed || `${speciesId}-${nickname}`;
  const luminaVariance = speciesId === "species_lumina";
  const variantRgb = luminaVariance
    ? {
        r: clamp(species.baseRgb.r + getColorOffset(luminaOffsetSeed, 16, 0), 0, 255),
        g: clamp(species.baseRgb.g + getColorOffset(luminaOffsetSeed, 10, 1), 0, 255),
        b: clamp(species.baseRgb.b + getColorOffset(luminaOffsetSeed, 10, 2), 0, 255),
      }
    : species.baseRgb;

  return {
    id: `${speciesId}-${crypto.randomUUID().slice(0, 6)}`,
    speciesId,
    scientificName: species.scientificName,
    commonName: species.commonName,
    nickname,
    rgb: variantRgb,
    state: {
      hunger: 70,
      cleanliness: 72,
      affection: 50,
      energy: 75,
    },
    emotion: getDominantEmotion(variantRgb),
    traits: species.traits,
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
  const today = getTodayKey();
  const nicknames = ["Moon Glow", "Pulse", "Quiet Drift", "Neon Wick", "White Veil", "Signal Echo"];

  const starter = STARTER_IDS.map((id, index) =>
    createCreature(id, nicknames[index] ?? `Archive Echo ${index + 1}`, `starter-${index}`),
  );

  return {
    version: 1,
    locale,
    tokens: 15,
    creatures: starter,
    selectedCreatureId: starter[0]?.id ?? "",
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
  if (!raw) return initialState(fallbackLocale);
  try {
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed.daily?.lastVisitDate) return initialState(fallbackLocale);

    const nextLocale = normalizeLocale(parsed.locale, fallbackLocale);
    let normalizedState = {
      ...parsed,
      locale: nextLocale,
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
