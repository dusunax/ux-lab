import type {LunarDate, LunarRegion} from '../types';

// 음력 테이블 (LunarCalculator.java와 동일하게 유지)
const LUNAR_DATA_KR: number[] = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x0da95, 0x0b550, 0x056a0, 0x0ada2, 0x095d0, 0x04bb7,
  0x049b0, 0x0a4b0, 0x0b4b5, 0x06a90, 0x0ad40, 0x0bb54, 0x02b60, 0x095b0, 0x05372, 0x04970,
  0x06566, 0x0e4a0, 0x0ea50, 0x16a95, 0x05b50, 0x02b60, 0x18ae3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b690, 0x056d0, 0x125b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0d557,
  0x0b4a0, 0x0b550, 0x15555, 0x04db0, 0x025b0, 0x18573, 0x052b0, 0x0a9b8, 0x06950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05270, 0x07263, 0x0d950, 0x06b57, 0x056a0,
  0x09ad0, 0x04dd5, 0x04ae0, 0x0a4e0, 0x0d4d4, 0x0d250, 0x0d598, 0x0b540, 0x0d6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a9b4, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0b756, 0x02b60, 0x095b0,
  0x04b75, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06d98, 0x05ad0, 0x02b60, 0x096e5, 0x092e0,
  0x0c960, 0x0e954, 0x0d4a0, 0x0da50, 0x07552, 0x056c0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x1b4a3, 0x0b550, 0x055d9, 0x04ba0, 0x0a5b0, 0x05575, 0x052b0, 0x0a950,
  0x0b954, 0x06aa0, 0x0ad50, 0x06b52, 0x04b60, 0x0a6e6, 0x0a570, 0x05270, 0x06a65, 0x0d930,
  0x05aa0, 0x0b6a3, 0x096d0, 0x04afb, 0x04ae0, 0x0a4d0, 0x1d0d6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b6a0, 0x096d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0b250, 0x1b255, 0x06d40, 0x0ada0,
  0x18b63, 0x09570, 0x14978, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1aac4, 0x0ab60,
  0x09370, 0x052e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0aad0, 0x095d4,
  0x092d0, 0x0c9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b2b3, 0x0a930, 0x07557, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054f4, 0x05260,
  0x0e968, 0x0d530, 0x05aa0, 0x1aaa6, 0x096d0, 0x04ae0, 0x0aae4, 0x0a4d0, 0x0d260, 0x0f253,
  0x0d520,
];

const LUNAR_DATA_CN: number[] = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x16a95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
  0x0d520,
];

const LUNAR_TABLES: Record<LunarRegion, number[]> = {
  kr: LUNAR_DATA_KR,
  cn: LUNAR_DATA_CN,
};

const BASE_DATE = new Date(1900, 0, 31);
const BASE_UTC = Date.UTC(1900, 0, 31);
const BASE_YEAR = 1900;
const MAX_YEAR = 2100;

function getLeapMonth(data: number[], year: number): number {
  return data[year - BASE_YEAR] & 0xf;
}

function getLeapDays(data: number[], year: number): number {
  if (getLeapMonth(data, year) === 0) {
    return 0;
  }
  return (data[year - BASE_YEAR] & 0x10000) ? 30 : 29;
}

function getYearDays(data: number[], year: number): number {
  let sum = 348;
  const info = data[year - BASE_YEAR];

  for (let i = 0x8000; i > 0x8; i >>= 1) {
    if (info & i) {
      sum += 1;
    }
  }

  return sum + getLeapDays(data, year);
}

function getMonthDays(data: number[], year: number, month: number): number {
  const info = data[year - BASE_YEAR];
  return (info & (0x10000 >> month)) ? 30 : 29;
}

