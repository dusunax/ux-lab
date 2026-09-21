import { z } from 'zod'
import { ACTIONS, ACTION_IDS, type ActionId } from './actions'
import { formatAge, lifeStage } from './age'
import type { CatType } from './catTypes'
import { OWNER_GENDER_LABEL, type OwnerGender } from './owners'
import { describeSession, type SessionContext } from './session'
import { GENDER_LABEL, MOODS, type CatStats, type Decision, type FallbackReason, type Gender, type Mood } from './types'

const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:3035'
const REQUEST_TIMEOUT_MS = 25_000
const MEMORY_SIZE = 3

export interface MemoryItem {
  situation: string
  action: ActionId
}

export interface DecideInput {
  catType: CatType
  catName: string
  gender: Gender
  owner: { name: string; gender: OwnerGender }
  session: SessionContext
  stats: CatStats
  ageMonths: number
  situation: string
  memory: MemoryItem[]
}

const probabilities = z.record(z.string(), z.number())

const responseSchema = z.object({
  answers: z.object({
    action: z.object({
      choice: z.string(),
      probabilities: probabilities.optional(),
      confidence: z.number().optional(),
    }),
    mood: z.object({ choice: z.string() }),
    startled: z.object({ noul: z.number() }),
    joy: z.object({ noul: z.number() }).optional(),
  }),
})

const isActionId = (v: string): v is ActionId => (ACTION_IDS as readonly string[]).includes(v)
const isMood = (v: string): v is Mood => (MOODS as readonly string[]).includes(v)

const level = (weight: number) => (weight >= 0.2 ? '조금 더 끌림' : weight >= 0.1 ? '보통' : '덜 끌림')

function buildRequest({ catType, catName, gender, owner, session, ageMonths, stats, situation, memory }: DecideInput) {
  const tendencies = Object.fromEntries(
    ACTION_IDS.map((id) => [id, `${ACTIONS[id].label}: ${level(catType.weights[id])}`]),
  )
  return {
    state: {
      cat: {
        name: catName,
        gender: GENDER_LABEL[gender],
        type: catType.name,
        age: formatAge(ageMonths),
        lifeStage: lifeStage(ageMonths),
        personality: catType.personality,
        behaviorPatterns: catType.patterns,
        tendencies,
        stats: {
          satiety: `${stats.satiety}/100 (낮을수록 배고픔)`,
          energy: `${stats.energy}/100 (낮을수록 피곤함)`,
          affection: `${stats.affection}/100 (높을수록 주인을 따름)`,
        },
      },
      owner: { name: owner.name, gender: OWNER_GENDER_LABEL[owner.gender] },
      situation,
      session: describeSession(session),
      recentEvents: memory.slice(-MEMORY_SIZE).map((m) => `${m.situation} → ${ACTIONS[m.action].label}`),
    },
    questions: {
      action: {
        type: 'choice',
        instructions:
          '상황이 가장 중요한 단서다. 상황에 가장 자연스러운 반응을 먼저 떠올린 뒤, 고양이의 나이(성장 단계)·성격·행동 패턴·현재 상태는 참고용 경향(고정 규칙 아님)으로만 반영해 다음 행동 하나를 고른다. 상황이 성격과 어울리지 않으면 성격을 따르지 말고 상황에 맞게 반응한다. 이전 기록(recentEvents, session)도 반영한다: 같은 상황이 반복되면 익숙해져 덜 놀라고, 같은 행동이 연속되면 싫증이 나 다른 행동을 고르기 쉬우며, 친밀도가 높으면 다가오고 낮으면 경계하고, 지난 기분이 이어진다.',
        criteria: Object.fromEntries(ACTION_IDS.map((id) => [id, ACTIONS[id].criteria])),
      },
      mood: {
        type: 'choice',
        instructions: '이 상황을 겪은 뒤 고양이의 기분을 고른다.',
        criteria: {
          happy: '기분이 좋다',
          calm: '평온하다',
          nervous: '불안하다',
          annoyed: '짜증난다',
          excited: '신난다',
        },
      },
      startled: {
        type: 'noul',
        instructions: '이 상황에 고양이가 깜짝 놀랐는가.',
        criteria: { true: '깜짝 놀랐다', false: '놀라지 않았다' },
      },
      joy: {
        type: 'noul',
        instructions: '이 상황이 고양이에게 즐겁고 반가운 일인가.',
        criteria: { true: '즐겁다', false: '즐겁지 않다' },
      },
    },
  }
}

function toDecision(raw: unknown): Decision {
  const { answers } = responseSchema.parse(raw)
  if (!isActionId(answers.action.choice)) throw new Error(`알 수 없는 행동: ${answers.action.choice}`)

  const actionProbabilities: Decision['actionProbabilities'] = {}
  for (const [key, value] of Object.entries(answers.action.probabilities ?? {})) {
    if (isActionId(key)) actionProbabilities[key] = value
  }
  // 화면에 보여주는 확률과 실제 행동이 어긋나지 않도록, 확률이 가장 높은 행동을 고른다
  const top = ACTION_IDS.reduce<ActionId | null>((best, id) => {
    const p = actionProbabilities[id]
    if (p === undefined) return best
    return best === null || p > (actionProbabilities[best] ?? -1) ? id : best
  }, null)
  return {
    action: top ?? answers.action.choice,
    mood: isMood(answers.mood.choice) ? answers.mood.choice : 'calm',
    startled: answers.startled.noul,
    joy: answers.joy?.noul ?? null,
    actionProbabilities,
    confidence: answers.action.confidence ?? null,
    source: 'jev',
  }
}

const GATEWAY_TIMEOUT_STATUS = 504

/** 콘솔 경고에 함께 보여주는 개발자용 해결 힌트 */
export const FALLBACK_HINT: Record<FallbackReason, string> = {
  network: `프록시(${PROXY_URL})가 실행 중인지 확인하세요: pnpm dev:openrouter`,
  timeout: 'jev 알파 엔드포인트가 느립니다. 잠시 뒤 다시 시도하세요.',
  server: '프록시 로그(터미널)와 apps/openrouter-proxy/.env 의 OPENROUTER_KEY를 확인하세요.',
  invalid: 'jev 응답 형식이 바뀌었을 수 있습니다. decideApi.ts 의 responseSchema를 확인하세요.',
}

/** 실패 원인을 함께 담아 화면에 알려줄 수 있게 한다 */
export class DecideError extends Error {
  constructor(
    readonly kind: FallbackReason,
    message: string,
  ) {
    super(message)
  }
}

const isTimeout = (error: unknown) => error instanceof DOMException && error.name === 'TimeoutError'

/** jev(OpenRouter Decisions)에게 고양이의 행동을 결정시킨다. 실패 시 DecideError를 던진다. */
export async function decideWithJev(input: DecideInput): Promise<Decision> {
  let res: Response
  try {
    res = await fetch(`${PROXY_URL}/api/decisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequest(input)),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    throw new DecideError(isTimeout(error) ? 'timeout' : 'network', `프록시 요청 실패: ${String(error)}`)
  }
  if (!res.ok) {
    throw new DecideError(res.status === GATEWAY_TIMEOUT_STATUS ? 'timeout' : 'server', `결정 서버 오류 (${res.status})`)
  }
  try {
    return toDecision(await res.json())
  } catch (error) {
    throw new DecideError(isTimeout(error) ? 'timeout' : 'invalid', `응답 해석 실패: ${String(error)}`)
  }
}
