import { randomDecorations as place, type Deco, type Zone, } from '../shared/decorate'
import { SAFE_BOTTOM_Y, SAFE_TOP } from '../shared/safezone'

export type { Deco, Zone }

// public/cat-game/sprites/ 안의 파일명. 장식으로 흩뿌릴 후보만 골랐다.
const ICONS = [
  'face-timid.png',
  'face-playful.png',
  'face-aloof.png',
  'face-glutton.png',
  'face-explorer.png',
  'item-star.png',
  'item-heart.png',
  'item-fish.png',
  'item-drumstick.png',
  'item-sparkle.png',
  'item-bulb.png',
  'fx-sparkle.png',
  'heart-full.png',
  'icon-hunger.png',
  'icon-energy.png',
  'icon-affection.png',
] as const

export const randomDecorations = (seed: string, count: number, exclude: Zone[], yRange: [number, number] = [SAFE_TOP, SAFE_BOTTOM_Y]): Deco[] =>
  place(ICONS, seed, count, exclude, yRange)
