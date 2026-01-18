import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors} from '../../constants/colors';
import {useI18n} from '../../i18n';
import {useDarkMode} from '../../contexts/DarkModeContext';
import {PickerSelect} from '../PickerSelect';

/**
 * 날짜 변환기 컴포넌트
 * 양력 => 음력 변환만 지원하며, 실시간으로 상단에 반영됩니다
 * @param {Object} converter - 변환기 훅에서 반환된 객체
 */
export const DateConverter = ({
  selectedYear,
  selectedMonth,
  selectedDay,
  convertError,
  yearOptions,
  monthOptions,
  dayOptions,
  setSelectedYear,
  setSelectedMonth,
  setSelectedDay,
}) => {
  const {darkMode: isDarkMode} = useDarkMode();
  const {t} = useI18n();

  if (!t) {
    return null;
  }

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <View style={styles.headerContent}>
          <Text style={styles.modeText}>
            {t.solarLabel} 
          </Text>
        </View>
      </View>

      <View style={styles.pickerRow}>
        <PickerSelect
          value={selectedYear}
          options={yearOptions}
          onSelect={setSelectedYear}
          label={t.year || ''}
          isDarkMode={isDarkMode}
        />
        <PickerSelect
          value={selectedMonth}
          options={monthOptions}
          onSelect={setSelectedMonth}
          label={t.month || ''}
          isDarkMode={isDarkMode}
        />
        <PickerSelect
          value={selectedDay}
          options={dayOptions}
          onSelect={setSelectedDay}
          label={t.day || ''}
          isDarkMode={isDarkMode}
        />
      </View>

      {convertError && <Text style={styles.errorText}>{convertError}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  containerDark: {
    borderTopColor: '#404040',
  },
  header: {
    width: '100%',
    backgroundColor: Colors.accent.blue,
    marginBottom: 12,
  },
  headerDark: {
    backgroundColor: Colors.accent.blue,
  },
  headerContent: {
    paddingVertical: 8,
    paddingHorizontal: 32,
  },
  modeText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'left',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    gap: 16,
  },
  errorText: {
    color: '#E53935',
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
});
