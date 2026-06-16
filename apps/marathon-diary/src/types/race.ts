export interface Race {
  id: string
  bibNumber: string
  raceName?: string
  season: number
  date: string
  distance: number
  finishTime: string
  photoIds: {
    bib?: string
    medal?: string
    selfie?: string
  }
  createdAt: string
}

export type RacePhotoSlot = 'bib' | 'medal' | 'selfie'
