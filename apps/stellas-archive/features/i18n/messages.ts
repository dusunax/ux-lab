import type { ActionText, EmotionType, InterfaceText, MissionText } from "../game/engine";

export type MessageMap = Record<string, string>;
export type MessageCatalog = {
  ui: MessageMap;
  page: MessageMap;
  game: MessageMap;
  emotionText: Record<EmotionType, string>;
  interfaceText: InterfaceText;
  actionText: ActionText;
  missionText: MissionText;
};

export const getFlatTranslation = (catalog: MessageCatalog): MessageMap => {
  return {
    ...catalog.ui,
    ...catalog.page,
    ...catalog.game,
  };
};

export const getI18nResourceBundle = (catalog: MessageCatalog) => ({
  translation: getFlatTranslation(catalog),
});

export type I18nResource = ReturnType<typeof getI18nResourceBundle>;
