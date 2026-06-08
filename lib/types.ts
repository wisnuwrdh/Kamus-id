export type MediaType = 'photo' | 'video' | 'gif'
export type SortMode = 'newest' | 'oldest' | 'largest' | 'name'
export type FilterMode = 'all' | 'fav' | 'photo' | 'video' | 'gif'
export type Screen = 'lock' | 'app'

export interface MediaItem {
  id: string
  name: string
  type: MediaType
  mime: string
  timestamp: number
  date: string
  fav: boolean
  size: number
  albumId: string | null
  thumb: string | null
  blob?: Blob | null
  _opfs?: boolean
}

export interface Album {
  id: string
  name: string
  createdAt: number
}

export interface TimeLock {
  unlockAt: number
  startAt: number
}

export interface AppState {
  media: MediaItem[]
  albums: Album[]
  pin: string
  isUnlocked: boolean
  currentScreen: Screen
  filter: FilterMode
  sort: SortMode
  currentAlbum: string | null
  timeLock: TimeLock | null
  toast: string | null
  multiSelect: Set<string>
  isLightboxOpen: boolean
  lightboxIndex: number
  selectedAlbumId: string | null
  menuAlbumId: string | null
}
