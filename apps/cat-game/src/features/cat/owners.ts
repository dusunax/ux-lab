/** 집사는 성별과 이름만 정한다. 성별에 맞는 아바타(public/sprites/owner-{id}.png)가 쓰인다. */
export type OwnerGender = 'female' | 'male'

export const OWNER_GENDERS: OwnerGender[] = ['female', 'male']
export const OWNER_GENDER_LABEL: Record<OwnerGender, string> = { female: '여자', male: '남자' }

export const OWNER_SPRITE = { female: 'glasses', male: 'backpack' } as const
export type OwnerId = (typeof OWNER_SPRITE)[OwnerGender]

export const DEFAULT_OWNER_GENDER: OwnerGender = 'female'
export const DEFAULT_OWNER_NAME = '집사'
export const MAX_OWNER_NAME_LENGTH = 10