export function solarToLunar(date: Date | number, region: LunarRegion = 'kr'): LunarDate {
  const data = LUNAR_TABLES[region];
  const targetDate = date instanceof Date ? date : new Date(date);

  const year = targetDate.getFullYear();
  if (year < BASE_YEAR || year > MAX_YEAR) {
    throw new Error(`지원되는 연도 범위는 ${BASE_YEAR}-${MAX_YEAR}입니다.`);
  }

  // 시간대 오프셋이 시대마다 달라(서울 1900년 UTC+8:27) 밀리초 차이 대신 달력 날짜로 일수를 센다
  const targetUtc = Date.UTC(year, targetDate.getMonth(), targetDate.getDate());
  const offset = (targetUtc - BASE_UTC) / (24 * 60 * 60 * 1000);

  if (offset < 0) {
    throw new Error('1900년 1월 31일 이전 날짜는 지원되지 않습니다.');
  }

  let days = offset;
  let lunarYear = BASE_YEAR;
  let lunarMonth = 1;
  let lunarDay = 1;
  let isLeapMonth = false;

  let yearDays: number;
  while (lunarYear <= MAX_YEAR && days >= (yearDays = getYearDays(data, lunarYear))) {
    days -= yearDays;
    lunarYear++;
  }

  const leapMonth = getLeapMonth(data, lunarYear);

  let monthDays: number;
  for (let month = 1; month <= 12; month++) {
    monthDays = getMonthDays(data, lunarYear, month);

    if (days < monthDays) {
      lunarMonth = month;
      lunarDay = days + 1;
      isLeapMonth = false;
      break;
    }
    days -= monthDays;

    if (month === leapMonth) {
      monthDays = getLeapDays(data, lunarYear);
      if (days < monthDays) {
        lunarMonth = month;
        lunarDay = days + 1;
        isLeapMonth = true;
        break;
      }
      days -= monthDays;
    }
  }

  return {
    year: lunarYear,
    month: lunarMonth,
    day: lunarDay,
    isLeapMonth,
    leapMonth,
  };
}

export function getTodayLunar(region: LunarRegion = 'kr'): LunarDate {
  return solarToLunar(new Date(), region);
}

export function formatLunar(lunar: LunarDate): string {
  const monthStr = lunar.isLeapMonth ? `윤${lunar.month}` : `${lunar.month}`;
  return `${lunar.year}년 ${monthStr}월 ${lunar.day}일`;
}

export function getGanZhi(year: number): {stem: string; branch: string; zodiac: string; ganZhi: string} {
  const heavenlyStems = ['경', '신', '임', '계', '갑', '을', '병', '정', '무', '기'];
  const earthlyBranches = ['신', '유', '술', '해', '자', '축', '인', '묘', '진', '사', '오', '미'];
  const zodiacAnimals = ['원숭이', '닭', '개', '돼지', '쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양'];

  const stemIndex = year % 10;
  const branchIndex = year % 12;

  return {
    stem: heavenlyStems[stemIndex] || '',
    branch: earthlyBranches[branchIndex] || '',
    zodiac: zodiacAnimals[branchIndex] || '',
    ganZhi: `${heavenlyStems[stemIndex] || ''}${earthlyBranches[branchIndex] || ''}`,
  };
}

export function lunarToSolar(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
  isLeapMonth = false,
  region: LunarRegion = 'kr',
): Date {
  const data = LUNAR_TABLES[region];
  if (lunarYear < BASE_YEAR || lunarYear > MAX_YEAR) {
    throw new Error(`지원되는 연도 범위는 ${BASE_YEAR}-${MAX_YEAR}입니다.`);
  }

  const leapMonth = getLeapMonth(data, lunarYear);

  if (isLeapMonth && leapMonth !== lunarMonth) {
    throw new Error(`${lunarYear}년 ${lunarMonth}월은 윤달이 아닙니다.`);
  }

  const maxDays = isLeapMonth ? getLeapDays(data, lunarYear) : getMonthDays(data, lunarYear, lunarMonth);
  if (lunarDay < 1 || lunarDay > maxDays) {
    throw new Error(`${lunarMonth}월의 일수는 1-${maxDays}일입니다.`);
  }

  let offset = 0;

  for (let year = BASE_YEAR; year < lunarYear; year++) {
    offset += getYearDays(data, year);
  }

  for (let month = 1; month < lunarMonth; month++) {
    offset += getMonthDays(data, lunarYear, month);
    if (month === leapMonth) {
      offset += getLeapDays(data, lunarYear);
    }
  }

  if (isLeapMonth) {
    offset += getMonthDays(data, lunarYear, lunarMonth);
  }

  offset += lunarDay - 1;

  const result = new Date(BASE_DATE);
  result.setDate(result.getDate() + offset);

  return result;
}

export function getLunarMonthDays(
  year: number,
  month: number,
  isLeapMonth = false,
  region: LunarRegion = 'kr',
): number {
  const data = LUNAR_TABLES[region];
  if (isLeapMonth) {
    return getLeapDays(data, year);
  }
  return getMonthDays(data, year, month);
}

export function getLeapMonthOfYear(year: number, region: LunarRegion = 'kr'): number {
  return getLeapMonth(LUNAR_TABLES[region], year);
}

export default {
  solarToLunar,
  lunarToSolar,
  getTodayLunar,
  formatLunar,
  getGanZhi,
  getLunarMonthDays,
  getLeapMonthOfYear,
};
