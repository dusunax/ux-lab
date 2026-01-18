/**
 * 언어 및 설정 저장 유틸리티
 * React Native와 Android 위젯 간 동기화를 위한 공통 저장소
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeModules, Platform} from 'react-native';

const LANGUAGE_STORAGE_KEY = '@onemoondate:language';
const DARK_MODE_STORAGE_KEY = '@onemoondate:darkMode';

/**
 * 언어 저장 (React Native와 Android SharedPreferences 동기화)
 */
export const saveLanguage = async (language) => {
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

/**
 * 언어 불러오기
 */
export const loadLanguage = async () => {
  try {
    if (Platform.OS === 'android') {
      try {
        const LanguageStorage = NativeModules.LanguageStorage;
        if (LanguageStorage) {
          const nativeLang = await LanguageStorage.getLanguage();
          if (nativeLang) {
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nativeLang);
            return nativeLang;
          }
        }
      } catch (e) {
      }
    }
    
    const language = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return language || null;
  } catch (error) {
    console.error('언어 불러오기 실패:', error);
    return null;
  }
};

/**
 * 다크모드 저장 (React Native와 Android 위젯 동기화)
 */
export const saveDarkMode = async (isDark) => {
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
