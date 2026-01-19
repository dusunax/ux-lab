import type {Translation} from '../types';

export const formatSolarDate = (
  params: {month: number; day: number; weekDay: string},
  formatString: (template: string, params: Record<string, string | number>) => string,
  t?: Translation,
): string => {
  if (!t || !t.weekDayFormat) {
    return `${params.month}월 ${params.day}일 ${params.weekDay}요일`;
  }
  return formatString(t.weekDayFormat, params);
};

export const formatLunarDate = (
  params: {year: number; month: string; day: number},
  formatString: (template: string, params: Record<string, string | number>) => string,
  t?: Translation,
): string => {
  if (!t || !t.lunarDate) {
    return `음력 ${params.year}년 ${params.month}월 ${params.day}일`;
  }
  return formatString(t.lunarDate, params);
};

export const formatGanZhi = (
  params: {ganZhi: string; zodiac: string},
  formatString: (template: string, params: Record<string, string | number>) => string,
  t?: Translation,
): string => {
  if (!t || !t.ganZhiFormat) {
    return `${params.ganZhi}년 (${params.zodiac}띠)`;
  }
  return formatString(t.ganZhiFormat, params);
};

export const formatMonthHeader = (
  monthDisplay: string,
  formatString: (template: string, params: Record<string, string | number>) => string,
  t?: Translation,
): string => {
  if (!t || !t.monthFormat) {
    return `${monthDisplay}월`;
  }
  return formatString(t.monthFormat, {month: monthDisplay});
};
