import type { MediaItem, Album, TimeLock } from './types'

const DB_NAME = 'KamusIDVault'
const DB_VERSION = 1
const STORE_MEDIA = 'media'
const STORE_ALBUMS = 'albums'
const STORE_SETTINGS = 'settings'

// ─── IndexedDB Metadata ───

function openDB(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_MEDIA)) {
        const s = db.createObjectStore(STORE_MEDIA, { keyPath: 'id' })
        s.createIndex('timestamp', 'timestamp')
        s.createIndex('albumId', 'albumId')
      }
      if (!db.objectStoreNames.contains(STORE_ALBUMS)) {
        db.createObjectStore(STORE_ALBUMS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => res(req.result)
    req.onerror = () => rej(req.error)
  })
}

let _dbPromise: Promise<IDBDatabase> | null = null

function db(): Promise<IDBDatabase> {
  if (!_dbPromise) _dbPromise = openDB()
  return _dbPromise
}

async function tx(
  store: string,
  mode: IDBTransactionMode = 'readonly'
): Promise<IDBObjectStore> {
  const database = await db()
  if (!database.objectStoreNames.contains(store)) {
    throw new Error('Store not found: ' + store)
  }
  return database.transaction(store, mode).objectStore(store)
}

// ── Media ──

export async function getAllMedia(): Promise<MediaItem[]> {
  try {
    const store = await tx(STORE_MEDIA)
    return new Promise((res) => {
      const req = store.getAll()
      req.onsuccess = () => res(req.result || [])
      req.onerror = () => res([])
    })
  } catch {
    return []
  }
}

export async function putMedia(item: MediaItem): Promise<void> {
  const store = await tx(STORE_MEDIA, 'readwrite')
  return new Promise((res, rej) => {
    const req = store.put(item)
    req.onsuccess = () => res()
    req.onerror = () => rej(req.error)
  })
}

export async function addMedia(item: MediaItem): Promise<void> {
  const store = await tx(STORE_MEDIA, 'readwrite')
  return new Promise((res, rej) => {
    const req = store.add(item)
    req.onsuccess = () => res()
    req.onerror = () => rej(req.error)
  })
}

export async function deleteMedia(id: string): Promise<void> {
  const store = await tx(STORE_MEDIA, 'readwrite')
  return new Promise((res, rej) => {
    const req = store.delete(id)
    req.onsuccess = () => res()
    req.onerror = () => rej(req.error)
  })
}

export async function clearAllMedia(): Promise<void> {
  const store = await tx(STORE_MEDIA, 'readwrite')
  return new Promise((res, rej) => {
    const req = store.clear()
    req.onsuccess = () => res()
    req.onerror = () => rej(req.error)
  })
}

// ── Albums ──

export async function getAllAlbums(): Promise<Album[]> {
  try {
    const store = await tx(STORE_ALBUMS)
    return new Promise((res) => {
      const req = store.getAll()
      req.onsuccess = () => res(req.result || [])
      req.onerror = () => res([])
    })
  } catch {
    return []
  }
}

export async function putAlbum(album: Album): Promise<void> {
  const store = await tx(STORE_ALBUMS, 'readwrite')
  return new Promise((res, rej) => {
    const req = store.put(album)
    req.onsuccess = () => res()
    req.onerror = () => rej(req.error)
  })
}

export async function deleteAlbum(id: string): Promise<void> {
  const store = await tx(STORE_ALBUMS, 'readwrite')
  return new Promise((res, rej) => {
    const req = store.delete(id)
    req.onsuccess = () => res()
    req.onerror = () => rej(req.error)
  })
}

export async function clearAllAlbums(): Promise<void> {
  const store = await tx(STORE_ALBUMS, 'readwrite')
  return new Promise((res, rej) => {
    const req = store.clear()
    req.onsuccess = () => res()
    req.onerror = () => rej(req.error)
  })
}

// ── Settings ──

