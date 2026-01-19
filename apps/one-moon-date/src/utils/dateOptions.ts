import {getLunarMonthDays, getLeapMonthOfYear} from './lunarCalendar';

const YEAR_MIN = 1900;
const YEAR_MAX = 2100;
const MONTH_MIN = 1;
const MONTH_MAX = 12;

export const generateYearOptions = (): number[] => {
  const years: number[] = [];
  for (let y = YEAR_MIN; y <= YEAR_MAX; y++) {
    years.push(y);
  }
  return years;
};

export const generateMonthOptions = (): number[] => {
  const months: number[] = [];
  for (let m = MONTH_MIN; m <= MONTH_MAX; m++) {
    months.push(m);
  }
  return months;
};

export const generateDayOptions = (
  selectedYear: number,
  selectedMonth: number,
  conversionMode: 'solarToLunar' | 'lunarToSolar',
  isLeapMonth: boolean,
): number[] => {
  let daysInMonth: number;
  
  if (conversionMode === 'solarToLunar') {
    daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  } else {
    daysInMonth = getLunarMonthDays(selectedYear, selectedMonth, isLeapMonth) || 30;
  }
  
  const days: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }
  return days;
};

export const getLeapMonth = (
  selectedYear: number,
  conversionMode: 'solarToLunar' | 'lunarToSolar',
): number => {
  if (conversionMode === 'lunarToSolar') {
    return getLeapMonthOfYear(selectedYear);
  }
  return 0;
};

export const canBeLeapMonth = (
  conversionMode: 'solarToLunar' | 'lunarToSolar',
  leapMonthOfYear: number,
  selectedMonth: number,
): boolean => {
  return conversionMode === 'lunarToSolar' && leapMonthOfYear === selectedMonth;
};
