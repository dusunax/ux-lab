/**
 * 날짜 포맷팅 유틸리티 함수들
 */

/**
 * 양력 날짜를 포맷팅합니다
 * @param {Object} params - 포맷팅 파라미터
 * @param {number} params.month - 월
 * @param {number} params.day - 일
 * @param {string} params.weekDay - 요일
 * @param {Function} formatString - i18n 포맷팅 함수
 * @param {Object} t - 번역 객체
 * @returns {string} 포맷팅된 날짜 문자열
 */
export const formatSolarDate = (params, formatString, t) => {
  if (!t || !t.weekDayFormat) {
    return `${params.month}월 ${params.day}일 ${params.weekDay}요일`;
  }
  return formatString(t.weekDayFormat, params);
};

/**
 * 음력 날짜를 포맷팅합니다
 * @param {Object} params - 포맷팅 파라미터
 * @param {number} params.year - 연도
 * @param {string} params.month - 월 (윤달 포함)
 * @param {number} params.day - 일
 * @param {Function} formatString - i18n 포맷팅 함수
 * @param {Object} t - 번역 객체
 * @returns {string} 포맷팅된 날짜 문자열
 */
export const formatLunarDate = (params, formatString, t) => {
  if (!t || !t.lunarDate) {
    return `음력 ${params.year}년 ${params.month}월 ${params.day}일`;
  }
  return formatString(t.lunarDate, params);
};

/**
 * 간지 정보를 포맷팅합니다
 * @param {Object} params - 포맷팅 파라미터
 * @param {string} params.ganZhi - 간지
 * @param {string} params.zodiac - 띠
 * @param {Function} formatString - i18n 포맷팅 함수
 * @param {Object} t - 번역 객체
 * @returns {string} 포맷팅된 간지 문자열
 */
export const formatGanZhi = (params, formatString, t) => {
  if (!t || !t.ganZhiFormat) {
    return `${params.ganZhi}년 (${params.zodiac}띠)`;
  }
  return formatString(t.ganZhiFormat, params);
};

/**
 * 월 헤더 텍스트를 포맷팅합니다
 * @param {string} monthDisplay - 월 표시 문자열
 * @param {Function} formatString - i18n 포맷팅 함수
 * @param {Object} t - 번역 객체
 * @returns {string} 포맷팅된 월 헤더 문자열
 */
export const formatMonthHeader = (monthDisplay, formatString, t) => {
  if (!t || !t.monthFormat) {
    return `${monthDisplay}월`;
  }
  return formatString(t.monthFormat, {month: monthDisplay});
};