export async function getSetting(key: string): Promise<string | null> {
  try {
    const store = await tx(STORE_SETTINGS)
    return new Promise((res) => {
      const req = store.get(key)
      req.onsuccess = () => res(req.result?.value || null)
      req.onerror = () => res(null)
    })
  } catch {
    return null
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  const store = await tx(STORE_SETTINGS, 'readwrite')
  return new Promise((res, rej) => {
    const req = store.put({ key, value })
    req.onsuccess = () => res()
    req.onerror = () => rej(req.error)
  })
}

export async function deleteSetting(key: string): Promise<void> {
  const store = await tx(STORE_SETTINGS, 'readwrite')
  return new Promise((res, rej) => {
    const req = store.delete(key)
    req.onsuccess = () => res()
    req.onerror = () => rej(req.error)
  })
}

export async function clearAllSettings(): Promise<void> {
  const store = await tx(STORE_SETTINGS, 'readwrite')
  return new Promise((res, rej) => {
    const req = store.clear()
    req.onsuccess = () => res()
    req.onerror = () => rej(req.error)
  })
}

// ─── Capacitor Filesystem (Blob Storage) ───

// We dynamically import to avoid error in browser dev
let CapacitorFS: any = null
let CapacitorDir: any = null

async function ensureCapFS() {
  if (CapacitorFS) return true
  try {
    const mod = await import('@capacitor/filesystem')
    CapacitorFS = mod.Filesystem
    CapacitorDir = mod.Directory
    return true
  } catch {
    return false
  }
}

const VAULT_DIR = 'KamusID'

export async function saveBlob(id: string, blob: Blob): Promise<boolean> {
  const ok = await ensureCapFS()
  if (!ok) return false

  try {
    const base64 = await new Promise<string>((res, rej) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        res(result.split(',')[1])
      }
      reader.onerror = rej
      reader.readAsDataURL(blob)
    })

    await CapacitorFS.writeFile({
      path: `${VAULT_DIR}/${id}`,
      data: base64,
      directory: CapacitorDir.Documents,
    })
    return true
  } catch (e) {
    console.warn('Capacitor saveBlob error:', e)
    return false
  }
}

export async function readBlob(
  id: string,
  mime: string
): Promise<Blob | null> {
  const ok = await ensureCapFS()
  if (!ok) return null

  try {
    const result = await CapacitorFS.readFile({
      path: `${VAULT_DIR}/${id}`,
      directory: CapacitorDir.Documents,
    })
    const byteStr = atob(result.data)
    const bytes = new Uint8Array(byteStr.length)
    for (let i = 0; i < byteStr.length; i++) {
      bytes[i] = byteStr.charCodeAt(i)
    }
    return new Blob([bytes], { type: mime })
  } catch {
    return null
  }
}

export async function deleteBlob(id: string): Promise<void> {
  const ok = await ensureCapFS()
  if (!ok) return

  try {
    await CapacitorFS.deleteFile({
      path: `${VAULT_DIR}/${id}`,
      directory: CapacitorDir.Documents,
    })
  } catch {}
}

export async function ensureVaultDir(): Promise<boolean> {
  const ok = await ensureCapFS()
  if (!ok) return false
  try {
    await CapacitorFS.mkdir({
      path: VAULT_DIR,
      directory: CapacitorDir.Documents,
      createIntermediateDirectories: true,
    })
    return true
  } catch {
    return true // maybe already exists
  }
}

export async function listVaultFiles(): Promise<string[]> {
  const ok = await ensureCapFS()
  if (!ok) return []
  try {
    const result = await CapacitorFS.readdir({
      path: VAULT_DIR,
      directory: CapacitorDir.Documents,
    })
    return result.files.map((f: any) => f.name || f)
  } catch {
    return []
  }
}

// ── Time-Lock ──

export async function getTimeLock(): Promise<TimeLock | null> {
  try {
    const val = localStorage.getItem('tl_data')
    if (val) return JSON.parse(val)
  } catch {}
  const raw = await getSetting('timelock')
  if (!raw) return null
  try {
    const data = JSON.parse(raw)
    localStorage.setItem('tl_data', raw)
    return data
  } catch {
    return null
  }
}

export async function saveTimeLock(data: TimeLock | null): Promise<void> {
  if (data) {
    localStorage.setItem('tl_data', JSON.stringify(data))
    await setSetting('timelock', JSON.stringify(data))
  } else {
    localStorage.removeItem('tl_data')
    await deleteSetting('timelock')
  }
}
