import type { MediaItem, MediaType } from './types'

const MONTHS_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]

export function fmtDate(ts: number): string {
  const d = new Date(ts)
  const day = String(d.getDate()).padStart(2, '0')
  const month = MONTHS_ID[d.getMonth()]
  return `${day} ${month} ${d.getFullYear()}`
}

export function fmtDateTime(ts: number): string {
  const d = new Date(ts)
  return (
    d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }) +
    ', ' +
    String(d.getHours()).padStart(2, '0') +
    ':' +
    String(d.getMinutes()).padStart(2, '0') +
    ':' +
    String(d.getSeconds()).padStart(2, '0')
  )
}

export function fmtSize(bytes: number): string {
  if (bytes === 0) return '—'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

export function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60)
  return m + ':' + String(Math.floor(sec % 60)).padStart(2, '0')
}

export function detectMediaType(mime: string): MediaType {
  if (mime === 'image/gif') return 'gif'
  if (mime.startsWith('video/')) return 'video'
  return 'photo'
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function* range(n: number): Generator<number> {
  for (let i = 0; i < n; i++) yield i
}

export function sortMedia(list: MediaItem[], sort: string): MediaItem[] {
  const l = [...list]
  switch (sort) {
    case 'newest':
      l.sort((a, b) => b.timestamp - a.timestamp)
      break
    case 'oldest':
      l.sort((a, b) => a.timestamp - b.timestamp)
      break
    case 'largest':
      l.sort((a, b) => (b.size || 0) - (a.size || 0))
      break
    case 'name':
      l.sort((a, b) => a.name.localeCompare(b.name))
      break
  }
  return l
}
