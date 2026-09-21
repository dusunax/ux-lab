import type { ActionId } from './actions'

export type Expression = 'idle' | 'happy' | 'excited' | 'scared' | 'angry' | 'sleepy' | 'curious' | 'meh' | 'eat' | 'think' | 'curled'

export const EXPRESSION_BY_ACTION: Record<ActionId, Expression> = {
  hide: 'scared',
  investigate: 'curious',
  play: 'excited',
  eat: 'eat',
  sleep: 'sleepy',
  cuddle: 'happy',
  hiss: 'angry',
  ignore: 'meh',
}
