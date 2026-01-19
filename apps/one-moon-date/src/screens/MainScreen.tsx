import React, {useState, useCallback} from 'react';
import {ScrollView, StatusBar, RefreshControl, StyleSheet, View, Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors} from '../constants/colors';
import {useLunarDate} from '../hooks/useLunarDate';
import {useDateConverter} from '../hooks/useDateConverter';
import {useI18n} from '../i18n';
import {useDarkMode} from '../contexts/DarkModeContext';
import {LoadingScreen} from '../components/LoadingScreen';
import {LanguageSelector} from '../components/LanguageSelector';
import {DarkModeToggle} from '../components/DarkModeToggle/DarkModeToggle';
import {LunarDateDisplay} from '../components/LunarDateDisplay';
import {DateConverter} from '../components/DateConverter';
import {lunarToSolar} from '../utils/lunarCalendar';
import type {LunarDate} from '../types';

export const MainScreen = () => {
  const {darkMode: isDarkMode} = useDarkMode();
  const {t, isLoading: i18nLoading} = useI18n();
  const {lunar: defaultLunar, refreshing, onRefresh} = useLunarDate();
  const [converterLunar, setConverterLunar] = useState<LunarDate | null>(null);
  
  const handleLunarChange = useCallback((lunarData: LunarDate) => {
    setConverterLunar(lunarData);
  }, []);
  
  const converter = useDateConverter(t, handleLunarChange);
  const displayLunar = converterLunar || defaultLunar;

  const handleLunarDateSelect = useCallback((lunarYear: number, lunarMonth: number, lunarDay: number, isLeapMonth: boolean) => {
    try {
      const solarDate = lunarToSolar(lunarYear, lunarMonth, lunarDay, isLeapMonth);
      converter.setSolarDate(
        solarDate.getFullYear(),
        solarDate.getMonth() + 1,
        solarDate.getDate(),
      );
    } catch (error) {
      console.error('음력 날짜 변환 실패:', error);
    }
  }, [converter]);

  if (!t || i18nLoading || !displayLunar) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? Colors.background.dark : Colors.background.light}
      />
      
      <View style={styles.headerContainer}>
        <LanguageSelector />
        <View style={styles.darkModeContainer}>
          <DarkModeToggle />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDarkMode ? Colors.text.primary.dark : Colors.accent.blue}
            colors={[Colors.accent.blue]}
          />
        }>
        <LunarDateDisplay lunar={displayLunar} onLunarDateSelect={handleLunarDateSelect} />
        <DateConverter {...converter} />
        <View style={styles.copyrightContainer}>
          <Text style={[styles.copyrightText, isDarkMode && styles.copyrightTextDark]}>
            © 2026 All Rights Reserved
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
  },
  containerDark: {
    backgroundColor: Colors.background.dark,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingRight: 16,
    gap: 12,
  },
  darkModeContainer: {
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 40,
    paddingBottom: 0,
  },
  copyrightContainer: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  copyrightText: {
    fontSize: 10,
    color: Colors.text.muted,
    fontWeight: '500',
  },
  copyrightTextDark: {
    color: Colors.text.muted,
  },
  copyrightSubtext: {
    fontSize: 11,
    color: Colors.text.muted,
    marginTop: 4,
    opacity: 0.8,
  },
  copyrightSubtextDark: {
    color: Colors.text.muted,
  },
});
