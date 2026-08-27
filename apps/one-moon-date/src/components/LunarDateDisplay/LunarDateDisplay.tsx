import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Modal, FlatList} from 'react-native';
import {Colors} from '../../constants/colors';
import {useI18n} from '../../i18n';
import {useDarkMode} from '../../contexts/DarkModeContext';
import {getZodiacKey} from '../../i18n/translations';
import {
  formatSolarDate,
  formatLunarDate,
  formatGanZhi,
  formatMonthHeader,
} from '../../utils/dateFormatters';
import {generateYearOptions, generateDayOptions} from '../../utils/dateOptions';
import {getLunarMonthDays, getLeapMonthOfYear} from '../../utils/lunarCalendar';
import type {LunarDate} from '../../types';

interface LunarDateDisplayProps {
  lunar: LunarDate | null;
  onLunarDateSelect?: (lunarYear: number, lunarMonth: number, lunarDay: number, isLeapMonth: boolean) => void;
}

export const LunarDateDisplay = ({lunar, onLunarDateSelect}: LunarDateDisplayProps) => {
  const {darkMode: isDarkMode} = useDarkMode();
  const {t, formatString, getZodiac, getGanZhi} = useI18n();
  const [yearModalVisible, setYearModalVisible] = useState(false);
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [dayModalVisible, setDayModalVisible] = useState(false);

  if (!t || !lunar || !lunar.solarDate) {
    return null;
  }

  const weekDay = t.weekDays?.[lunar.solarDate.getDay()] || '';
  const solarMonth = lunar.solarDate.getMonth() + 1;
  const solarDay = lunar.solarDate.getDate();
  const zodiacText = getZodiac(lunar.year % 12);
  
  const getZodiacIcon = (yearIndex: number): string => {
    const icons: Record<string, string> = {
      monkey: '🐵',
      rooster: '🐔',
      dog: '🐶',
      pig: '🐷',
      rat: '🐭',
      ox: '🐂',
      tiger: '🐯',
      rabbit: '🐰',
      dragon: '🐲',
      snake: '🐍',
      horse: '🐴',
      goat: '🐐',
    };
    const key = getZodiacKey(yearIndex);
    return icons[key] || '';
  };
  const zodiacIcon = getZodiacIcon(lunar.year % 12);

  const monthDisplay = lunar.isLeapMonth
    ? `${t.leapMonth || ''}${lunar.month}`
    : `${lunar.month}`;

  const solarDateText = formatSolarDate(
    {
      month: solarMonth,
      day: solarDay,
      weekDay,
    },
    formatString,
    t,
  );

  const lunarFullText = formatLunarDate(
    {
      year: lunar.year,
      month: monthDisplay,
      day: lunar.day,
    },
    formatString,
    t,
  );

  const currentGanZhi = getGanZhi(lunar.year);
  const ganZhiText = formatGanZhi(
    {
      ganZhi: currentGanZhi.ganZhi,
      zodiac: zodiacText,
    },
    formatString,
    t,
  );

  const monthHeaderText = formatMonthHeader(monthDisplay, formatString, t);

  const yearOptions = generateYearOptions();
  const monthOptions = Array.from({length: 12}, (_, i) => i + 1);
  const dayOptions = generateDayOptions(lunar.year, lunar.month, 'lunarToSolar', lunar.isLeapMonth);

  const handleYearSelect = (year: number) => {
    setYearModalVisible(false);
    if (onLunarDateSelect) {
      const newLeapMonth = getLeapMonthOfYear(year);
      const isLeap = newLeapMonth === lunar.month;
      const maxDays = getLunarMonthDays(year, lunar.month, isLeap);
      onLunarDateSelect(year, lunar.month, Math.min(lunar.day, maxDays), isLeap);
    }
  };

  const handleMonthSelect = (month: number) => {
    setMonthModalVisible(false);
    if (onLunarDateSelect) {
      const newLeapMonth = getLeapMonthOfYear(lunar.year);
      const isLeap = newLeapMonth === month;
      const maxDays = getLunarMonthDays(lunar.year, month, isLeap);
      onLunarDateSelect(lunar.year, month, Math.min(lunar.day, maxDays), isLeap);
    }
  };

  const handleDaySelect = (day: number) => {
    setDayModalVisible(false);
    if (onLunarDateSelect) {
      onLunarDateSelect(lunar.year, lunar.month, day, lunar.isLeapMonth);
    }
  };

  const renderPickerModal = (
    visible: boolean,
    setVisible: (visible: boolean) => void,
    options: number[],
    selectedValue: number,
    onSelect: (value: number) => void,
    title: string,
  ) => {
    const initialScrollIndex = Math.max(0, options.indexOf(selectedValue) - 3);
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}>
          <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.textDark]}>{title}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.toString()}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    item === selectedValue && styles.modalItemSelected,
                  ]}
                  onPress={() => onSelect(item)}>
                  <Text
                    style={[
                      styles.modalItemText,
                      isDarkMode && styles.textDark,
                      item === selectedValue && styles.modalItemTextSelected,
                    ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              initialScrollIndex={initialScrollIndex}
              getItemLayout={(_, index) => ({length: 56, offset: 56 * index, index})}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <View style={styles.content}>
      <View style={styles.yearPickerWrapper}>
        <TouchableOpacity
          style={[styles.yearPickerButton, isDarkMode && styles.yearPickerButtonDark]}
          onPress={() => onLunarDateSelect && setYearModalVisible(true)}
          activeOpacity={0.7}>
          <Text style={[styles.yearPickerText, isDarkMode && styles.textDark]}>
            {lunar.year}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, isDarkMode && styles.cardDark]}>
        <TouchableOpacity
          style={styles.monthHeader}
          onPress={() => onLunarDateSelect && setMonthModalVisible(true)}
          activeOpacity={0.7}>
          <Text style={styles.monthText}>{monthHeaderText}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dayContainer}
          onPress={() => onLunarDateSelect && setDayModalVisible(true)}
          activeOpacity={0.7}>
          <Text style={[styles.dayText, isDarkMode && styles.textDark]}>
            {lunar.day}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.fullDate, isDarkMode && styles.textMuted]}>
        {lunarFullText}
      </Text>

      <View style={styles.ganZhiContainer}>
        <Text style={[styles.ganZhiText, isDarkMode && styles.textMuted]}>
          {ganZhiText}
        </Text>
        {zodiacIcon && (
          <Text style={styles.zodiacIcon}>{zodiacIcon}</Text>
        )}
      </View>

      <Text style={[styles.solarDate, isDarkMode && styles.textMuted]}>
        {t.solarLabel || '양력'} {solarDateText}
      </Text>

      {renderPickerModal(
        yearModalVisible,
        setYearModalVisible,
        yearOptions,
        lunar.year,
        handleYearSelect,
        t.year || '년',
      )}
      {renderPickerModal(
        monthModalVisible,
        setMonthModalVisible,
        monthOptions,
        lunar.month,
        handleMonthSelect,
        t.month || '월',
      )}
      {renderPickerModal(
        dayModalVisible,
        setDayModalVisible,
        dayOptions,
        lunar.day,
        handleDaySelect,
        t.day || '일',
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  card: {
    width: 240,
    backgroundColor: Colors.card.light,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.shadow.color,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: Colors.shadow.opacity.light,
    shadowRadius: 12,
    elevation: 8,
  },
  cardDark: {
    backgroundColor: Colors.card.dark,
    shadowOpacity: Colors.shadow.opacity.dark,
  },
  monthHeader: {
    backgroundColor: Colors.accent.blue,
    paddingVertical: 10,
    alignItems: 'center',
  },
  monthText: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 2,
  },
  dayContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  dayText: {
    fontSize: 124,
    fontWeight: '300',
    color: Colors.text.primary.light,
    lineHeight: 124,
  },
  textDark: {
    color: Colors.text.primary.dark,
  },
  textMuted: {
    color: Colors.text.muted,
  },
  fullDate: {
    fontSize: 24,
    color: Colors.text.light,
    marginTop: 16,
    fontWeight: '500',
  },
  ganZhiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  ganZhiText: {
    fontSize: 24,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  zodiacIcon: {
    fontSize: 24,
    marginLeft: 8,
  },
  solarDate: {
    fontSize: 24,
    color: Colors.text.muted,
    marginTop: 4,
    fontWeight: '500',
  },
  yearPickerWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  yearPickerButton: {
    width: '100%',
    maxWidth: 240,
    height: 56,
    borderWidth: 2,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  yearPickerButtonDark: {
    backgroundColor: '#1A1A1A',
    borderColor: '#404040',
  },
  yearPickerText: {
    fontSize: 32,
    color: Colors.text.primary.light,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 240,
    maxHeight: 400,
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalContentDark: {
    backgroundColor: Colors.card.dark,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary.light,
    padding: 16,
    paddingBottom: 8,
    textAlign: 'center',
  },
  modalItem: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalItemSelected: {
    backgroundColor: Colors.accent.blue + '20',
  },
  modalItemText: {
    fontSize: 24,
    color: Colors.text.primary.light,
  },
  modalItemTextSelected: {
    color: Colors.accent.blue,
    fontWeight: '600',
  },
});
