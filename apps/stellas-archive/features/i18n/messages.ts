import type { ActionText, EmotionType, InterfaceText, MissionText } from "../game/engine";

export type MessageCatalog = {
  ui: Record<string, string>;
  page: Record<string, string>;
  game: Record<string, string>;
  emotionText: Record<EmotionType, string>;
  interfaceText: InterfaceText;
  actionText: ActionText;
  missionText: MissionText;
  species: Record<string, { description: string }>;
};
