'use client'

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import type { MediaItem, Album, AppState, FilterMode, SortMode, TimeLock } from './types'
import {
  getAllMedia,
  getAllAlbums,
  addMedia,
  putMedia,
  deleteMedia,
  putAlbum,
  deleteAlbum,
  getSetting,
  setSetting,
  clearAllMedia,
  clearAllAlbums,
  clearAllSettings,
  saveBlob,
  readBlob,
  deleteBlob,
  getTimeLock,
  saveTimeLock,
} from './storage'
import { hashPIN } from './crypto'
import { sortMedia, fmtDate } from './utils'

// ─── Actions ───

type Action =
  | { type: 'INIT'; media: MediaItem[]; albums: Album[]; pin: string; timeLock: TimeLock | null }
  | { type: 'SET_PIN'; pin: string }
  | { type: 'UNLOCK' }
  | { type: 'LOCK' }
  | { type: 'ADD_MEDIA'; items: MediaItem[] }
  | { type: 'UPDATE_MEDIA'; item: MediaItem }
  | { type: 'DELETE_MEDIA'; id: string }
  | { type: 'BULK_DELETE_MEDIA'; ids: string[] }
  | { type: 'MOVE_MEDIA'; ids: string[]; albumId: string | null }
  | { type: 'TOGGLE_FAV'; id: string }
  | { type: 'SET_FILTER'; filter: FilterMode }
  | { type: 'SET_SORT'; sort: SortMode }
  | { type: 'OPEN_ALBUM'; id: string | null }
  | { type: 'ADD_ALBUM'; album: Album }
  | { type: 'RENAME_ALBUM'; id: string; name: string }
  | { type: 'DELETE_ALBUM'; id: string }
  | { type: 'SET_TOAST'; toast: string | null }
  | { type: 'CLEAR_DATA' }
  | { type: 'SET_TIME_LOCK'; timeLock: TimeLock | null }
  | { type: 'OPEN_LIGHTBOX'; index: number }
  | { type: 'CLOSE_LIGHTBOX' }
  | { type: 'SET_LIGHTBOX_INDEX'; index: number }
  | { type: 'TOGGLE_MULTI'; id: string }
  | { type: 'CLEAR_MULTI' }
  | { type: 'SET_ALL_MULTI'; ids: string[] }
  | { type: 'SET_MENU_ALBUM'; id: string | null }

