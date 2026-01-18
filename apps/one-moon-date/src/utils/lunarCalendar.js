/**
 * 한국 음력 변환 모듈
 * 1900년 ~ 2100년 범위의 음력 계산을 지원합니다.
 * 외부 라이브러리 없이 순수 JavaScript로 구현
 */

// 음력 데이터 테이블 (1900-2100)
// 각 연도별 16비트 데이터:
// - bit[0-3]: 윤달 (0이면 윤달 없음, 1-12이면 해당 월이 윤달)
// - bit[4-15]: 각 월의 대소 (1: 30일, 0: 29일)
const LUNAR_DATA = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910-1919
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920-1929
  0x06566, 0x0d4a0, 0x0ea50, 0x16a95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940-1949
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, // 2050-2059
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060-2069
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070-2079
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080-2089
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, // 2090-2099
  0x0d520, // 2100
];

// 기준일: 1900년 1월 31일 (음력 1900년 1월 1일)
const BASE_DATE = new Date(1900, 0, 31);
const BASE_YEAR = 1900;
const MAX_YEAR = 2100;

/**
 * 특정 음력 연도의 윤달 월을 반환
 * @param {number} year - 음력 연도
 * @returns {number} - 윤달 월 (0이면 윤달 없음)
 */
function getLeapMonth(year) {
  return LUNAR_DATA[year - BASE_YEAR] & 0xf;
}

/**
 * 특정 음력 연도의 윤달 일수를 반환
 * @param {number} year - 음력 연도
 * @returns {number} - 윤달 일수 (29 또는 30, 윤달 없으면 0)
 */
function getLeapDays(year) {
  if (getLeapMonth(year) === 0) {
    return 0;
  }
  return (LUNAR_DATA[year - BASE_YEAR] & 0x10000) ? 30 : 29;
}

/**
 * 특정 음력 연도의 총 일수를 반환
 * @param {number} year - 음력 연도
 * @returns {number} - 총 일수
 */
function getYearDays(year) {
  let sum = 348;
  let info = LUNAR_DATA[year - BASE_YEAR];

  for (let i = 0x8000; i > 0x8; i >>= 1) {
    if (info & i) {
      sum += 1;
    }
  }

  return sum + getLeapDays(year);
}

/**
 * 특정 음력 연도의 특정 월의 일수를 반환
 * @param {number} year - 음력 연도
 * @param {number} month - 음력 월 (1-12)
 * @returns {number} - 월의 일수 (29 또는 30)
 */
function getMonthDays(year, month) {
  const info = LUNAR_DATA[year - BASE_YEAR];
  return (info & (0x10000 >> month)) ? 30 : 29;
}

/**
 * 양력을 음력으로 변환
 * @param {Date|number} date - 변환할 날짜 또는 타임스탬프
 * @returns {Object} - 음력 날짜 정보
 */
