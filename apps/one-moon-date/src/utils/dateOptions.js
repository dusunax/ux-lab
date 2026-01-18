import {getLunarMonthDays, getLeapMonthOfYear} from './lunarCalendar';

/**
 * 날짜 옵션 생성 유틸리티 함수들
 */

const YEAR_MIN = 1900;
const YEAR_MAX = 2100;
const MONTH_MIN = 1;
const MONTH_MAX = 12;

/**
 * 연도 옵션 배열을 생성합니다
 * @returns {number[]} 연도 배열 (1900-2100)
 */
export const generateYearOptions = () => {
  const years = [];
  for (let y = YEAR_MIN; y <= YEAR_MAX; y++) {
    years.push(y);
  }
  return years;
};

/**
 * 월 옵션 배열을 생성합니다
 * @returns {number[]} 월 배열 (1-12)
 */
export const generateMonthOptions = () => {
  const months = [];
  for (let m = MONTH_MIN; m <= MONTH_MAX; m++) {
    months.push(m);
  }
  return months;
};

/**
 * 일 옵션 배열을 생성합니다
 * @param {number} selectedYear - 선택된 연도
 * @param {number} selectedMonth - 선택된 월
 * @param {string} conversionMode - 변환 모드 ('solarToLunar' | 'lunarToSolar')
 * @param {boolean} isLeapMonth - 윤달 여부
 * @returns {number[]} 일 배열
 */
export const generateDayOptions = (
  selectedYear,
  selectedMonth,
  conversionMode,
  isLeapMonth,
) => {
  let daysInMonth;
  
  if (conversionMode === 'solarToLunar') {
    daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  } else {
    daysInMonth = getLunarMonthDays(selectedYear, selectedMonth, isLeapMonth) || 30;
  }
  
  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }
  return days;
};

/**
 * 해당 연도에 윤달이 있는지 확인합니다
 * @param {number} selectedYear - 선택된 연도
 * @param {string} conversionMode - 변환 모드
 * @returns {number} 윤달이 있는 월 (없으면 0)
 */
export const getLeapMonth = (selectedYear, conversionMode) => {
  if (conversionMode === 'lunarToSolar') {
    return getLeapMonthOfYear(selectedYear);
  }
  return 0;
};

/**
 * 선택한 월이 윤달이 가능한지 확인합니다
 * @param {string} conversionMode - 변환 모드
 * @param {number} leapMonthOfYear - 해당 연도의 윤달 월
 * @param {number} selectedMonth - 선택된 월
 * @returns {boolean} 윤달 가능 여부
 */
export const canBeLeapMonth = (conversionMode, leapMonthOfYear, selectedMonth) => {
  return conversionMode === 'lunarToSolar' && leapMonthOfYear === selectedMonth;
};
