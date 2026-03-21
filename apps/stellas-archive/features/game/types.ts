import type { SupportedLocale } from "../i18n/i18n";

export type Locale = SupportedLocale;

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

export type FeedItemStateDelta = {
  hunger?: number;
  cleanliness?: number;
  affection?: number;
  energy?: number;
};

export type FeedItem = {
  id: string;
  name: Record<Locale, string>;
  description?: Record<Locale, string>;
  stateDelta: FeedItemStateDelta;
  rgbDelta: Partial<RGB>;
  symbolColor?: string;
  stock: number;
};

export type FeedInventory = Record<string, number>;

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
  visualProfile: LuminaVisualProfile;
};

export type LuminaRingProfile = {
  count: number;
  intensity: number;
  spacing: number;
  scale?: number;
  satellites: LuminaSatelliteProfile;
};

export type LuminaFlickerProfile = {
  intensity: number;
};

export type LuminaVisualProfile = {
  rings: LuminaRingProfile;
  flicker: LuminaFlickerProfile;
};

export type LuminaSatelliteProfile = {
  count: number;
  intensity: number;
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
  feedInventory: FeedInventory;
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
  noEnergy: string;
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
  noFeed: string;
  feedDetails: string;
  noDescription: string;
  stock: string;
  stateChange: string;
  colorShift: string;
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

export type GameMockupSpecies = Omit<Species, "id" | "traits"> & {
  id: string;
  speciesId: string;
  traits: string[];
};

export type GameMockupMutationConditionType = "verdant_echo" | "azure_shell" | "feral_spark" | "prism_core";

export type GameMockupMutation = {
  id: string;
  name: string;
  resultSpeciesId: string;
  rarity: Species["rarity"];
  message: Record<Locale, string>;
  conditionType: GameMockupMutationConditionType;
};

export type GameMockupDataDocument = {
  species: Record<string, GameMockupSpecies>;
  mutationRules: Record<string, GameMockupMutation>;
};

export type GameMockupNoSqlData = {
  dataVersion: 1;
  defaultVisualProfile: LuminaVisualProfile;
  starterIds: string[];
  feeds: Record<string, FeedItem>;
  species: GameMockupDataDocument["species"];
  mutationRules: GameMockupDataDocument["mutationRules"];
  starterNicknames: string[];
};

export type GameMockupData = {
  dataVersion: 1;
  defaultVisualProfile: LuminaVisualProfile;
  starterIds: string[];
  starterNicknames: string[];
  feeds: Record<string, FeedItem>;
  species: Record<string, GameMockupSpecies>;
  mutationRules: Record<string, GameMockupMutation>;
};
