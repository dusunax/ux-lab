import React, {createContext, useContext, useState, useEffect, useMemo, useCallback} from 'react';
import {NativeModules, Platform} from 'react-native';
import {translations, getZodiacKey} from './translations';
import {saveLanguage, loadLanguage} from '../utils/storage';

const I18nContext = createContext();

const getDeviceLanguage = () => {
  let locale = 'ko';

  if (Platform.OS === 'ios') {
    locale = NativeModules.SettingsManager?.settings?.AppleLocale ||
             NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
             'ko';
  } else {
    locale = NativeModules.I18nManager?.localeIdentifier || 'ko';
  }

  const lang = locale.substring(0, 2).toLowerCase();

  if (['ko', 'en', 'ja'].includes(lang)) {
    return lang;
  }
  return 'ko';
};

export const I18nProvider = ({children}) => {
  const [language, setLanguage] = useState(getDeviceLanguage());
  const [isLoading, setIsLoading] = useState(true);
  
  const t = useMemo(() => {
    const translation = translations[language];
    if (translation) {
      return translation;
    }
    return translations.ko || {};
  }, [language]);

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await loadLanguage();
        if (savedLanguage && ['ko', 'en', 'ja'].includes(savedLanguage)) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('언어 불러오기 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSavedLanguage();
  }, []);

  const changeLanguage = useCallback(async (lang) => {
    try {
      if (!translations[lang]) {
        console.warn(`언어 ${lang}는 지원되지 않습니다.`);
        return;
      }

      setLanguage(lang);
      saveLanguage(lang).catch((error) => {
        console.error('언어 저장 실패:', error);
      });
    } catch (error) {
      console.error('언어 변경 실패:', error);
      if (translations[lang]) {
        setLanguage(lang);
      }
    }
  }, []);

  const formatString = useCallback((template, params) => {
    if (!template || typeof template !== 'string') {
      return '';
    }
    return template.replace(/{(\w+)}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }, []);

  const getZodiac = useCallback((yearIndex) => {
    try {
      const key = getZodiacKey(yearIndex);
      const zodiac = t?.zodiac?.[key];
      return zodiac || '';
    } catch (error) {
      console.error('띠 정보 가져오기 실패:', error);
      return '';
    }
  }, [t]);

  const getGanZhi = useCallback((year) => {
    try {
      const stems = t?.ganZhi?.heavenlyStems || ['경', '신', '임', '계', '갑', '을', '병', '정', '무', '기'];
      const branches = t?.ganZhi?.earthlyBranches || ['신', '유', '술', '해', '자', '축', '인', '묘', '진', '사', '오', '미'];
      
      const stemIndex = year % 10;
      const branchIndex = year % 12;
      
      return {
        stem: stems[stemIndex] || '',
        branch: branches[branchIndex] || '',
        ganZhi: `${stems[stemIndex] || ''}${branches[branchIndex] || ''}`,
      };
    } catch (error) {
      console.error('간지 정보 가져오기 실패:', error);
      return { stem: '', branch: '', ganZhi: '' };
    }
  }, [t]);

  return (
    <I18nContext.Provider value={{
      language,
      changeLanguage,
      t,
      formatString,
      getZodiac,
      getGanZhi,
      availableLanguages: ['ko', 'en', 'ja'],
      isLoading,
    }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};
