'use client'

import { useMemo, useCallback } from 'react'
import { useApp } from '@/lib/store'
import { useLongPress } from '@/hooks/useLongPress'
import type { MediaItem } from '@/lib/types'

interface PhotoCardProps {
  media: MediaItem
  index: number
}

export default function PhotoCard({ media, index }: PhotoCardProps) {
  const { state, dispatch, actions } = useApp()
  const isSelected = state.multiSelect.has(media.id)
  const isV = media.type === 'video'
  const isG = media.type === 'gif'

  const handleClick = useCallback(() => {
    if (state.multiSelect.size > 0) {
      dispatch({ type: 'TOGGLE_MULTI', id: media.id })
    } else {
      actions.openLightbox(index)
    }
  }, [state.multiSelect.size, media.id, actions, index, dispatch])

  const handleLongPress = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(40)
    dispatch({ type: 'TOGGLE_MULTI', id: media.id })
  }, [media.id, dispatch])

  const longPressHandlers = useLongPress({ onLongPress: handleLongPress })

  const mediaContent = useMemo(() => {
    const badge = isV ? (
      <div className="absolute top-1 right-1 bg-black/65 rounded px-1.5 py-0.5 text-[0.5rem] text-white backdrop-blur-sm flex items-center gap-0.5">
        <svg viewBox="0 0 24 24" className="w-[9px] h-[9px] fill-white stroke-none">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        VIDEO
      </div>
    ) : isG ? (
      <div className="absolute top-1 right-1 bg-[rgba(100,50,200,0.75)] rounded px-1.5 py-0.5 text-[0.5rem] text-white backdrop-blur-sm">
        GIF
      </div>
    ) : null

    if (media.thumb) {
      return (
        <>
          <img src={media.thumb} alt={media.name} className="w-full h-full object-cover block" />
          {badge}
        </>
      )
    }

    if (media.blob && !isV) {
      const url = actions.getUrlForMedia(media)
      if (url) {
        return (
          <>
            <img src={url} alt={media.name} className="w-full h-full object-cover block" />
            {badge}
          </>
        )
      }
    }

    return (
      <>
        <div className="w-full h-full bg-gradient-to-br from-vault-card to-vault-surface flex items-center justify-center">
          {isV ? (
            <svg viewBox="0 0 24 24" className="w-8 h-8 stroke-vault-muted/50 fill-none stroke-[1.5]">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-8 h-8 stroke-vault-muted/50 fill-none stroke-[1.5]">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          )}
        </div>
        {badge}
      </>
    )
  }, [media, isV, isG, actions])

  return (
    <div
      className={`relative aspect-square overflow-hidden bg-vault-card cursor-pointer select-none
                  ${isSelected ? 'selected' : ''}`}
      data-id={media.id}
      onClick={handleClick}
      {...longPressHandlers}
    >
      {/* Selection check */}
      <div
        className={`absolute top-1.5 left-1.5 w-[22px] h-[22px] rounded-full bg-vault-gold z-[2]
                    items-center justify-center ${isSelected ? 'flex' : 'hidden'}`}
      >
        <svg viewBox="0 0 24 24" className="w-3 h-3 stroke-vault-bg fill-none stroke-[2.5]">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      {mediaContent}

      {/* Selected overlay */}
      {isSelected && (
        <div className="absolute inset-0 bg-[rgba(201,168,76,0.35)] pointer-events-none" />
      )}

      {/* Favorite star */}
      {media.fav && (
        <div className="absolute bottom-1 right-1">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-vault-gold stroke-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
      )}
    </div>
  )
}