const initialState: AppState = {
  media: [],
  albums: [],
  pin: '',
  isUnlocked: false,
  currentScreen: 'lock',
  filter: 'all',
  sort: 'newest',
  currentAlbum: null,
  timeLock: null,
  toast: null,
  multiSelect: new Set(),
  isLightboxOpen: false,
  lightboxIndex: 0,
  selectedAlbumId: null,
  menuAlbumId: null,
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'INIT':
      return { ...state, media: action.media, albums: action.albums, pin: action.pin, timeLock: action.timeLock }

    case 'SET_PIN':
      return { ...state, pin: action.pin }

    case 'UNLOCK':
      return { ...state, isUnlocked: true, currentScreen: 'app' }

    case 'LOCK':
      return { ...state, isUnlocked: false, currentScreen: 'lock', isLightboxOpen: false, multiSelect: new Set() }

    case 'ADD_MEDIA': {
      const updated = [...action.items, ...state.media]
      return { ...state, media: updated }
    }

    case 'UPDATE_MEDIA': {
      return {
        ...state,
        media: state.media.map((m) => (m.id === action.item.id ? action.item : m)),
      }
    }

    case 'DELETE_MEDIA': {
      const filtered = state.media.filter((m) => m.id !== action.id)
      return { ...state, media: filtered }
    }

    case 'BULK_DELETE_MEDIA': {
      const ids = new Set(action.ids)
      return { ...state, media: state.media.filter((m) => !ids.has(m.id)), multiSelect: new Set() }
    }

    case 'MOVE_MEDIA': {
      const ids = new Set(action.ids)
      return {
        ...state,
        media: state.media.map((m) =>
          ids.has(m.id) ? { ...m, albumId: action.albumId } : m
        ),
        multiSelect: new Set(),
      }
    }

    case 'TOGGLE_FAV': {
      return {
        ...state,
        media: state.media.map((m) =>
          m.id === action.id ? { ...m, fav: !m.fav } : m
        ),
      }
    }

    case 'SET_FILTER':
      return { ...state, filter: action.filter }

    case 'SET_SORT':
      return { ...state, sort: action.sort }

    case 'OPEN_ALBUM':
      return { ...state, currentAlbum: action.id, filter: 'all' }

    case 'ADD_ALBUM':
      return { ...state, albums: [...state.albums, action.album] }

    case 'RENAME_ALBUM':
      return {
        ...state,
        albums: state.albums.map((a) =>
          a.id === action.id ? { ...a, name: action.name } : a
        ),
      }

    case 'DELETE_ALBUM': {
      const albumMediaIds = state.media
        .filter((m) => m.albumId === action.id)
        .map((m) => m.id)
      const albumIdSet = new Set(albumMediaIds)
      return {
        ...state,
        albums: state.albums.filter((a) => a.id !== action.id),
        media: state.media.filter((m) => m.albumId !== action.id),
        currentAlbum: state.currentAlbum === action.id ? null : state.currentAlbum,
        multiSelect: new Set(),
      }
    }

    case 'SET_TOAST':
      return { ...state, toast: action.toast }

    case 'CLEAR_DATA':
      return { ...initialState, pin: state.pin, isUnlocked: true, currentScreen: 'app' }

    case 'SET_TIME_LOCK':
      return { ...state, timeLock: action.timeLock }

    case 'OPEN_LIGHTBOX':
      return { ...state, isLightboxOpen: true, lightboxIndex: action.index }

    case 'CLOSE_LIGHTBOX':
      return { ...state, isLightboxOpen: false }

    case 'SET_LIGHTBOX_INDEX':
      return { ...state, lightboxIndex: action.index }

    case 'TOGGLE_MULTI': {
      const next = new Set(state.multiSelect)
      if (next.has(action.id)) next.delete(action.id)
      else next.add(action.id)
      return { ...state, multiSelect: next }
    }

    case 'CLEAR_MULTI':
      return { ...state, multiSelect: new Set() }

    case 'SET_ALL_MULTI':
      return { ...state, multiSelect: new Set(action.ids) }

    case 'SET_MENU_ALBUM':
      return { ...state, menuAlbumId: action.id }

    default:
      return state
  }
}

// ─── Context ───

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
  actions: {
    loadData: () => Promise<void>
    checkPin: (pin: string) => Promise<boolean>
    setPin: (pin: string) => Promise<void>
    lock: () => void
    uploadFiles: (files: File[], albumId: string | null, onProgress?: (done: number, total: number) => void) => Promise<void>
    deleteMedia: (id: string) => Promise<void>
    bulkDelete: (ids: string[]) => Promise<void>
    bulkMove: (ids: string[], albumId: string | null) => Promise<void>
    toggleFav: (id: string) => Promise<void>
    createAlbum: (name: string) => Promise<void>
    renameAlbum: (id: string, name: string) => Promise<void>
    deleteAlbumAction: (id: string) => Promise<void>
    showToast: (msg: string) => void
    clearData: () => Promise<void>
    setTimeLock: (tl: TimeLock | null) => Promise<void>
    openLightbox: (index: number) => void
    closeLightbox: () => void
    navLightbox: (dir: number) => void
    toggleMulti: (id: string) => void
    clearMulti: () => void
    selectAll: () => void
    setMenuAlbum: (id: string | null) => void
    getFilteredMedia: () => MediaItem[]
    getBlobForMedia: (m: MediaItem) => Promise<Blob | null>
    getUrlForMedia: (m: MediaItem) => string | null
  }
}

