'use client'

import { useState, useCallback } from 'react'
import { useApp } from '@/lib/store'
import Gallery from './Gallery'
import Lightbox from './Lightbox'
import UploadSheet from './UploadSheet'
import SettingsSheet from './SettingsSheet'
import MultiSelectBar from './MultiSelectBar'
import NewAlbumModal from './NewAlbumModal'
import RenameAlbumModal from './RenameAlbumModal'
import DeleteAlbumModal from './DeleteAlbumModal'
import TimeLockModal from './TimeLockModal'
import BottomSheet from './BottomSheet'
import { fmtSize } from '@/lib/utils'
import type { FilterMode } from '@/lib/types'

const FILTERS: { key: FilterMode; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'fav', label: 'Favorit' },
  { key: 'photo', label: 'Foto' },
  { key: 'video', label: 'Video' },
  { key: 'gif', label: 'GIF' },
]

const SORT_LABELS: Record<string, string> = {
  newest: 'Terbaru',
  oldest: 'Terlama',
  largest: 'Terbesar',
  name: 'A–Z',
}
const SORT_ORDER = ['newest', 'oldest', 'largest', 'name']

export default function AppScreen() {
  const { state, dispatch, actions } = useApp()
  const [showUpload, setShowUpload] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showNewAlbum, setShowNewAlbum] = useState(false)
  const [renameAlbumId, setRenameAlbumId] = useState<string | null>(null)
  const [delAlbumId, setDelAlbumId] = useState<string | null>(null)
  const [showTLModal, setShowTLModal] = useState(false)

  const cycleSort = () => {
    const idx = SORT_ORDER.indexOf(state.sort)
    const next = SORT_ORDER[(idx + 1) % SORT_ORDER.length] as any
    dispatch({ type: 'SET_SORT', sort: next })
  }

  const filteredMedia = actions.getFilteredMedia()
  const mediaInAlbum = state.currentAlbum
    ? state.media.filter((m) => m.albumId === state.currentAlbum)
    : state.media.filter((m) => !m.albumId)

  return (
    <div className="fixed inset-0 z-50 bg-vault-bg flex flex-col">
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 pt-[calc(14px+env(safe-area-inset-top))] pb-3.5
                     bg-vault-surface flex-shrink-0"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 border-[1.5px] border-vault-gold rounded-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-[13px] h-[13px] stroke-vault-gold fill-none stroke-[1.5]">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <span className="font-display text-[1rem] tracking-[0.05em] block leading-tight">
              Kamus ID
            </span>
            <span className="text-[0.55rem] tracking-[0.18em] text-vault-gold uppercase block leading-tight">
              Private Gallery
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUpload(true)}
            className="w-9 h-9 rounded-md border border-vault-gold-dim bg-vault-gold-dim
                       flex items-center justify-center text-vault-gold active:scale-[0.93]"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[1.5]">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 rounded-md border border-vault-border bg-transparent
                       flex items-center justify-center text-vault-muted active:text-vault-gold active:border-vault-gold"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[1.5]">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button
            onClick={actions.lock}
            className="w-9 h-9 rounded-md border border-vault-border bg-transparent
                       flex items-center justify-center text-vault-muted active:text-vault-gold active:border-vault-gold"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[1.5]">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="flex bg-vault-card border-b border-vault-border flex-shrink-0">
        {[
          { val: state.media.length, lbl: 'Media' },
          { val: state.albums.length, lbl: 'Album' },
          { val: state.media.filter((m) => m.fav).length, lbl: 'Favorit' },
          {
            val: fmtSize(state.media.reduce((s, m) => s + (m.size || 0), 0)),
            lbl: 'Ukuran',
          },
        ].map((s) => (
          <div
            key={s.lbl}
            className="flex-1 py-2.5 px-1.5 text-center border-r border-vault-border last:border-r-0"
          >
            <span className="font-display text-[1.1rem] text-vault-gold block">
              {s.val}
            </span>
            <span className="text-[0.5rem] text-vault-muted tracking-[0.12em] uppercase">
              {s.lbl}
            </span>
          </div>
        ))}
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-3.5 py-2 border-b border-vault-border bg-vault-bg flex-shrink-0 overflow-x-auto no-scrollbar">
        <span
          className="text-[0.62rem] tracking-[0.1em] text-vault-muted cursor-pointer whitespace-nowrap uppercase
                     flex items-center gap-1"
          onClick={() => {
            dispatch({ type: 'OPEN_ALBUM', id: null })
            dispatch({ type: 'SET_FILTER', filter: 'all' })
          }}
        >
          <svg viewBox="0 0 24 24" className="w-[13px] h-[13px] stroke-current fill-none stroke-[1.5] inline-block align-middle">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Vault
        </span>
        {state.currentAlbum && (
          <>
            <span className="text-vault-border text-[0.7rem]">›</span>
            <span className="text-[0.62rem] tracking-[0.1em] text-vault-gold whitespace-nowrap uppercase flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="w-3 h-3 stroke-current fill-none stroke-[1.5]">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              {state.albums.find((a) => a.id === state.currentAlbum)?.name || 'Album'}
            </span>
          </>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex gap-1.5 px-3.5 py-2 flex-shrink-0 overflow-x-auto no-scrollbar border-b border-vault-border">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => dispatch({ type: 'SET_FILTER', filter: f.key })}
            className={`px-3 py-1 rounded-full border font-mono text-[0.62rem] tracking-[0.1em] 
                       whitespace-nowrap uppercase transition-all duration-200
                       ${
                         state.filter === f.key
                           ? 'border-vault-gold text-vault-gold bg-vault-gold-dim'
                           : 'border-vault-border bg-transparent text-vault-muted'
                       }`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={cycleSort}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-vault-border bg-transparent
                     font-mono text-[0.6rem] tracking-[0.12em] uppercase text-vault-muted active:border-vault-gold active:text-vault-gold"
        >
          <svg viewBox="0 0 24 24" className="w-3 h-3 stroke-current fill-none stroke-[1.5]">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          {SORT_LABELS[state.sort]}
        </button>
      </div>

        {/* Gallery */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-[calc(80px+env(safe-area-inset-bottom))]">
        <Gallery onNewAlbum={() => setShowNewAlbum(true)} />
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowUpload(true)}
        className="fixed bottom-[calc(24px+env(safe-area-inset-bottom))] right-5 w-14 h-14 rounded-full
                   bg-vault-gold border-none flex items-center justify-center z-60
                   shadow-[0_4px_20px_rgba(201,168,76,0.4)] active:scale-90 transition-transform"
      >
        <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] stroke-vault-bg fill-none stroke-2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* MultiSelect */}
      <MultiSelectBar />

      {/* Lightbox */}
      <Lightbox />

      {/* Sheets & Modals */}
      <UploadSheet isOpen={showUpload} onClose={() => setShowUpload(false)} />
      <SettingsSheet
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onOpenTL={() => setShowTLModal(true)}
      />
      <NewAlbumModal
        isOpen={showNewAlbum}
        onClose={() => setShowNewAlbum(false)}
      />
      <RenameAlbumModal
        isOpen={!!renameAlbumId}
        onClose={() => setRenameAlbumId(null)}
      />
      <DeleteAlbumModal
        isOpen={!!delAlbumId}
        onClose={() => setDelAlbumId(null)}
      />
      <TimeLockModal
        isOpen={showTLModal}
        onClose={() => setShowTLModal(false)}
      />

      {/* Album action sheet */}
      {state.menuAlbumId && (() => {
        const a = state.albums.find(x => x.id === state.menuAlbumId)
        return (
          <BottomSheet
            isOpen={!!state.menuAlbumId}
            onClose={() => dispatch({ type: 'SET_MENU_ALBUM', id: null })}
            title={a?.name || 'Album'}
          >
            <div
              className="px-3.5 py-3.5 bg-vault-card border border-vault-border rounded-lg cursor-pointer text-[0.72rem] tracking-[0.1em] uppercase flex items-center gap-2.5 active:border-vault-gold active:text-vault-gold"
              onClick={() => {
                setRenameAlbumId(state.menuAlbumId)
                dispatch({ type: 'SET_MENU_ALBUM', id: null })
              }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[1.5]">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Ganti Nama Album
            </div>
            <div
              className="px-3.5 py-3.5 bg-vault-card border border-vault-border rounded-lg cursor-pointer text-[0.72rem] tracking-[0.1em] uppercase flex items-center gap-2.5 active:border-vault-danger active:text-vault-danger"
              onClick={() => {
                setDelAlbumId(state.menuAlbumId)
                dispatch({ type: 'SET_MENU_ALBUM', id: null })
              }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[1.5]">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
              Hapus Album
            </div>
          </BottomSheet>
        )
      })()}
    </div>
  )
}
