import i18next, { type Resource } from "i18next";
import type { MessageCatalog } from "./messages";
import { en as enMessages } from "./en";
import { ko as koMessages } from "./ko";

export enum SupportedLocale {
  En = "en",
  Ko = "ko",
}

export type Locale = SupportedLocale;

export const DEFAULT_LOCALE: Locale = SupportedLocale.En;

export const SUPPORTED_LOCALES = [
  SupportedLocale.En,
  SupportedLocale.Ko,
] as const satisfies readonly Locale[];

export const MESSAGE_CATALOGS: Record<Locale, MessageCatalog> = {
  [SupportedLocale.En]: enMessages,
  [SupportedLocale.Ko]: koMessages,
};
const toI18nTranslation = (catalog: MessageCatalog): Record<string, string> => ({
  ...catalog.ui,
  ...catalog.page,
  ...catalog.game,
});

export const isSupportedLocale = (value: unknown): value is Locale =>
  typeof value === "string" && value in MESSAGE_CATALOGS;

export const normalizeLocale = (
  value: unknown,
  fallback: Locale = DEFAULT_LOCALE,
): Locale => (isSupportedLocale(value) ? value : fallback);

export const getActiveLocale = (fallback: Locale = DEFAULT_LOCALE): Locale =>
  normalizeLocale(i18next.resolvedLanguage || i18next.language, fallback);

export const getCatalog = (locale: Locale): MessageCatalog =>
  MESSAGE_CATALOGS[locale];

export const createI18nResources = (): Resource =>
  Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [
      locale,
      { translation: toI18nTranslation(MESSAGE_CATALOGS[locale]) },
    ]),
  );

let initialized = false;

export const initI18n = async () => {
  if (initialized || i18next.isInitialized) return i18next;

  await i18next.init({
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: SUPPORTED_LOCALES,
    resources: createI18nResources(),
    interpolation: {
      escapeValue: false,
      prefix: "{",
      suffix: "}",
    },
  });

  initialized = true;
  return i18next;
};

export { i18next };
