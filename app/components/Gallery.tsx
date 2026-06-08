'use client'

import { useApp } from '@/lib/store'
import AlbumCard from './AlbumCard'
import PhotoCard from './PhotoCard'

interface GalleryProps {
  onNewAlbum?: () => void
}

export default function Gallery({ onNewAlbum }: GalleryProps) {
  const { state, dispatch, actions } = useApp()
  const filtered = actions.getFilteredMedia()
  const albums = state.albums
  const isHome = state.currentAlbum === null && state.filter === 'all'

  return (
    <div className="grid grid-cols-3 gap-0.5 p-0.5" id="gallery">
      {/* Albums section on home */}
      {isHome && (
        <>
          {albums.length > 0 && (
            <>
              <div className="col-span-3 px-1.5 pb-1 pt-2.5 text-[0.58rem] tracking-[0.2em] text-vault-muted uppercase flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.5]">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                Album ({albums.length})
              </div>
              {albums.map((a) => (
                <AlbumCard key={a.id} album={a} />
              ))}

              {/* New album button */}
              <div
                onClick={() => onNewAlbum?.()}
                className="aspect-square bg-vault-card border-[1.5px] border-dashed border-vault-border
                           flex flex-col items-center justify-center gap-2 cursor-pointer active:border-vault-gold"
              >
                <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] stroke-vault-muted fill-none stroke-[1.5]">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="text-[0.58rem] text-vault-muted tracking-[0.14em] uppercase">
                  Album Baru
                </span>
              </div>
            </>
          )}

          {filtered.length > 0 && (
            <div className="col-span-3 px-1.5 pb-1 pt-2.5 text-[0.58rem] tracking-[0.2em] text-vault-muted uppercase flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.5]">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Tanpa Album ({filtered.length})
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {filtered.length === 0 && albums.length === 0 && (
        <div className="col-span-3 flex flex-col items-center justify-center py-16 px-6 gap-3.5 text-center text-vault-muted">
          <svg viewBox="0 0 24 24" className="w-10 h-10 stroke-vault-border fill-none stroke-[1]">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p className="text-[0.68rem] tracking-[0.15em] uppercase leading-[1.8]">
            {state.currentAlbum
              ? 'Album ini masih kosong\nTap + untuk menambah'
              : 'Vault masih kosong\nTap + untuk menambah media'}
          </p>
        </div>
      )}

      {/* Photo cards */}
      {filtered.map((m, i) => (
        <PhotoCard key={m.id} media={m} index={i} />
      ))}
    </div>
  )
}
