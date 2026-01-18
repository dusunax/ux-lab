import React, {createContext, useContext, useState, useEffect, useCallback} from 'react';
import {Appearance, useColorScheme} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {saveDarkMode} from '../utils/storage';

const DARK_MODE_STORAGE_KEY = '@onemoondate:darkMode';

const DarkModeContext = createContext();

/**
 * 다크모드 Context Provider
 */
export const DarkModeProvider = ({children}) => {
  const systemColorScheme = useColorScheme();
  const [darkMode, setDarkMode] = useState(systemColorScheme === 'dark');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDarkMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(DARK_MODE_STORAGE_KEY);
        if (savedMode !== null) {
          if (savedMode === 'auto') {
            setDarkMode(systemColorScheme === 'dark');
          } else {
            const isDark = savedMode === 'dark';
            setDarkMode(isDark);
            Appearance.setColorScheme(isDark ? 'dark' : 'light');
            saveDarkMode(isDark).catch((e) => {
              console.log('다크모드 네이티브 동기화 실패 (무시 가능):', e);
            });
          }
        } else {
          setDarkMode(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.error('다크모드 설정 불러오기 실패:', error);
        setDarkMode(systemColorScheme === 'dark');
      } finally {
        setIsLoading(false);
      }
    };

    loadDarkMode();
  }, [systemColorScheme]);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({colorScheme}) => {
      AsyncStorage.getItem(DARK_MODE_STORAGE_KEY).then((savedMode) => {
        if (savedMode === 'auto' || savedMode === null) {
          setDarkMode(colorScheme === 'dark');
        }
      });
    });

    return () => subscription.remove();
  }, []);

  /**
   * 다크모드 전환
   */
  const toggleDarkMode = useCallback(async () => {
    try {
      const newMode = !darkMode;
      setDarkMode(newMode);
      Appearance.setColorScheme(newMode ? 'dark' : 'light');
      saveDarkMode(newMode).catch((error) => {
        console.error('다크모드 저장 실패:', error);
      });
    } catch (error) {
      console.error('다크모드 전환 실패:', error);
    }
  }, [darkMode]);

  return (
    <DarkModeContext.Provider value={{darkMode, isLoading, toggleDarkMode}}>
      {children}
    </DarkModeContext.Provider>
  );
};

/**
 * 다크모드 Context를 사용하는 훅
 */
export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within DarkModeProvider');
  }
  return context;
};