export function solarToLunar(date) {
  const targetDate = date instanceof Date ? date : new Date(date);

  const year = targetDate.getFullYear();
  if (year < BASE_YEAR || year > MAX_YEAR) {
    throw new Error(`지원되는 연도 범위는 ${BASE_YEAR}-${MAX_YEAR}입니다.`);
  }

  const offset = Math.floor((targetDate - BASE_DATE) / (24 * 60 * 60 * 1000));

  if (offset < 0) {
    throw new Error('1900년 1월 31일 이전 날짜는 지원되지 않습니다.');
  }

  let days = offset;
  let lunarYear = BASE_YEAR;
  let lunarMonth = 1;
  let lunarDay = 1;
  let isLeapMonth = false;

  let yearDays;
  while (lunarYear <= MAX_YEAR && days >= (yearDays = getYearDays(lunarYear))) {
    days -= yearDays;
    lunarYear++;
  }

  const leapMonth = getLeapMonth(lunarYear);

  let monthDays;
  for (let month = 1; month <= 12; month++) {
    monthDays = getMonthDays(lunarYear, month);

    if (days < monthDays) {
      lunarMonth = month;
      lunarDay = days + 1;
      isLeapMonth = false;
      break;
    }
    days -= monthDays;

    if (month === leapMonth) {
      monthDays = getLeapDays(lunarYear);
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

/**
 * 오늘의 음력 날짜를 반환
 * @returns {Object} - 오늘의 음력 날짜 정보
 */
export function getTodayLunar() {
  return solarToLunar(new Date());
}

/**
 * 음력 날짜를 포맷팅된 문자열로 반환
 * @param {Object} lunar - 음력 날짜 객체
 * @returns {string} - 포맷팅된 문자열
 */
export function formatLunar(lunar) {
  const monthStr = lunar.isLeapMonth ? `윤${lunar.month}` : `${lunar.month}`;
  return `${lunar.year}년 ${monthStr}월 ${lunar.day}일`;
}

/**
 * 간지(干支) 계산
 * @param {number} year - 음력 연도
 * @returns {Object} - 천간, 지지, 띠 정보
 */
export function getGanZhi(year) {
  const heavenlyStems = ['경', '신', '임', '계', '갑', '을', '병', '정', '무', '기'];
  const earthlyBranches = ['신', '유', '술', '해', '자', '축', '인', '묘', '진', '사', '오', '미'];
  const zodiacAnimals = ['원숭이', '닭', '개', '돼지', '쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양'];

  const stemIndex = year % 10;
  const branchIndex = year % 12;

  return {
    stem: heavenlyStems[stemIndex],
    branch: earthlyBranches[branchIndex],
    zodiac: zodiacAnimals[branchIndex],
    ganZhi: `${heavenlyStems[stemIndex]}${earthlyBranches[branchIndex]}`,
  };
}

/**
 * 음력을 양력으로 변환
 * @param {number} lunarYear - 음력 연도
 * @param {number} lunarMonth - 음력 월 (1-12)
 * @param {number} lunarDay - 음력 일
 * @param {boolean} isLeapMonth - 윤달 여부
 * @returns {Date} - 양력 날짜
 */
export function lunarToSolar(lunarYear, lunarMonth, lunarDay, isLeapMonth = false) {
  if (lunarYear < BASE_YEAR || lunarYear > MAX_YEAR) {
    throw new Error(`지원되는 연도 범위는 ${BASE_YEAR}-${MAX_YEAR}입니다.`);
  }

  const leapMonth = getLeapMonth(lunarYear);

  if (isLeapMonth && leapMonth !== lunarMonth) {
    throw new Error(`${lunarYear}년 ${lunarMonth}월은 윤달이 아닙니다.`);
  }

  const maxDays = isLeapMonth ? getLeapDays(lunarYear) : getMonthDays(lunarYear, lunarMonth);
  if (lunarDay < 1 || lunarDay > maxDays) {
    throw new Error(`${lunarMonth}월의 일수는 1-${maxDays}일입니다.`);
  }

  let offset = 0;

  for (let year = BASE_YEAR; year < lunarYear; year++) {
    offset += getYearDays(year);
  }

  for (let month = 1; month < lunarMonth; month++) {
    offset += getMonthDays(lunarYear, month);
    if (month === leapMonth) {
      offset += getLeapDays(lunarYear);
    }
  }

  if (isLeapMonth) {
    offset += getMonthDays(lunarYear, lunarMonth);
  }

  offset += lunarDay - 1;

  const result = new Date(BASE_DATE);
  result.setDate(result.getDate() + offset);

  return result;
}

/**
 * 특정 음력 연도/월의 일수를 반환
 * @param {number} year - 음력 연도
 * @param {number} month - 음력 월
 * @param {boolean} isLeapMonth - 윤달 여부
 * @returns {number} - 해당 월의 일수
 */
export function getLunarMonthDays(year, month, isLeapMonth = false) {
  if (isLeapMonth) {
    return getLeapDays(year);
  }
  return getMonthDays(year, month);
}

/**
 * 특정 연도의 윤달 정보를 반환
 * @param {number} year - 음력 연도
 * @returns {number} - 윤달 월 (0이면 윤달 없음)
 */
export function getLeapMonthOfYear(year) {
  return getLeapMonth(year);
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
