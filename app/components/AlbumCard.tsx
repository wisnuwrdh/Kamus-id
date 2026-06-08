'use client'

import { useMemo } from 'react'
import { useApp } from '@/lib/store'
import type { Album, MediaItem } from '@/lib/types'

export default function AlbumCard({ album }: { album: Album }) {
  const { state, dispatch, actions } = useApp()

  const mediaInAlbum = useMemo(
    () => state.media.filter((m) => m.albumId === album.id),
    [state.media, album.id]
  )
  const firstMedia = mediaInAlbum[0]

  const thumbContent = useMemo(() => {
    if (!firstMedia) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-vault-card to-vault-surface flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-vault-border fill-none stroke-[1]">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      )
    }
    if (firstMedia.thumb) {
      return (
        <img
          src={firstMedia.thumb}
          alt=""
          className="w-full h-full object-cover block opacity-65 brightness-[0.75]"
        />
      )
    }
    if (firstMedia.blob && firstMedia.type !== 'video') {
      const url = actions.getUrlForMedia(firstMedia)
      if (url) {
        return (
          <img
            src={url}
            alt=""
            className="w-full h-full object-cover block opacity-65 brightness-[0.75]"
          />
        )
      }
    }
    return (
      <div className="w-full h-full bg-gradient-to-br from-vault-card to-vault-surface flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-vault-border fill-none stroke-[1]">
          {firstMedia?.type === 'video' ? (
            <polygon points="5 3 19 12 5 21 5 3" />
          ) : (
            <>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </>
          )}
        </svg>
      </div>
    )
  }, [firstMedia, actions])

  const albumCount = mediaInAlbum.length

  const handleOpen = () => {
    dispatch({ type: 'OPEN_ALBUM', id: album.id })
  }

  const handleMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: 'SET_MENU_ALBUM', id: album.id })
  }

  return (
    <div
      className="relative aspect-square overflow-hidden bg-vault-card cursor-pointer"
      onClick={handleOpen}
    >
      <div className="absolute inset-0">{thumbContent}</div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent flex flex-col justify-end p-2.5 gap-0.5">
        <div className="text-[0.72rem] tracking-[0.05em] text-vault-text truncate flex items-center gap-1">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.5] flex-shrink-0">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          {album.name}
        </div>
        <div className="text-[0.55rem] text-vault-gold tracking-[0.12em]">{albumCount} file</div>
      </div>
      <button
        onClick={handleMenu}
        className="absolute top-1.5 right-1.5 w-[26px] h-[26px] bg-black/55 border-none rounded-full
                   flex items-center justify-center cursor-pointer backdrop-blur-sm"
      >
        <svg viewBox="0 0 24 24" className="w-3 h-3 stroke-white fill-none stroke-2">
          <circle cx="12" cy="5" r="1" fill="white" stroke="none" />
          <circle cx="12" cy="12" r="1" fill="white" stroke="none" />
          <circle cx="12" cy="19" r="1" fill="white" stroke="none" />
        </svg>
      </button>
    </div>
  )
}
