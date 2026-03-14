"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Locale = "en" | "ko";

type EmotionType =
  | "neutral"
  | "calm"
  | "curious"
  | "agitated"
  | "harmonic"
  | "mystic"
  | "feral"
  | "attached"
  | "lonely";

type RGB = { r: number; g: number; b: number };
type CreatureState = {
  hunger: number;
  cleanliness: number;
  affection: number;
  energy: number;
};

type Species = {
  id: string;
  scientificName: string;
  commonName: string;
  baseRgb: RGB;
  temperament: "calm" | "curious" | "aggressive" | "harmonic" | "unstable" | "mysterious";
  rarity: "common" | "rare" | "epic" | "legendary";
  traits: string[];
  description: Record<Locale, string>;
};

type Creature = {
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

type ArchiveEntry = {
  id: string;
  time: string;
  species: string;
  name: string;
  rgb: RGB;
  emotion: EmotionType;
  condition: string;
  reason: string;
};

type DailySignal = {
  creatureId: string;
  message: string;
  requiredAction: Interaction;
  resolved: boolean;
};

type DailyMission = {
  id: string;
  label: string;
  requiredAction: Interaction;
  completed: boolean;
  optional?: string;
};

type DailyState = {
  lastVisitDate: string;
  streak: number;
  signal: DailySignal | null;
  missions: DailyMission[];
};

type ResearchData = {
  observation: number;
  mutation: number;
  emotion: number;
};

type GameState = {
  version: number;
  locale: Locale;
  tokens: number;
  creatures: Creature[];
  selectedCreatureId: string;
  archive: ArchiveEntry[];
  researchData: ResearchData;
  daily: DailyState;
};

type Interaction = "feed" | "clean" | "play" | "scan" | "decorate";
type MutationRule = {
  id: string;
  name: string;
  resultSpeciesId: string;
  rarity: Species["rarity"];
  condition: (creature: Creature) => boolean;
  message: Record<Locale, string>;
};

const STORAGE_KEY = "stellas-archive:game-state-v1";
const TOKEN_COST: Record<Interaction, number> = {
  feed: 1,
  clean: 1,
  play: 2,
  scan: 3,
  decorate: 5,
};

const INTERFACE_TEXT: Record<
  Locale,
  {
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
    archive: string;
    archiveEmpty: string;
    creatures: string;
    active: string;
    select: string;
    emotion: string;
    traits: string;
    mutationStage: string;
    species: string;
    metaEmotion: string;
    metaState: string;
    defaultNotice: string;
    noToken: string;
    creatureNotFound: string;
    continueMissions: string;
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
  }
> = {
  en: {
    langSwitch: "EN",
    pageTitle: "Stella's Archive",
    subtitle: "A pet-adjacent emotional systems lab. Observe color, interact, mutate, and archive.",
    labStatus: "Lab Status",
    tokens: "Tokens",
    streak: "Streak",
    research: "Research Data",
    todaySignal: "Today&apos;s Signal",
    noSignal: "No signal today.",
    resolved: "Resolved",
    needsAction: "Needs action",
    dailyMissions: "Daily Missions",
    missionCompleted: "Completed",
    missionPending: "Pending",
    actionRowHint: "Claim mission bonus (+2 Tokens)",
    archive: "Archive",
    archiveEmpty: "No entries yet. Mutations and discoveries will be logged here.",
    creatures: "Creatures in Lab",
    active: "Active",
    select: "Select",
    emotion: "Emotion",
    traits: "Traits",
    mutationStage: "Mutation Stage",
    species: "Species",
    metaEmotion: "emotion",
    metaState: "state",
    defaultNotice: "Observe, feed, and watch the colors shift.",
    noToken: "Not enough Tokens.",
    creatureNotFound: "Creature was not found.",
    continueMissions: "Continue missions to unlock daily signal bonus.",
    missionsCleared: "Daily missions cleared. +2 bonus Tokens.",
    days: "days",
    hunger: "Hunger",
    cleanliness: "Cleanliness",
    affection: "Affection",
    energy: "Energy",
    deckResonance: "deck resonance adjusted",
    colorTracked: "color tracked in lab",
    respondedWith: "responded with",
    recoveredHunger: "recovered hunger",
    careStable: "stabilized by care",
    high: "high",
    normal: "normal",
    low: "low",
    stable: "stable",
    unstable: "unstable",
    bonded: "bonded",
    friendly: "friendly",
    neutral: "Neutral",
    observerTarget: "Observer Target",
    observerAuto: "AUTO",
    observerPanel: "3D Lumina Observer",
    observerDescription: "Rotate the bio-crystal lens and inspect the core in real time.",
    noObserverTarget: "No Lumina specimen is available for observation.",
  },
  ko: {
    langSwitch: "한국어",
    pageTitle: "스텔라의 기록소",
    subtitle: "생명체의 정서형상 실험실. 색을 관찰하고, 상호작용하고, 진화시키고, 기록하세요.",
    labStatus: "연구실 상태",
    tokens: "토큰",
    streak: "연속 출석",
    research: "연구 데이터",
    todaySignal: "오늘의 신호",
    noSignal: "오늘 신호가 없습니다.",
    resolved: "해결됨",
    needsAction: "조치 필요",
    dailyMissions: "일일 미션",
    missionCompleted: "완료",
    missionPending: "진행중",
    actionRowHint: "미션 보상 받기 (+2 토큰)",
    archive: "아카이브",
    archiveEmpty: "아직 기록이 없습니다. 변이와 발견은 여기에 남습니다.",
    creatures: "연구 대상",
    active: "활성",
    select: "선택",
    emotion: "감정",
    traits: "특성",
    mutationStage: "진화 단계",
    species: "종족",
    metaEmotion: "감정",
    metaState: "상태",
    defaultNotice: "관찰하고 먹이를 주며 색이 변하는 과정을 확인하세요.",
    noToken: "토큰이 부족합니다.",
    creatureNotFound: "생명체를 찾지 못했습니다.",
    continueMissions: "미션을 모두 완료해야 시그널 보너스가 열립니다.",
    missionsCleared: "일일 미션을 완료했습니다. 보너스 +2 토큰",
    days: "일",
    hunger: "배고픔",
    cleanliness: "청결도",
    affection: "친밀도",
    energy: "에너지",
    deckResonance: "데코 공진이 조정됨",
    colorTracked: "실험실에서 색상 기록",
    respondedWith: "반응",
    recoveredHunger: "배고픔 회복",
    careStable: "안정화됨",
    high: "높음",
    normal: "보통",
    low: "낮음",
    stable: "안정",
    unstable: "불안정",
    bonded: "친밀",
    friendly: "우호",
    neutral: "중립",
    observerTarget: "관측 대상",
    observerAuto: "자동",
    observerPanel: "3D Lumina 관측실",
    observerDescription: "생체 크리스탈 렌즈를 돌려 코어의 변화를 실시간으로 확인하세요.",
    noObserverTarget: "관측 가능한 Lumina 샘플이 없습니다.",
  },
};

const ACTION_TEXT: Record<Locale, Record<Interaction, string>> = {
  en: {
    feed: "Feed",
    clean: "Clean",
    play: "Play",
    scan: "Scan",
    decorate: "Decorate",
  },
  ko: {
    feed: "먹이주기",
    clean: "청소",
    play: "놀아주기",
    scan: "스캔",
    decorate: "장식",
  },
};

const EMOTION_TEXT: Record<Locale, Record<EmotionType, string>> = {
  en: {
    neutral: "Neutral",
    calm: "Calm",
    curious: "Curious",
    agitated: "Agitated",
    harmonic: "Harmonic",
    mystic: "Mystic",
    feral: "Feral",
    attached: "Attached",
    lonely: "Lonely",
  },
  ko: {
    neutral: "중립",
    calm: "차분",
    curious: "호기심",
    agitated: "불안",
    harmonic: "조화",
    mystic: "신비",
    feral: "격정",
    attached: "애착",
    lonely: "고독",
  },
};

const MISSION_TEXT: Record<
  Locale,
  {
    feedLabel: string;
    feedOptional: string;
    scanLabel: string;
    scanOptional: string;
    playLabel: string;
    playOptional: string;
  }
> = {
  en: {
    feedLabel: "Feed one creature to restore life drive.",
    feedOptional: "Try a red or green food for color experiments.",
    scanLabel: "Run a scan once to collect research data.",
    scanOptional: "",
    playLabel: "Apply a light interaction (play) for emotional response.",
    playOptional: "Look for a color shift and log it in archive.",
  },
  ko: {
    feedLabel: "생명체 하나를 먹이며 생존 에너지를 회복하세요.",
    feedOptional: "색 변화를 보려면 적색/녹색 사료를 번갈아 써 보세요.",
    scanLabel: "한 번 스캔해 연구 데이터를 수집하세요.",
    scanOptional: "",
    playLabel: "가벼운 상호작용(놀아주기)으로 감정 반응을 유도하세요.",
    playOptional: "색 변화가 생기면 아카이브에 남겨보세요.",
  },
};

function getLocaleFromBrowser(): Locale {
  if (typeof window === "undefined") return "en";
  const language = window.navigator.language.toLowerCase();
  return language.startsWith("ko") ? "ko" : "en";
}

function getTodayText(locale: Locale, value: string) {
  const date = new Date(value);
  const locales = locale === "ko" ? "ko-KR" : "en-US";
  return date.toLocaleString(locales, { month: "short", day: "numeric" });
}

function getEmotionLabel(locale: Locale, emotion: EmotionType) {
  return EMOTION_TEXT[locale][emotion] ?? EMOTION_TEXT[locale].neutral;
}

function getMissionText(locale: Locale): {
  feedLabel: string;
  feedOptional: string;
  scanLabel: string;
  scanOptional: string;
  playLabel: string;
  playOptional: string;
} {
  return MISSION_TEXT[locale];
}

function getActionName(locale: Locale, action: Interaction) {
  return ACTION_TEXT[locale][action];
}
const SPECIES: Record<string, Species> = {
  species_lumina: {
    id: "species_lumina",
    scientificName: "Luminidae sapiens",
    commonName: "Lumina",
    baseRgb: { r: 120, g: 100, b: 160 },
    temperament: "calm",
    rarity: "common",
    traits: ["glow", "stable"],
    description: {
      en: "Stable emotional baseline for Stella's first discovered species.",
      ko: "스텔라가 처음 발견한 종족의 정서적 기준선입니다.",
    },
  },
  species_mote: {
    id: "species_mote",
    scientificName: "Motenia driftra",
    commonName: "Mote",
    baseRgb: { r: 80, g: 150, b: 90 },
    temperament: "curious",
    rarity: "common",
    traits: ["adaptive", "scatter"],
    description: {
      en: "A jittery particle life with curiosity spikes.",
      ko: "호기심이 급증하는 입자형 생명체입니다.",
    },
  },
  species_glint: {
    id: "species_glint",
    scientificName: "Glintus impulsa",
    commonName: "Glint",
    baseRgb: { r: 160, g: 90, b: 90 },
    temperament: "aggressive",
    rarity: "common",
    traits: ["volatile", "pulse"],
    description: {
      en: "A fierce light form with quick emotional spikes.",
      ko: "감정 스파이크가 빠르게 치솟는 공격적인 광학 형태입니다.",
    },
  },
  species_verdant_echo: {
    id: "species_verdant_echo",
    scientificName: "Verdantia echoensis",
    commonName: "Verdant Echo",
    baseRgb: { r: 90, g: 220, b: 120 },
    temperament: "curious",
    rarity: "rare",
    traits: ["growth", "adaptive"],
    description: {
      en: "Emerges through sustained growth tone and stable conditions.",
      ko: "지속적인 성장 톤과 안정적인 환경에서 나타납니다.",
    },
  },
  species_azure_shell: {
    id: "species_azure_shell",
    scientificName: "Azurum stabilis",
    commonName: "Azure Shell",
    baseRgb: { r: 100, g: 100, b: 220 },
    temperament: "calm",
    rarity: "rare",
    traits: ["stable", "memoryEcho"],
    description: {
      en: "A stabilizing form with calming resonance.",
      ko: "진정 공명을 동반하는 안정화 형태입니다.",
    },
  },
  species_feral_spark: {
    id: "species_feral_spark",
    scientificName: "Feralis impuls",
    commonName: "Feral Spark",
    baseRgb: { r: 220, g: 120, b: 80 },
    temperament: "aggressive",
    rarity: "rare",
    traits: ["volatile", "feral"],
    description: {
      en: "Unstable red-dominant evolution under emotional pressure.",
      ko: "감정 압박이 강해지면 적색이 지배적인 불안정 진화를 일으킵니다.",
    },
  },
  species_prism_core: {
    id: "species_prism_core",
    scientificName: "Prismata nexus",
    commonName: "Prism Core",
    baseRgb: { r: 180, g: 180, b: 180 },
    temperament: "harmonic",
    rarity: "epic",
    traits: ["prismatic", "harmonic"],
    description: {
      en: "Rare harmonic balance from near-equal channels.",
      ko: "채널 값이 거의 균등해질 때 드문 조화 상태가 됩니다.",
    },
  },
};

const STARTER_IDS = ["species_lumina", "species_mote", "species_glint"];

const MUTATION_RULES: MutationRule[] = [
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatDateLabel(value: string, locale: Locale) {
  return getTodayText(locale, value);
}

function getTodayKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function isYesterday(targetDate: string, fromDate: string) {
  const a = new Date(targetDate);
  const b = new Date(fromDate);
  const diff = b.getTime() - a.getTime();
  return diff >= 24 * 60 * 60 * 1000 && diff < 48 * 60 * 60 * 1000;
}

function getDominantEmotion(rgb: RGB): EmotionType {
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

function getDominantEmotionLabel(locale: Locale, emotion: EmotionType) {
  return getEmotionLabel(locale, emotion);
}

function applyRgbDelta(current: RGB, delta: Partial<RGB>): RGB {
  return {
    r: clamp(current.r + (delta.r ?? 0), 0, 255),
    g: clamp(current.g + (delta.g ?? 0), 0, 255),
    b: clamp(current.b + (delta.b ?? 0), 0, 255),
  };
}

function getStableInt(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getColorOffset(seed: string, maxOffset: number, channel: 0 | 1 | 2) {
  const seedValue = getStableInt(`${seed}-${channel}`);
  return (seedValue % (maxOffset * 2 + 1)) - maxOffset;
}

function createCreature(speciesId: string, nickname: string, variantSeed?: string): Creature {
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

function createMissionPool(locale: Locale): DailyMission[] {
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

function createDailySignal(creatures: Creature[], locale: Locale): DailySignal | null {
  if (!creatures.length) return null;
  const sorted = [...creatures].sort((a, b) => {
    const aScore = (100 - a.state.cleanliness) + (100 - a.state.hunger) + a.state.affection * -1;
    const bScore = (100 - b.state.cleanliness) + (100 - b.state.hunger) + b.state.affection * -1;
    return bScore - aScore;
  });

  const target = sorted[0];
  const action: Interaction =
    target.state.hunger < 55 ? "feed" : target.state.cleanliness < 55 ? "clean" : "play";
  const actionLabel = getActionName(locale, action);
  const message =
    locale === "ko"
      ? `긴급 점검: ${target.nickname} (${target.commonName})에게 ${actionLabel} 수행이 필요해요.`
      : `Critical check: ${target.nickname} (${target.commonName}) needs urgent ${actionLabel}.`;

  return {
    creatureId: target.id,
    message,
    requiredAction: action,
    resolved: false,
  };
}

function nextDayState(prev: DailyState | null, creatures: Creature[], locale: Locale): DailyState {
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

const initialState = (locale: Locale = "en"): GameState => {
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

const loadState = (fallbackLocale: Locale = "en"): GameState => {
  if (typeof window === "undefined") return initialState();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return initialState(fallbackLocale);
  try {
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed.daily?.lastVisitDate) return initialState(fallbackLocale);

    let normalizedState = {
      ...parsed,
      locale: parsed.locale ?? fallbackLocale,
      archive: parsed.archive ?? [],
      researchData: parsed.researchData ?? { observation: 0, mutation: 0, emotion: 0 },
      daily: {
        lastVisitDate: parsed.daily.lastVisitDate,
        streak: parsed.daily.streak || 1,
        signal: parsed.daily.signal ?? null,
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

const saveState = (state: GameState) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

function evaluateMutation(creature: Creature): {
  rule: MutationRule | null;
  nextSpecies: string;
} {
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

function createArchiveEntry(creature: Creature, species: Species, reason: string): ArchiveEntry {
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

function barWidth(value: number, max: number) {
  return `${clamp(value, 0, max) / max * 100}%`;
}

function getObserverProfile(creature: Creature | null) {
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
    } as React.CSSProperties;
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
    "--observer-core-scale": `${clamp((coreSize - 58) / 80 + creature.state.cleanliness / 150 + creature.mutationStage * 0.03, 0.8, 1.45).toFixed(2)}`,
    "--observer-core-pulse": clamp(corePulse, 0.88, 1.35).toFixed(2),
    "--observer-core-glow": clamp(coreGlow, 0.88, 1.62).toFixed(2),
    "--observer-halo-intensity": (creature.emotion === "agitated" || creature.emotion === "feral" ? "1.45" : "1").toString(),
    "--observer-ring-a-speed": `${clamp(orbitSpeedBase / emotionSpeedBias, 2.2, 6.8).toFixed(2)}s`,
    "--observer-ring-b-speed": `${clamp(ringBBase / emotionSpeedBias, 3.6, 9.8).toFixed(2)}s`,
    "--observer-ring-c-speed": `${clamp(ringCBase / emotionSpeedBias, 4.2, 11.2).toFixed(2)}s`,
  } as React.CSSProperties;
}

export default function StellaArchivePage() {
  const [state, setState] = useState<GameState>(initialState);
  const [feedback, setFeedback] = useState<string>(INTERFACE_TEXT.en.defaultNotice);
  const [observerYaw, setObserverYaw] = useState(42);
  const [observerPitch, setObserverPitch] = useState(52);
  const [isObserverAutoTarget, setIsObserverAutoTarget] = useState(true);
  const [observerTargetId, setObserverTargetId] = useState<string | null>(null);
  const [isDraggingObserver, setIsDraggingObserver] = useState(false);
  const observerShellRef = useRef<HTMLDivElement | null>(null);
  const observerDragState = useRef({ startX: 0, startY: 0, startYaw: 42, startPitch: 52 });
  const observerDraggingRef = useRef(false);

  useEffect(() => {
    const next = loadState(getLocaleFromBrowser());
    setFeedback(INTERFACE_TEXT[next.locale].defaultNotice);
    setState((prev) => ({
      ...next,
      selectedCreatureId: prev.selectedCreatureId || next.selectedCreatureId,
    }));
  }, []);

  useEffect(() => saveState(state), [state]);

  const selectedCreature = useMemo(
    () => state.creatures.find((creature) => creature.id === state.selectedCreatureId) ?? state.creatures[0],
    [state.creatures, state.selectedCreatureId],
  );
  const autoTargetId = useMemo(
    () => selectedCreature?.id ?? null,
    [selectedCreature],
  );

  useEffect(() => {
    if (isObserverAutoTarget) {
      setObserverTargetId(autoTargetId);
      return;
    }

    if (!observerTargetId) return;
    const exists = state.creatures.some((creature) => creature.id === observerTargetId);
    if (!exists) {
      setObserverTargetId(state.creatures[0]?.id ?? null);
    }
  }, [isObserverAutoTarget, autoTargetId, observerTargetId, state.creatures]);

  const selectedObserverTargetId = useMemo(() => {
    if (isObserverAutoTarget) return autoTargetId;
    return observerTargetId ?? state.creatures[0]?.id ?? null;
  }, [autoTargetId, isObserverAutoTarget, observerTargetId, state.creatures]);

  const observerCreature = useMemo(
    () => state.creatures.find((creature) => creature.id === selectedObserverTargetId) ?? null,
    [state.creatures, selectedObserverTargetId],
  );
  const observerProfile = useMemo(() => getObserverProfile(observerCreature), [observerCreature]);
  const observerStyle = useMemo(
    () =>
      ({
        "--lumina-core": observerCreature
          ? `rgb(${observerCreature.rgb.r}, ${observerCreature.rgb.g}, ${observerCreature.rgb.b})`
          : "rgb(128, 210, 255)",
        ...observerProfile,
      }) as React.CSSProperties,
    [observerProfile, observerCreature],
  );
  const uiText = INTERFACE_TEXT[state.locale];
  const actionText = ACTION_TEXT[state.locale];
  const missionText = getMissionText(state.locale);

  const performAction = useCallback(
    (interaction: Interaction, creature: Creature) => {
      setState((prev) => {
        const locale = prev.locale;
        const localeText = INTERFACE_TEXT[locale];
        if (prev.tokens < TOKEN_COST[interaction]) {
          setFeedback(localeText.noToken);
          return prev;
        }

        let nextArchive = [...prev.archive];
        let nextFeedback = "";
        let wasCreatureFound = false;
        const prevCompletedMissionCount = prev.daily.missions.filter((mission) => mission.completed).length;

        const targets = prev.creatures.map((item) => {
          if (item.id !== creature.id) return item;
          wasCreatureFound = true;

          const nextState = { ...item.state };
          let rgbDelta: Partial<RGB> = {};

          switch (interaction) {
            case "feed":
              nextState.hunger = clamp(nextState.hunger + 24, 0, 100);
              nextState.energy = clamp(nextState.energy + 8, 0, 100);
              rgbDelta = { r: 12, g: -1, b: -2 };
              break;
            case "clean":
              nextState.cleanliness = clamp(nextState.cleanliness + 26, 0, 100);
              nextState.energy = clamp(nextState.energy + 4, 0, 100);
              rgbDelta = { b: 6, g: 2 };
              break;
            case "play":
              nextState.affection = clamp(nextState.affection + 12, 0, 100);
              nextState.hunger = clamp(nextState.hunger - 5, 0, 100);
              nextState.energy = clamp(nextState.energy - 8, 0, 100);
              nextState.cleanliness = clamp(nextState.cleanliness - 6, 0, 100);
              rgbDelta = { r: 11, g: 10, b: 1 };
              break;
            case "scan":
              rgbDelta = { r: 1, g: 1, b: 1 };
              break;
            case "decorate":
              nextState.affection = clamp(nextState.affection + 6, 0, 100);
              rgbDelta = { b: 12, g: 6 };
              break;
          }

          const nextRgb = applyRgbDelta(item.rgb, rgbDelta);
          const nextEmotion = getDominantEmotion(nextRgb);
          let nextCreature: Creature = {
            ...item,
            state: nextState,
            rgb: nextRgb,
            emotion: nextEmotion,
          };

          const drift = evaluateMutation(nextCreature);
          let archiveReason = "";
          if (drift.rule && SPECIES[drift.nextSpecies]) {
            const nextSpecies = SPECIES[drift.nextSpecies];
            nextCreature = {
              ...nextCreature,
              speciesId: nextSpecies.id,
              scientificName: nextSpecies.scientificName,
              commonName: nextSpecies.commonName,
              traits: nextSpecies.traits,
              mutationStage: nextCreature.mutationStage + 1,
            };
            nextArchive.unshift(
              createArchiveEntry(
                nextCreature,
                nextSpecies,
                `${drift.rule.name} discovered (${drift.rule.message[locale]})`,
              ),
            );
            archiveReason =
              locale === "ko"
                ? `${nextSpecies.commonName} 변이체로 진화했습니다`
                : `${nextSpecies.commonName} emerged`;
          }

          // passive decay keeps pressure for care loops
          nextCreature.state.hunger = clamp(nextCreature.state.hunger - 1, 0, 100);
          nextCreature.state.cleanliness = clamp(nextCreature.state.cleanliness - 1, 0, 100);

          const reaction = (() => {
            if (archiveReason) return archiveReason;
            if (interaction === "scan") return `${nextCreature.nickname}: ${localeText.colorTracked}`;
            if (interaction === "decorate") return `${nextCreature.nickname}: ${localeText.deckResonance}`;
            if (interaction === "play")
              return `${nextCreature.nickname}: ${localeText.respondedWith} ${getEmotionLabel(locale, nextEmotion)}`;
            if (interaction === "feed") return `${nextCreature.nickname}: ${localeText.recoveredHunger}`;
            return `${nextCreature.nickname}: ${localeText.careStable}`;
          })();
          nextFeedback = reaction;

          return { ...nextCreature, emotion: getDominantEmotion(nextCreature.rgb) };
        });

        if (!wasCreatureFound) {
          setFeedback(localeText.creatureNotFound);
          return prev;
        }

        if (nextFeedback) {
          setFeedback(nextFeedback);
        }

        const updatedMission = prev.daily.missions.map((mission) => {
          if (mission.completed || mission.requiredAction !== interaction) return mission;
          return { ...mission, completed: true };
        });

        let updatedSignal = prev.daily.signal;
        if (updatedSignal && !updatedSignal.resolved) {
          const resolved =
            updatedSignal.creatureId === creature.id && updatedSignal.requiredAction === interaction;
          if (resolved) {
            updatedSignal = { ...updatedSignal, resolved: true };
          }
        }

        const completedMissions = updatedMission.filter((mission) => mission.completed).length;
        const bonus = completedMissions >= 2 && prevCompletedMissionCount < 2 ? 2 : 0;

        return {
          ...prev,
          tokens: clamp(prev.tokens - TOKEN_COST[interaction] + bonus, 0, 999),
          creatures: targets,
          archive: nextArchive,
          researchData: {
            observation: prev.researchData.observation + (interaction === "scan" ? 5 : 0),
            mutation: prev.researchData.mutation + (nextArchive.length > prev.archive.length ? 20 : 0),
            emotion: prev.researchData.emotion + (interaction === "play" ? 2 : 1),
          },
          daily: {
            ...prev.daily,
            signal: updatedSignal,
            missions: updatedMission,
          },
        };
      });
    },
    [],
  );

  const selectCreature = useCallback((id: string) => {
    setState((prev) => ({ ...prev, selectedCreatureId: id }));
  }, []);

  const clearCompletedMissions = useCallback(() => {
    const localeText = INTERFACE_TEXT[state.locale];
    const allCompleted = state.daily.missions.every((mission) => mission.completed);
    if (!allCompleted) {
      setFeedback(localeText.continueMissions);
      return;
    }

    setState((prev) => ({
      ...prev,
      daily: {
        ...prev.daily,
        missions: prev.daily.missions.map((mission) => ({ ...mission, completed: false })),
      },
      tokens: prev.tokens + 2,
    }));
    setFeedback(localeText.missionsCleared);
  }, [state]);

  const handleObserverPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    observerDragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      startYaw: observerYaw,
      startPitch: observerPitch,
    };
    observerDraggingRef.current = true;
    setIsDraggingObserver(true);
    observerShellRef.current?.setPointerCapture(event.pointerId);
  }, [observerYaw, observerPitch]);

  const handleObserverPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!observerDraggingRef.current) return;
    event.preventDefault();
    const deltaX = event.clientX - observerDragState.current.startX;
    const deltaY = event.clientY - observerDragState.current.startY;

    setObserverYaw(observerDragState.current.startYaw + deltaX * 0.4);
    setObserverPitch(clamp(observerDragState.current.startPitch - deltaY * 0.4, -80, 80));
  }, []);

  const handleObserverPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!observerDraggingRef.current) return;
    observerDraggingRef.current = false;
    setIsDraggingObserver(false);
    observerShellRef.current?.releasePointerCapture(event.pointerId);
  }, []);

  useEffect(() => {
    let rafId = 0;
    const spin = () => {
      if (!observerDraggingRef.current) {
        setObserverYaw((prev) => prev + 0.4);
      }
      rafId = window.requestAnimationFrame(spin);
    };

    rafId = window.requestAnimationFrame(spin);
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  const toggleLocale = useCallback(() => {
    setState((prev) => {
      const nextLocale = prev.locale === "en" ? "ko" : "en";
      setFeedback(INTERFACE_TEXT[nextLocale].defaultNotice);
      return { ...prev, locale: nextLocale };
    });
  }, []);

  const remainingMissions = state.daily.missions.filter((mission) => !mission.completed);
  const completedMissionsCount = state.daily.missions.length - remainingMissions.length;
  const missionProgressPercent =
    state.daily.missions.length === 0 ? 0 : (completedMissionsCount / state.daily.missions.length) * 100;

  return (
    <main className="page">
      <div className="title-row">
        <div>
          <h1 className="title title-logo" data-logo={uiText.pageTitle}>
            {uiText.pageTitle}
          </h1>
          <p className="subtitle">{uiText.subtitle}</p>
        </div>
        <button className="lang-toggle" onClick={toggleLocale}>
          {state.locale === "en" ? "한국어" : "EN"}
        </button>
      </div>

      <section className="game-hud">
        <section className="panel hud-card">
          <h2>{uiText.labStatus}</h2>
          <div className="hud-stats">
            <p className="meta">
              {uiText.tokens}: <strong>{state.tokens}</strong>
            </p>
            <p className="meta">
              {uiText.streak}: <strong>{state.daily.streak}</strong> {uiText.days}
            </p>
            <p className="meta">
              {uiText.research} {state.researchData.observation}/{state.researchData.mutation}/{state.researchData.emotion}
            </p>
          </div>
          <div className="notice">{feedback}</div>
        </section>

        <section className="panel hud-card">
          <h2>{uiText.todaySignal}</h2>
          <p className="meta">{state.daily.lastVisitDate}</p>
          {state.daily.signal ? (
            <div className="daily-chip">
              <div>{state.daily.signal.message}</div>
              <span className="tag">{state.daily.signal.resolved ? uiText.resolved : uiText.needsAction}</span>
            </div>
          ) : (
            <div className="meta">{uiText.noSignal}</div>
          )}
        </section>

        <section className="panel hud-card">
          <h2>{uiText.dailyMissions}</h2>
          <div className="mission-progress">
            <div className="mission-progress-meta">
              {uiText.missionCompleted}: {completedMissionsCount}/{state.daily.missions.length}
            </div>
            <div className="bar-track mission-track">
              <div className="bar-fill mission-fill" style={{ width: `${missionProgressPercent}%` }} />
            </div>
          </div>
          {state.daily.missions.map((mission) => {
            const missionLabel =
              mission.requiredAction === "feed"
                ? missionText.feedLabel
                : mission.requiredAction === "scan"
                  ? missionText.scanLabel
                  : missionText.playLabel;

            const missionOptional =
              mission.requiredAction === "feed"
                ? missionText.feedOptional
                : mission.requiredAction === "scan"
                  ? missionText.scanOptional
                  : missionText.playOptional;

            return (
              <div key={mission.id} className="daily-chip">
                <div>{missionLabel}</div>
                <div className="row">
                  <span className="tag">{mission.completed ? uiText.missionCompleted : uiText.missionPending}</span>
                  <span className="tag">{getActionName(state.locale, mission.requiredAction)}</span>
                </div>
                {missionOptional ? <div className="meta">{missionOptional}</div> : null}
              </div>
            );
          })}
          <button className="action" onClick={clearCompletedMissions} disabled={remainingMissions.length > 0}>
            {uiText.actionRowHint}
          </button>
        </section>
      </section>

      <div className="game-main-grid">
        <section className="panel observer-panel">
          <h2>{uiText.observerPanel}</h2>
          <p className="meta">{uiText.observerDescription}</p>
          <div className="observer-target-controls">
            <div className="observer-target-title">{uiText.observerTarget}</div>
            <div className="observer-target-list">
              <button
                className={`observer-target-btn ${isObserverAutoTarget ? "is-active" : ""}`}
                onClick={() => setIsObserverAutoTarget(true)}
              >
                {uiText.observerAuto}
              </button>
              {state.creatures.map((creature) => (
                <button
                  key={creature.id}
                  className={`observer-target-btn ${!isObserverAutoTarget && observerTargetId === creature.id ? "is-active" : ""}`}
                  onClick={() => {
                    setObserverTargetId(creature.id);
                    setIsObserverAutoTarget(false);
                  }}
                >
                  <span
                    className="observer-target-swatch"
                    style={{
                      background: `rgb(${creature.rgb.r}, ${creature.rgb.g}, ${creature.rgb.b})`,
                    }}
                  />
                  <span className="observer-target-name">{creature.nickname}</span>
                </button>
              ))}
            </div>
          </div>
          {observerCreature ? (
            <div className="observer-view">
              <div className="observer-chamber">
                <div className="chamber-hud">
                  <span className="chamber-hud-title">LUMINA OBSERVATORY</span>
                  <span className="chamber-hud-id">{observerCreature.nickname}</span>
                </div>
                <div className="chamber-frame">
                  <span className="chamber-corner chamber-corner-tl" />
                  <span className="chamber-corner chamber-corner-tr" />
                  <span className="chamber-corner chamber-corner-bl" />
                  <span className="chamber-corner chamber-corner-br" />
                  <div className="chamber-lens-window">
                    <span className="chamber-scanline" />
                    <span className="chamber-fog" />
                    <span className="chamber-border-shade" />
                    <div
                      ref={observerShellRef}
                      className={`observer-shell ${isDraggingObserver ? "is-dragging" : ""}`}
                      onPointerDown={handleObserverPointerDown}
                      onPointerMove={handleObserverPointerMove}
                      onPointerUp={handleObserverPointerUp}
                      onPointerLeave={handleObserverPointerUp}
                    >
                      <div className="observer-floor" />
                      <div className="observer-platform" />
                      <div
                        className="observer-orb"
                        style={{
                          ...observerStyle,
                          transform: `translate(-50%, -50%) rotateX(${observerPitch}deg) rotateY(${observerYaw}deg)`,
                        }}
                        key={observerCreature.id}
                      >
                        <span className="observer-halo" />
                        <span className="observer-core" />
                        <span className="observer-ring ring-a" />
                        <span className="observer-ring ring-b" />
                        <span className="observer-ring ring-c" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="meta">
                {observerCreature.nickname} ({observerCreature.commonName}) | {getEmotionLabel(state.locale, observerCreature.emotion)}
              </div>
            </div>
          ) : (
            <div className="meta">{uiText.noObserverTarget}</div>
          )}
        </section>

        <section className="control-stack">
          <section className="panel creature-console">
            <h2>{uiText.creatures}</h2>
            <div className="panel-subtitle">{uiText.active}</div>
            {selectedCreature && (
              <article className="creature-card selected creature-active">
                <div className="creature-head">
                  <div>
                    <div className="species">{selectedCreature.commonName}</div>
                    <div className="nickname">{selectedCreature.nickname}</div>
                  </div>
                  <button className="choose-btn" onClick={() => selectCreature(selectedCreature.id)}>
                    {uiText.active}
                  </button>
                </div>
                <div className="sprite-wrap">
                  <div
                    className="sprite"
                    style={
                      {
                        "--sprite": `rgb(${selectedCreature.rgb.r} ${selectedCreature.rgb.g} ${selectedCreature.rgb.b} / 1)`,
                      } as React.CSSProperties
                    }
                  >
                    <div className="sprite-core" />
                  </div>
                </div>
                <p className="tag">
                  {uiText.emotion}: <strong>{getDominantEmotionLabel(state.locale, selectedCreature.emotion)}</strong> / {uiText.traits}:{" "}
                  {selectedCreature.traits.join(", ")}
                </p>
                <div className="bars">
                  <div className="bar-row">
                    <div className="bar-label">
                      <span>{uiText.hunger} {Math.round(selectedCreature.state.hunger)}</span>
                      <span>
                        {selectedCreature.state.hunger > 79
                          ? uiText.high
                          : selectedCreature.state.hunger > 39
                            ? uiText.normal
                            : uiText.low}
                      </span>
                    </div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: barWidth(selectedCreature.state.hunger, 100) }} /></div>
                  </div>
                  <div className="bar-row">
                    <div className="bar-label">
                      <span>{uiText.cleanliness} {Math.round(selectedCreature.state.cleanliness)}</span>
                      <span>
                        {selectedCreature.state.cleanliness > 79
                          ? uiText.stable
                          : selectedCreature.state.cleanliness > 39
                            ? uiText.normal
                            : uiText.unstable}
                      </span>
                    </div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: barWidth(selectedCreature.state.cleanliness, 100), background: "#96f7bf" }} /></div>
                  </div>
                  <div className="bar-row">
                    <div className="bar-label">
                      <span>{uiText.affection} {Math.round(selectedCreature.state.affection)}</span>
                      <span>{selectedCreature.state.affection > 79 ? uiText.bonded : uiText.friendly}</span>
                    </div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: barWidth(selectedCreature.state.affection, 100), background: "#f8b4d9" }} /></div>
                  </div>
                  <div className="bar-row">
                    <div className="bar-label">
                      <span>{uiText.energy} {Math.round(selectedCreature.state.energy)}</span>
                      <span>{selectedCreature.state.energy > 79 ? uiText.high : uiText.low}</span>
                    </div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: barWidth(selectedCreature.state.energy, 100), background: "#ffd78a" }} /></div>
                  </div>
                </div>

                <div className="rgb-bars">
                  <div className="rgb-line">
                    <span style={{ width: "24px" }}>R</span>
                    <div className="bar-track"><div className="bar-fill" style={{ width: barWidth(selectedCreature.rgb.r, 255), background: "#ff7b7b" }} /></div>
                    <span className="rgb-value">{selectedCreature.rgb.r}</span>
                  </div>
                  <div className="rgb-line">
                    <span style={{ width: "24px" }}>G</span>
                    <div className="bar-track"><div className="bar-fill" style={{ width: barWidth(selectedCreature.rgb.g, 255), background: "#79e98c" }} /></div>
                    <span className="rgb-value">{selectedCreature.rgb.g}</span>
                  </div>
                  <div className="rgb-line">
                    <span style={{ width: "24px" }}>B</span>
                    <div className="bar-track"><div className="bar-fill" style={{ width: barWidth(selectedCreature.rgb.b, 255), background: "#6cb8ff" }} /></div>
                    <span className="rgb-value">{selectedCreature.rgb.b}</span>
                  </div>
                </div>

                <div className="mutations">
                  <span className="tag">
                    {uiText.mutationStage} {selectedCreature.mutationStage}
                  </span>
                  <br />
                  {SPECIES[selectedCreature.speciesId]?.description?.[state.locale]}
                </div>

                <div className="action-row action-row-wide">
                  <button
                    className="action"
                    disabled={state.tokens < TOKEN_COST.feed}
                    onClick={() => performAction("feed", selectedCreature)}
                  >
                    {actionText.feed} ({TOKEN_COST.feed})
                  </button>
                  <button
                    className="action"
                    disabled={state.tokens < TOKEN_COST.clean}
                    onClick={() => performAction("clean", selectedCreature)}
                  >
                    {actionText.clean} ({TOKEN_COST.clean})
                  </button>
                  <button
                    className="action"
                    disabled={state.tokens < TOKEN_COST.play}
                    onClick={() => performAction("play", selectedCreature)}
                  >
                    {actionText.play} ({TOKEN_COST.play})
                  </button>
                  <button
                    className="action"
                    disabled={state.tokens < TOKEN_COST.scan}
                    onClick={() => performAction("scan", selectedCreature)}
                  >
                    {actionText.scan} ({TOKEN_COST.scan})
                  </button>
                  <button
                    className="action"
                    disabled={state.tokens < TOKEN_COST.decorate}
                    onClick={() => performAction("decorate", selectedCreature)}
                  >
                    {actionText.decorate} ({TOKEN_COST.decorate})
                  </button>
                </div>
              </article>
            )}
          </section>

          <section className="panel creature-roster-panel">
            <h2>{uiText.creatures}</h2>
            <div className="party-track">
              {state.creatures.map((creature) => {
                const isSelected = creature.id === selectedCreature?.id;
                return (
                  <article
                    key={creature.id}
                    className={`creature-card party-card ${isSelected ? "selected" : ""}`}
                    onClick={() => selectCreature(creature.id)}
                  >
                    <div className="creature-head">
                      <div>
                        <div className="species">
                          {creature.commonName} ({SPECIES[creature.speciesId]?.rarity ?? "common"})
                        </div>
                        <div className="nickname">{creature.nickname}</div>
                      </div>
                      <button className="choose-btn" onClick={() => selectCreature(creature.id)}>
                        {isSelected ? uiText.active : uiText.select}
                      </button>
                    </div>
                    <p className="tag">
                      {uiText.emotion}: <strong>{getDominantEmotionLabel(state.locale, creature.emotion)}</strong> / {uiText.traits}:{" "}
                      {creature.traits.join(", ")}
                    </p>
                    <p className="mini-stats">
                      R{creature.rgb.r} / G{creature.rgb.g} / B{creature.rgb.b} / {uiText.mutationStage} {creature.mutationStage}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        </section>
      </div>

      <section className="panel">
        <h2>{uiText.archive}</h2>
        <div className="archive-list">
          {state.archive.length === 0 ? (
            <div className="meta">{uiText.archiveEmpty}</div>
          ) : (
            state.archive.slice(0, 12).map((entry) => (
              <div key={entry.id} className="archive-item">
                <div>
                  {entry.name} - <strong>{entry.species}</strong>
                </div>
                <div className="meta">
                  {formatDateLabel(entry.time, state.locale)} | {entry.reason} | {uiText.metaEmotion}:{" "}
                  {getEmotionLabel(state.locale, entry.emotion)}
                </div>
                <div className="meta">
                  RGB {entry.rgb.r}/{entry.rgb.g}/{entry.rgb.b} | {uiText.metaState} {entry.condition}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
