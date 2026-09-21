import { josa } from 'es-hangul'

export const ACTION_IDS = [
  'hide',
  'investigate',
  'play',
  'eat',
  'sleep',
  'cuddle',
  'hiss',
  'ignore',
] as const

export type ActionId = (typeof ACTION_IDS)[number]

export interface StatDelta {
  satiety: number
  energy: number
  affection: number
}

export interface ActionInfo {
  label: string
  /** jev에게 전달하는 행동 설명 */
  criteria: string
  narration: (cat: string) => string
  delta: StatDelta
}

export const ACTIONS: Record<ActionId, ActionInfo> = {
  hide: {
    label: '숨는다',
    criteria: '무서움이나 경계심 때문에 안전한 곳에 숨는다',
    narration: (cat) => `${josa(cat, '은/는')} 침대 밑으로 쏙 숨어 버렸다.`,
    delta: { satiety: -2, energy: -5, affection: -2 },
  },
  investigate: {
    label: '살펴본다',
    criteria: '호기심을 갖고 조심스럽게 다가가 무슨 일인지 살핀다',
    narration: (cat) => `${josa(cat, '은/는')} 꼬리를 세우고 슬금슬금 다가가 살펴본다.`,
    delta: { satiety: -4, energy: -8, affection: 0 },
  },
  play: {
    label: '장난친다',
    criteria: '신나서 달려들고 뛰어다니며 논다',
    narration: (cat) => `${josa(cat, '은/는')} 엉덩이를 씰룩이더니 신나게 달려들었다!`,
    delta: { satiety: -8, energy: -15, affection: 6 },
  },
  eat: {
    label: '먹는다',
    criteria: '먹을 것을 찾아가 허겁지겁 먹는다',
    narration: (cat) => `${josa(cat, '은/는')} 밥그릇 앞으로 직행해 냠냠 먹기 시작했다.`,
    delta: { satiety: 35, energy: 5, affection: 2 },
  },
  sleep: {
    label: '잔다',
    criteria: '몸을 동그랗게 말고 낮잠이나 잠을 잔다',
    narration: (cat) => `${josa(cat, '은/는')} 몸을 동그랗게 말고 다시 잠들었다.`,
    delta: { satiety: -4, energy: 30, affection: 0 },
  },
  cuddle: {
    label: '다가가 부빈다',
    criteria: '주인에게 다가가 몸을 부비고 골골송을 부른다',
    narration: (cat) => `${josa(cat, '은/는')} 다리에 몸을 부비며 골골송을 부른다.`,
    delta: { satiety: -3, energy: -3, affection: 15 },
  },
  hiss: {
    label: '하악질한다',
    criteria: '화가 나서 털을 세우고 하악질하거나 할퀸다',
    narration: (cat) => `${josa(cat, '은/는')} 털을 잔뜩 세우고 "하악!" 하고 소리쳤다.`,
    delta: { satiety: -3, energy: -10, affection: -8 },
  },
  ignore: {
    label: '무시한다',
    criteria: '관심 없다는 듯 그루밍하거나 시선을 돌린다',
    narration: (cat) => `${josa(cat, '은/는')} 흥 하고 고개를 돌리더니 그루밍을 시작했다.`,
    delta: { satiety: -2, energy: -1, affection: -3 },
  },
}
