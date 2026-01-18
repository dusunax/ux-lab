import {useState, useMemo, useEffect, useCallback} from 'react';
import {solarToLunar} from '../utils/lunarCalendar';
import {
  generateYearOptions,
  generateMonthOptions,
  generateDayOptions,
} from '../utils/dateOptions';
import {useI18n} from '../i18n';

/**
 * 날짜 변환 기능을 관리하는 커스텀 훅
 * 양력 => 음력 변환만 지원하며, 실시간으로 변환 결과를 계산합니다
 * @param {Object} t - 번역 객체
 * @param {Function} onLunarChange - 음력 날짜가 변경될 때 호출되는 콜백
 * @returns {Object} 변환 관련 상태 및 함수들
 */
export const useDateConverter = (t, onLunarChange) => {
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
        const lunarData = {
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

  /**
   * 월 선택 시 일이 범위를 벗어나면 초기화합니다
   */
  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
    if (selectedDay > dayOptions.length) {
      setSelectedDay(1);
    }
  };

  const setSolarDate = useCallback((year, month, day) => {
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
