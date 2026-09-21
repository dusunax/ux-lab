import { MIN_AGE_MONTHS } from './age'
import { DEFAULT_CAT_NAME, type CatTypeId } from './catTypes'
import { DEFAULT_OWNER_GENDER, DEFAULT_OWNER_NAME, type OwnerGender } from './owners'
import type { Gender } from './types'

/** 선택 화면에서 정하는 고양이 설정 */
export interface CatProfile {
  ownerGender: OwnerGender
  ownerName: string
  typeId: CatTypeId
  name: string
  gender: Gender
  /** 시작 나이(개월) */
  startAgeMonths: number
}

export const DEFAULT_CAT_PROFILE: CatProfile = {
  ownerGender: DEFAULT_OWNER_GENDER,
  ownerName: DEFAULT_OWNER_NAME,
  typeId: 'timid',
  name: DEFAULT_CAT_NAME,
  gender: 'female',
  startAgeMonths: MIN_AGE_MONTHS,
}
