export interface Decoration {
  id: string
  assetId: string
  x: number
  y: number
  rotation: number
  scale: number
}

export interface RaceDecorations {
  raceId: string
  items: Decoration[]
}

export interface StampAsset {
  id: string
  emoji: string
  label: string
  category: 'finish' | 'weather' | 'emotion' | 'course'
}
