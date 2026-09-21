/** 선택 가능한 시작 나이(개월). 기본값은 최솟값 */
export const MIN_AGE_MONTHS = 1
export const MAX_AGE_MONTHS = 36
/** 상황을 이 횟수만큼 겪을 때마다 한 달씩 자란다 */
export const TURNS_PER_MONTH = 2

const MONTHS_PER_YEAR = 12
const KITTEN_UNTIL = 6
const JUNIOR_UNTIL = 12

export const ageAfterTurns = (startMonths: number, turns: number) => startMonths + Math.floor(turns / TURNS_PER_MONTH)

export function formatAge(months: number): string {
  const years = Math.floor(months / MONTHS_PER_YEAR)
  const rest = months % MONTHS_PER_YEAR
  if (years === 0) return `${months}개월`
  return rest === 0 ? `${years}살` : `${years}살 ${rest}개월`
}

/** jev에게 전달하는 성장 단계 설명 */
export function lifeStage(months: number): string {
  if (months < KITTEN_UNTIL) return '아기 고양이 (겁 없이 호기심이 많고 장난이 잦으며 잠이 많다)'
  if (months < JUNIOR_UNTIL) return '청소년 고양이 (에너지가 넘치고 성격이 뚜렷해지는 시기)'
  return '성묘 (차분하고 자기 성격이 굳어진 시기)'
}
