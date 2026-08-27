export type Language = 'ko' | 'en' | 'ja';

export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  solarDate: Date;
  stem?: string;
  branch?: string;
  ganZhi?: string;
}

export interface GanZhi {
  stem: string;
  branch: string;
  ganZhi: string;
}

export interface Zodiac {
  rat: string;
  ox: string;
  tiger: string;
  rabbit: string;
  dragon: string;
  snake: string;
  horse: string;
  goat: string;
  monkey: string;
  rooster: string;
  dog: string;
  pig: string;
}

export interface GanZhiData {
  heavenlyStems: string[];
  earthlyBranches: string[];
}

export interface Translation {
  loading: string;
  weekDays: string[];
  weekDayFormat: string;
  monthFormat: string;
  lunarDate: string;
  solarLabel: string;
  ganZhiFormat: string;
  solarToLunar: string;
  year: string;
  month: string;
  day: string;
  convertError: string;
  leapMonth: string;
  zodiac: Zodiac;
  ganZhi: GanZhiData;
}

export interface Translations {
  ko: Translation;
  en: Translation;
  ja: Translation;
}

export interface DateOption {
  label: string;
  value: number;
}

export interface I18nContextValue {
  language: Language;
  changeLanguage: (lang: Language) => Promise<void>;
  t: Translation;
  formatString: (template: string, params: Record<string, string | number>) => string;
  getZodiac: (yearIndex: number) => string;
  getGanZhi: (year: number) => GanZhi;
  availableLanguages: Language[];
  isLoading: boolean;
}

export interface DarkModeContextValue {
  darkMode: boolean;
  isLoading: boolean;
  toggleDarkMode: () => Promise<void>;
}

export interface LanguageStorageModule {
  setLanguage: (language: string) => Promise<void>;
  getLanguage: () => Promise<string | null>;
  setDarkMode?: (isDark: boolean) => Promise<void>;
}

declare module 'react-native' {
  interface NativeModulesStatic {
    LanguageStorage: LanguageStorageModule;
    SettingsManager?: {
      settings?: {
        AppleLocale?: string;
        AppleLanguages?: string[];
      };
    };
    I18nManager?: {
      localeIdentifier?: string;
    };
  }
}
