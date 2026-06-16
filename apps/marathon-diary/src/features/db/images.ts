import { openDB, getTransaction, promisifyRequest, STORE_IMAGES } from './index'

interface ImageRecord {
  id: string
  blob: Blob
}

export async function saveImage(id: string, blob: Blob): Promise<void> {
  const db = await openDB()
  const store = getTransaction(db, STORE_IMAGES, 'readwrite')
  const record: ImageRecord = { id, blob }
  await promisifyRequest(store.put(record))
}

export async function getImage(id: string): Promise<string | null> {
  const db = await openDB()
  const store = getTransaction(db, STORE_IMAGES, 'readonly')
  const record = await promisifyRequest<ImageRecord | undefined>(store.get(id))
  if (!record) return null
  return URL.createObjectURL(record.blob)
}

export async function deleteImage(id: string): Promise<void> {
  const db = await openDB()
  const store = getTransaction(db, STORE_IMAGES, 'readwrite')
  await promisifyRequest(store.delete(id))
}
