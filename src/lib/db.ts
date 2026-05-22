import { openDB, type IDBPDatabase } from 'idb'
import type { DownloadEntry, PlaybackEntry } from '@/types'

const DB_NAME = 'delsol-db'
const DB_VERSION = 2

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('blobs')
          db.createObjectStore('downloads')
        }
        if (oldVersion < 2) {
          db.createObjectStore('playback')
        }
      },
    })
  }
  return dbPromise
}

export async function addDownload(entry: DownloadEntry, blob?: Blob): Promise<void> {
  const db = await getDb()
  if (blob) {
    const tx = db.transaction(['blobs', 'downloads'], 'readwrite')
    await tx.objectStore('blobs').put(blob, entry.episodeId)
    await tx.objectStore('downloads').put(entry, entry.episodeId)
    await tx.done
  } else {
    await db.put('downloads', entry, entry.episodeId)
  }
}

export async function getBlob(episodeId: string): Promise<Blob | undefined> {
  const db = await getDb()
  return db.get('blobs', episodeId)
}

export async function getDownload(episodeId: string): Promise<DownloadEntry | undefined> {
  const db = await getDb()
  return db.get('downloads', episodeId)
}

export async function getAllDownloads(): Promise<DownloadEntry[]> {
  const db = await getDb()
  return db.getAll('downloads')
}

export async function deleteDownload(episodeId: string): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(['blobs', 'downloads'], 'readwrite')
  await tx.objectStore('blobs').delete(episodeId)
  await tx.objectStore('downloads').delete(episodeId)
  await tx.done
}

export async function clearAllDownloads(): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(['blobs', 'downloads'], 'readwrite')
  await tx.objectStore('blobs').clear()
  await tx.objectStore('downloads').clear()
  await tx.done
}

export async function savePlayback(entry: PlaybackEntry): Promise<void> {
  const db = await getDb()
  await db.put('playback', entry, entry.episodeId)
}

export async function loadAllPlayback(): Promise<PlaybackEntry[]> {
  const db = await getDb()
  return db.getAll('playback')
}
