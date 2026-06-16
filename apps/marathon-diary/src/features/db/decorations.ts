import { RaceDecorations } from '../../types/decoration'
import { openDB, getTransaction, promisifyRequest, STORE_DECORATIONS } from './index'

export async function getDecorations(raceId: string): Promise<RaceDecorations | null> {
  const db = await openDB()
  const store = getTransaction(db, STORE_DECORATIONS, 'readonly')
  const result = await promisifyRequest<RaceDecorations | undefined>(store.get(raceId))
  return result ?? null
}

export async function saveDecorations(decorations: RaceDecorations): Promise<void> {
  const db = await openDB()
  const store = getTransaction(db, STORE_DECORATIONS, 'readwrite')
  await promisifyRequest(store.put(decorations))
}

export async function deleteDecorations(raceId: string): Promise<void> {
  const db = await openDB()
  const store = getTransaction(db, STORE_DECORATIONS, 'readwrite')
  await promisifyRequest(store.delete(raceId))
}
