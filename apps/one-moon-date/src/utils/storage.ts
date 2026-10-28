import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeModules, Platform} from 'react-native';
import type {Language, LunarRegion} from '../types';

const LANGUAGE_STORAGE_KEY = '@onemoondate:language';
const DARK_MODE_STORAGE_KEY = '@onemoondate:darkMode';
const LUNAR_REGION_STORAGE_KEY = '@onemoondate:lunarRegion';

export const saveLanguage = async (language: Language): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    
    if (Platform.OS === 'android') {
      try {
        const LanguageStorage = NativeModules.LanguageStorage;
        if (LanguageStorage) {
          await LanguageStorage.setLanguage(language);
        }
      } catch (e) {
        console.log('네이티브 언어 저장 실패 (무시 가능):', e);
      }
    }
    
    return true;
  } catch (error) {
    console.error('언어 저장 실패:', error);
    return false;
  }
};

export const loadLanguage = async (): Promise<Language | null> => {
  try {
    if (Platform.OS === 'android') {
      try {
        const LanguageStorage = NativeModules.LanguageStorage;
        if (LanguageStorage) {
          const nativeLang = await LanguageStorage.getLanguage();
          if (nativeLang) {
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nativeLang);
            return nativeLang as Language;
          }
        }
      } catch {
        // Ignore
      }
    }
    
    const language = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return (language as Language) || null;
  } catch (error) {
    console.error('언어 불러오기 실패:', error);
    return null;
  }
};

export const saveDarkMode = async (isDark: boolean): Promise<boolean> => {
  try {
    const modeToSave = isDark ? 'dark' : 'light';
    await AsyncStorage.setItem(DARK_MODE_STORAGE_KEY, modeToSave);
    
    if (Platform.OS === 'android') {
      try {
        const LanguageStorage = NativeModules.LanguageStorage;
        if (LanguageStorage && LanguageStorage.setDarkMode) {
          await LanguageStorage.setDarkMode(isDark);
        }
      } catch (e) {
        console.log('네이티브 다크모드 저장 실패 (무시 가능):', e);
      }
    }
    
    return true;
  } catch (error) {
    console.error('다크모드 저장 실패:', error);
    return false;
  }
};

const syncLunarRegionToNative = async (region: LunarRegion): Promise<void> => {
  if (Platform.OS !== 'android') {
    return;
  }
  try {
    const LanguageStorage = NativeModules.LanguageStorage;
    if (LanguageStorage && LanguageStorage.setLunarRegion) {
      await LanguageStorage.setLunarRegion(region);
    }
  } catch {
    // 실패해도 다음 실행 때 loadLunarRegion이 다시 보낸다
  }
};

export const saveLunarRegion = async (region: LunarRegion): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(LUNAR_REGION_STORAGE_KEY, region);
    await syncLunarRegionToNative(region);
    return true;
  } catch {
    return false;
  }
};

export const loadLunarRegion = async (): Promise<LunarRegion | null> => {
  try {
    const saved = await AsyncStorage.getItem(LUNAR_REGION_STORAGE_KEY);
    const region = saved === 'kr' || saved === 'cn' ? saved : null;
    if (region) {
      syncLunarRegionToNative(region);
    }
    return region;
  } catch {
    return null;
  }
};
