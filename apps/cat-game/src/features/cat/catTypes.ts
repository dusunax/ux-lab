import type { ActionId } from './actions'

/** 기본 이름과 이름 최대 길이 */
export const DEFAULT_CAT_NAME = 'Jev'
export const MAX_CAT_NAME_LENGTH = 10

export const CAT_TYPE_IDS = ['timid', 'playful', 'aloof', 'glutton', 'explorer'] as const
export type CatTypeId = (typeof CAT_TYPE_IDS)[number]

export interface CatType {
  id: CatTypeId
  name: string
  defaultName: string
  tagline: string
  /** jev가 성격을 이해하도록 전달하는 서술 */
  personality: string
  /** 상황별 행동 패턴. jev의 판단 근거이자 화면에도 노출 */
  patterns: string[]
  /** 행동별 성향(0~1). jev에게 텍스트로 전달하고, 오프라인 본능에서는 가중치로 사용 */
  weights: Record<ActionId, number>
}

export const CAT_TYPES: Record<CatTypeId, CatType> = {
  timid: {
    id: 'timid',
    name: '겁쟁이',
    defaultName: DEFAULT_CAT_NAME,
    tagline: '작은 소리에도 깜짝 놀라는 새가슴',
    personality: '겁이 많고 예민하다. 낯선 것과 큰 소리를 무서워하지만 주인은 믿는다.',
    patterns: [
      '큰 소리·낯선 사람이 나타나면 먼저 숨는 편이다',
      '위험이 사라졌다고 확신하면 그때서야 조심스럽게 살펴본다',
      '주인이 다정하게 대하면 안심하고 부빈다',
    ],
    weights: { hide: 0.25, investigate: 0.11, play: 0.08, eat: 0.11, sleep: 0.14, cuddle: 0.14, hiss: 0.08, ignore: 0.08 },
  },
  playful: {
    id: 'playful',
    name: '장난꾸러기',
    defaultName: DEFAULT_CAT_NAME,
    tagline: '움직이는 건 일단 잡고 보는 에너자이저',
    personality: '에너지가 넘치고 산만하다. 움직이는 것과 소리 나는 것에 흥분한다.',
    patterns: [
      '움직이거나 흔들리는 물건이 보이면 달려들고 싶어 한다',
      '에너지가 남아돌면 이유 없이 우다다를 한다',
      '지치면 금세 곯아떨어질 수 있다',
    ],
    weights: { hide: 0.07, investigate: 0.15, play: 0.27, eat: 0.11, sleep: 0.11, cuddle: 0.11, hiss: 0.07, ignore: 0.1 },
  },
  aloof: {
    id: 'aloof',
    name: '도도한',
    defaultName: DEFAULT_CAT_NAME,
    tagline: '세상이 나를 중심으로 돈다고 믿는 귀족',
    personality: '자존심이 세고 독립적이다. 관심 없는 척하지만 기분이 좋으면 스스로 다가온다.',
    patterns: [
      '웬만한 소란은 무시하고 그루밍하는 편이다',
      '함부로 만지거나 귀찮게 하면 하악질한다',
      '자기가 원할 때만 다가와서 부빈다',
    ],
    weights: { hide: 0.07, investigate: 0.11, play: 0.1, eat: 0.11, sleep: 0.14, cuddle: 0.1, hiss: 0.12, ignore: 0.25 },
  },
  glutton: {
    id: 'glutton',
    name: '먹보',
    defaultName: DEFAULT_CAT_NAME,
    tagline: '머릿속에 간식 생각뿐인 뚱냥이',
    personality: '식탐이 강하고 느긋하다. 먹을 것이 걸리면 모든 것이 뒷전이다.',
    patterns: [
      '음식 냄새나 소리가 나면 먹으러 가고 싶어 한다',
      '배가 부르면 졸려 한다',
      '간식을 주는 사람에게는 애교를 부린다',
    ],
    weights: { hide: 0.07, investigate: 0.11, play: 0.1, eat: 0.27, sleep: 0.17, cuddle: 0.12, hiss: 0.07, ignore: 0.08 },
  },
  explorer: {
    id: 'explorer',
    name: '모험가',
    defaultName: DEFAULT_CAT_NAME,
    tagline: '상자만 보면 들어가고 봐야 하는 탐험가',
    personality: '호기심 대장이며 겁이 없다. 새로운 물건·장소·소리를 직접 확인해야 직성이 풀린다.',
    patterns: [
      '새로운 물건이나 소리에는 다가가 살펴보려 한다',
      '좁은 곳·높은 곳은 올라가거나 들어가 보고 싶어 한다',
      '조사가 끝나면 흥미를 잃고 다른 데로 간다',
    ],
    weights: { hide: 0.07, investigate: 0.27, play: 0.15, eat: 0.11, sleep: 0.1, cuddle: 0.1, hiss: 0.08, ignore: 0.11 },
  },
}

export const CAT_TYPE_LIST: CatType[] = CAT_TYPE_IDS.map((id) => CAT_TYPES[id])
