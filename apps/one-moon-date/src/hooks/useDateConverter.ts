import {useState, useMemo, useEffect, useCallback} from 'react';
import {solarToLunar} from '../utils/lunarCalendar';
import {
  generateYearOptions,
  generateMonthOptions,
  generateDayOptions,
} from '../utils/dateOptions';
import {useI18n} from '../i18n';
import type {LunarDate, Translation} from '../types';

interface UseDateConverterProps {
  t?: Translation;
  onLunarChange?: (lunarData: LunarDate) => void;
}

interface UseDateConverterReturn {
  selectedYear: number;
  selectedMonth: number;
  selectedDay: number;
  convertError: string;
  yearOptions: number[];
  monthOptions: number[];
  dayOptions: number[];
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
  setSelectedDay: (day: number) => void;
  setSolarDate: (year: number, month: number, day: number) => void;
}

export const useDateConverter = (
  t?: Translation,
  onLunarChange?: (lunarData: LunarDate) => void,
): UseDateConverterReturn => {
  const {getGanZhi} = useI18n();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [convertError, setConvertError] = useState('');

  const yearOptions = useMemo(() => generateYearOptions(), []);
  const monthOptions = useMemo(() => generateMonthOptions(), []);

  const dayOptions = useMemo(
    () => generateDayOptions(selectedYear, selectedMonth, 'solarToLunar', false),
    [selectedYear, selectedMonth],
  );

  useEffect(() => {
    if (!t) {
      return;
    }
    
    try {
      const result = solarToLunar(new Date(selectedYear, selectedMonth - 1, selectedDay));
      if (result) {
        const ganZhi = getGanZhi(result.year);
        const lunarData: LunarDate = {
          ...result,
          ...ganZhi,
          solarDate: new Date(selectedYear, selectedMonth - 1, selectedDay),
        };
        onLunarChange?.(lunarData);
        setConvertError('');
      } else {
        setConvertError(t?.convertError || '변환 실패');
      }
    } catch (e) {
      setConvertError(t?.convertError || '변환 실패');
    }
  }, [selectedYear, selectedMonth, selectedDay, onLunarChange, t, getGanZhi]);

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    if (selectedDay > dayOptions.length) {
      setSelectedDay(1);
    }
  };

  const setSolarDate = useCallback((year: number, month: number, day: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    setSelectedDay(day);
  }, []);

  return {
    selectedYear,
    selectedMonth,
    selectedDay,
    convertError,
    yearOptions,
    monthOptions,
    dayOptions,
    setSelectedYear,
    setSelectedMonth: handleMonthSelect,
    setSelectedDay,
    setSolarDate,
  };
};
