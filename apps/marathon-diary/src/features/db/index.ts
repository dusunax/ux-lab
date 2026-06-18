const DB_NAME = 'marathon-diary'
const DB_VERSION = 1

export const STORE_RACES = 'races'
export const STORE_IMAGES = 'images'
export const STORE_DECORATIONS = 'decorations'

let dbInstance: IDBDatabase | null = null

export function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORE_RACES)) {
        db.createObjectStore(STORE_RACES, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        db.createObjectStore(STORE_IMAGES, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_DECORATIONS)) {
        db.createObjectStore(STORE_DECORATIONS, { keyPath: 'raceId' })
      }
    }

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result
      resolve(dbInstance)
    }

    request.onerror = () => {
      reject(new Error('IndexedDB 연결에 실패했습니다.'))
    }
  })
}

export function getTransaction(
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode
): IDBObjectStore {
  const tx = db.transaction(storeName, mode)
  return tx.objectStore(storeName)
}

export function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error('IndexedDB 요청에 실패했습니다.'))
  })
}
