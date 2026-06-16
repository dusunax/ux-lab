import { Race } from '../../types/race'
import { openDB, getTransaction, promisifyRequest, STORE_RACES } from './index'

export async function getRaces(): Promise<Race[]> {
  const db = await openDB()
  const store = getTransaction(db, STORE_RACES, 'readonly')
  return promisifyRequest<Race[]>(store.getAll())
}

export async function getRace(id: string): Promise<Race | undefined> {
  const db = await openDB()
  const store = getTransaction(db, STORE_RACES, 'readonly')
  return promisifyRequest<Race | undefined>(store.get(id))
}

export async function saveRace(race: Race): Promise<void> {
  const db = await openDB()
  const store = getTransaction(db, STORE_RACES, 'readwrite')
  await promisifyRequest(store.put(race))
}

export async function deleteRace(id: string): Promise<void> {
  const db = await openDB()
  const store = getTransaction(db, STORE_RACES, 'readwrite')
  await promisifyRequest(store.delete(id))
}