const AppContext = createContext<AppContextValue | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}

// ─── Provider ───

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const urlCache = useRef<Map<string, string>>(new Map())
  const blobLoadCache = useRef<Map<string, Promise<Blob | null>>>(new Map())
  const toastTimer = useRef<NodeJS.Timeout | null>(null)

  const showToast = useCallback(
    (msg: string) => {
      dispatch({ type: 'SET_TOAST', toast: msg })
      if (toastTimer.current) clearTimeout(toastTimer.current)
      toastTimer.current = setTimeout(() => {
        dispatch({ type: 'SET_TOAST', toast: null })
      }, 2500)
    },
    []
  )

  const getUrlForMedia = useCallback(
    (m: MediaItem): string | null => {
      if (!m.blob) return null
      if (urlCache.current.has(m.id)) {
        const cached = urlCache.current.get(m.id)
        if (cached) return cached
        urlCache.current.delete(m.id)
      }
      const url = URL.createObjectURL(m.blob)
      urlCache.current.set(m.id, url)
      return url
    },
    []
  )

  const getBlobForMedia = useCallback(
    async (m: MediaItem): Promise<Blob | null> => {
      if (m.blob) return m.blob
      if (blobLoadCache.current.has(m.id)) {
        return blobLoadCache.current.get(m.id)!
      }
      const p = readBlob(m.id, m.mime).then((blob) => {
        blobLoadCache.current.delete(m.id)
        if (blob) {
          m.blob = blob
          // update in state
          dispatch({ type: 'UPDATE_MEDIA', item: { ...m, blob } })
        }
        return blob
      })
      blobLoadCache.current.set(m.id, p)
      return p
    },
    []
  )

  const loadData = useCallback(async () => {
    const [media, albums, pin, timeLock] = await Promise.all([
      getAllMedia(),
      getAllAlbums(),
      getSetting('pin'),
      getTimeLock(),
    ])
    dispatch({ type: 'INIT', media, albums, pin: pin || '', timeLock })
  }, [])

  const checkPin = useCallback(
    async (input: string): Promise<boolean> => {
      const hashed = await hashPIN(input)
      const match = hashed === state.pin
      if (!match) return false

      // If time-lock is active, don't unlock
      if (state.timeLock && Date.now() < state.timeLock.unlockAt) {
        showToast('🔒 Vault terkunci waktu, sabar ya')
        return false
      }

      dispatch({ type: 'UNLOCK' })
      return true
    },
    [state.pin, state.timeLock, showToast]
  )

  const setPin = useCallback(async (pin: string) => {
    const hashed = await hashPIN(pin)
    dispatch({ type: 'SET_PIN', pin: hashed })
    await setSetting('pin', hashed)
  }, [])

  const lock = useCallback(() => {
    // Revoke object URLs
    urlCache.current.forEach((url) => URL.revokeObjectURL(url))
    urlCache.current.clear()
    blobLoadCache.current.clear()
    dispatch({ type: 'LOCK' })
  }, [])

  const uploadFiles = useCallback(
    async (files: File[], albumId: string | null, onProgress?: (done: number, total: number) => void) => {
      const items: MediaItem[] = []
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        const isVideo = f.type.startsWith('video/')
        const isGif = f.type === 'image/gif'
        const type = isGif ? 'gif' : isVideo ? 'video' : 'photo'

        // Generate thumbnail
        let thumb: string | null = null
        try {
          if (isVideo) {
            thumb = await generateThumbFromVideo(f)
          } else {
            thumb = await generateThumbFromImage(f)
          }
        } catch {}

        const item: MediaItem = {
          id: crypto.randomUUID(),
          name: f.name.replace(/\.[^.]+$/, ''),
          type,
          mime: f.type,
          timestamp: Date.now(),
          date: fmtDate(Date.now()),
          fav: false,
          size: f.size,
          albumId: albumId || null,
          thumb,
          blob: f,
          _opfs: true,
        }

        // Save blob to Capacitor FS
        const ok = await saveBlob(item.id, f)
        if (ok) {
          // Strip blob from the item stored in IndexedDB (keep in memory for UI)
          const metaItem = { ...item, blob: null as Blob | null }
          await addMedia(metaItem)
          item.blob = f // keep in RAM for immediate display
          items.push(item)
        } else {
          // Fallback: store blob in IndexedDB directly
          await addMedia(item)
          items.push(item)
        }

        onProgress?.(i + 1, files.length)
      }
      dispatch({ type: 'ADD_MEDIA', items })
    },
    []
  )

  const deleteMediaAction = useCallback(
    async (id: string) => {
      if (urlCache.current.has(id)) {
        URL.revokeObjectURL(urlCache.current.get(id)!)
        urlCache.current.delete(id)
      }
      await deleteBlob(id)
      await deleteMedia(id)
      dispatch({ type: 'DELETE_MEDIA', id })
    },
    []
  )

  const bulkDelete = useCallback(
    async (ids: string[]) => {
      for (const id of ids) {
        if (urlCache.current.has(id)) {
          URL.revokeObjectURL(urlCache.current.get(id)!)
          urlCache.current.delete(id)
        }
        await deleteBlob(id)
        await deleteMedia(id)
      }
      dispatch({ type: 'BULK_DELETE_MEDIA', ids })
      showToast(`${ids.length} file dihapus`)
    },
    [showToast]
  )

  const bulkMove = useCallback(
    async (ids: string[], albumId: string | null) => {
      for (const id of ids) {
        const m = state.media.find((x) => x.id === id)
        if (!m) continue
        m.albumId = albumId || null
        const meta = { ...m, blob: null }
        await putMedia(meta)
        if (urlCache.current.has(id)) {
          URL.revokeObjectURL(urlCache.current.get(id)!)
          urlCache.current.delete(id)
        }
      }
      dispatch({ type: 'MOVE_MEDIA', ids, albumId })
      const a = albumId ? state.albums.find((x) => x.id === albumId) : null
      showToast(`${ids.length} file dipindah ke ${a ? a.name : 'Tanpa Album'}`)
    },
    [state.media, state.albums, showToast]
  )

  const toggleFav = useCallback(
    async (id: string) => {
      const m = state.media.find((x) => x.id === id)
      if (!m) return
      const newFav = !m.fav
      await putMedia({ ...m, fav: newFav, blob: null })
      dispatch({ type: 'TOGGLE_FAV', id })
      showToast(newFav ? '★ Ditambah ke favorit' : 'Dihapus dari favorit')
    },
    [state.media, showToast]
  )

  const createAlbum = useCallback(
    async (name: string) => {
      const album: Album = {
        id: Date.now().toString(),
        name,
        createdAt: Date.now(),
      }
      await putAlbum(album)
      dispatch({ type: 'ADD_ALBUM', album })
      showToast(`Album "${name}" dibuat`)
    },
    [showToast]
  )

  const renameAlbum = useCallback(
    async (id: string, name: string) => {
      const a = state.albums.find((x) => x.id === id)
      if (!a) return
      a.name = name
      await putAlbum(a)
      dispatch({ type: 'RENAME_ALBUM', id, name })
      showToast(`Album diganti jadi "${name}"`)
    },
    [state.albums, showToast]
  )

  const deleteAlbumAction = useCallback(
    async (id: string) => {
      const albumMedia = state.media.filter((m) => m.albumId === id)
      for (const m of albumMedia) {
        await deleteBlob(m.id)
        await deleteMedia(m.id)
        if (urlCache.current.has(m.id)) {
          URL.revokeObjectURL(urlCache.current.get(m.id)!)
          urlCache.current.delete(m.id)
        }
      }
      await deleteAlbum(id)
      dispatch({ type: 'DELETE_ALBUM', id })
      showToast(`Album dihapus beserta ${albumMedia.length} file`)
    },
    [state.media, showToast]
  )

  const clearData = useCallback(async () => {
    // Revoke all URLs
    urlCache.current.forEach((url) => URL.revokeObjectURL(url))
    urlCache.current.clear()
    blobLoadCache.current.clear()

    // Clear storage
    await clearAllMedia()
    await clearAllAlbums()
    await clearAllSettings()
    // Note: Capacitor FS files are left for now (user can manually delete)

    dispatch({ type: 'CLEAR_DATA' })
    showToast('✅ Semua data berhasil dihapus')
  }, [showToast])

  const setTimeLockAction = useCallback(
    async (tl: TimeLock | null) => {
      await saveTimeLock(tl)
      dispatch({ type: 'SET_TIME_LOCK', timeLock: tl })
    },
    []
  )

  const openLightbox = useCallback((index: number) => {
    dispatch({ type: 'OPEN_LIGHTBOX', index })
  }, [])

  const closeLightbox = useCallback(() => {
    dispatch({ type: 'CLOSE_LIGHTBOX' })
  }, [])

  const navLightbox = useCallback(
    (dir: number) => {
      const filtered = getFilteredMedia()
      if (filtered.length <= 1) return
      const newIdx =
        (state.lightboxIndex + dir + filtered.length) % filtered.length
      dispatch({ type: 'SET_LIGHTBOX_INDEX', index: newIdx })
    },
    [state.lightboxIndex, state.media, state.filter, state.currentAlbum, state.sort]
  )

  const toggleMulti = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_MULTI', id })
  }, [])

  const clearMulti = useCallback(() => {
    dispatch({ type: 'CLEAR_MULTI' })
  }, [])

  const selectAll = useCallback(() => {
    const list = getFilteredMedia()
    if (state.multiSelect.size === list.length) {
      dispatch({ type: 'CLEAR_MULTI' })
    } else {
      dispatch({ type: 'SET_ALL_MULTI', ids: list.map((m) => m.id) })
    }
  }, [state.multiSelect.size])

  const setMenuAlbum = useCallback((id: string | null) => {
    dispatch({ type: 'SET_MENU_ALBUM', id })
  }, [])

  const getFilteredMedia = useCallback((): MediaItem[] => {
    let list: MediaItem[]
    if (state.currentAlbum !== null) {
      list = state.media.filter((m) => m.albumId === state.currentAlbum)
    } else if (state.filter === 'all') {
      list = state.media.filter((m) => !m.albumId)
    } else {
      list = [...state.media]
    }

    switch (state.filter) {
      case 'fav':
        list = list.filter((m) => m.fav)
        break
      case 'photo':
        list = list.filter((m) => m.type === 'photo')
        break
      case 'video':
        list = list.filter((m) => m.type === 'video')
        break
      case 'gif':
        list = list.filter((m) => m.type === 'gif')
        break
    }

    return sortMedia(list, state.sort)
  }, [state.currentAlbum, state.filter, state.media, state.sort])

  // Init on mount
  useEffect(() => {
    loadData().then(() => {
      // If no PIN set, first launch
    })
  }, [loadData])

  // Register Android back button
  useEffect(() => {
    const handlePopState = () => {
      if (state.isLightboxOpen) {
        closeLightbox()
        return
      }
      if (state.multiSelect.size > 0) {
        clearMulti()
        return
      }
      if (state.currentAlbum !== null) {
        dispatch({ type: 'OPEN_ALBUM', id: null })
        return
      }
      if (state.isUnlocked) {
        lock()
        return
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [
    state.isLightboxOpen,
    state.multiSelect.size,
    state.currentAlbum,
    state.isUnlocked,
    closeLightbox,
    clearMulti,
    lock,
  ])

  const value: AppContextValue = {
    state,
    dispatch,
    actions: {
      loadData,
      checkPin,
      setPin,
      lock,
      uploadFiles,
      deleteMedia: deleteMediaAction,
      bulkDelete,
      bulkMove,
      toggleFav,
      createAlbum,
      renameAlbum,
      deleteAlbumAction,
      showToast,
      clearData,
      setTimeLock: setTimeLockAction,
      openLightbox,
      closeLightbox,
      navLightbox,
      toggleMulti,
      clearMulti,
      selectAll,
      setMenuAlbum,
      getFilteredMedia,
      getBlobForMedia,
      getUrlForMedia,
    },
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// ─── Thumbnail Generation ───

function generateVideoFallbackThumb(): string {
  const c = document.createElement('canvas')
  c.width = 160
  c.height = 160
  const ctx = c.getContext('2d')!
  const grad = ctx.createLinearGradient(0, 0, 160, 160)
  grad.addColorStop(0, '#1a1a24')
  grad.addColorStop(1, '#0a0a0c')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 160, 160)
  ctx.beginPath()
  ctx.arc(80, 80, 32, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(201,168,76,0.2)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(201,168,76,0.6)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(70, 62)
  ctx.lineTo(70, 98)
  ctx.lineTo(100, 80)
  ctx.closePath()
  ctx.fillStyle = 'rgba(201,168,76,0.85)'
  ctx.fill()
  return c.toDataURL('image/jpeg', 0.7)
}

async function generateThumbFromImage(file: File): Promise<string | null> {
  return new Promise((res) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      try {
        const c = document.createElement('canvas')
        c.width = 160
        c.height = 160
        const ctx = c.getContext('2d')!
        const ar = img.naturalWidth / img.naturalHeight
        let sx = 0,
          sy = 0,
          sw = img.naturalWidth,
          sh = img.naturalHeight
        if (ar > 1) {
          sx = (img.naturalWidth - img.naturalHeight) / 2
          sw = img.naturalHeight
        } else {
          sy = (img.naturalHeight - img.naturalWidth) / 2
          sh = img.naturalWidth
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 160, 160)
        URL.revokeObjectURL(url)
        res(c.toDataURL('image/jpeg', 0.6))
      } catch {
        URL.revokeObjectURL(url)
        res(null)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      res(null)
    }
    img.src = url
  })
}

async function generateThumbFromVideo(file: File): Promise<string | null> {
  return new Promise((res) => {
    const url = URL.createObjectURL(file)
    const vid = document.createElement('video')
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(url)
      res(generateVideoFallbackThumb())
    }, 8000)

    const attempts = [1, 3, 5, 0.5]
    let attemptIdx = 0

    function trySeek() {
      if (attemptIdx >= attempts.length) {
        clearTimeout(timeout)
        URL.revokeObjectURL(url)
        res(generateVideoFallbackThumb())
        return
      }
      vid.currentTime = attempts[attemptIdx++]
    }

    vid.addEventListener('seeked', () => {
      try {
        const c = document.createElement('canvas')
        c.width = 160
        c.height = 160
        const ctx = c.getContext('2d')!
        const vr = vid.videoWidth / vid.videoHeight
        let sx = 0,
          sy = 0,
          sw = vid.videoWidth,
          sh = vid.videoHeight
        if (vr > 1) {
          sx = (vid.videoWidth - vid.videoHeight) / 2
          sw = vid.videoHeight
        } else {
          sy = (vid.videoHeight - vid.videoWidth) / 2
          sh = vid.videoWidth
        }
        ctx.drawImage(vid, sx, sy, sw, sh, 0, 0, 160, 160)
        clearTimeout(timeout)
        URL.revokeObjectURL(url)
        res(c.toDataURL('image/jpeg', 0.6))
      } catch {
        clearTimeout(timeout)
        URL.revokeObjectURL(url)
        res(null)
      }
    })

    vid.addEventListener(
      'error',
      () => {
        clearTimeout(timeout)
        URL.revokeObjectURL(url)
        res(null)
      },
      { once: true }
    )

    vid.muted = true
    vid.playsInline = true
    vid.src = url
    vid.addEventListener('loadedmetadata', () => trySeek(), { once: true })
    vid.load()
  })
}
