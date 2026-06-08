'use client'

import { useRef, useCallback, useState } from 'react'
import { useApp } from '@/lib/store'
import BottomSheet from './BottomSheet'

interface UploadSheetProps {
  isOpen: boolean
  onClose: () => void
}

export default function UploadSheet({ isOpen, onClose }: UploadSheetProps) {
  const { state, actions } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showAlbumPicker, setShowAlbumPicker] = useState(false)

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      setUploading(true)
      await actions.uploadFiles(Array.from(files), selectedAlbum)
      setUploading(false)
      onClose()
      actions.showToast(`${files.length} file ditambahkan`)
    },
    [selectedAlbum, actions, onClose]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.gif"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <BottomSheet isOpen={isOpen} onClose={onClose} title="Tambah ke Vault" subtitle="FOTO · VIDEO · GIF · TERSEMBUNYI DARI GALERI">
        {/* Album selector */}
        {!showAlbumPicker ? (
          <div
            className="bg-vault-card border border-vault-border rounded-lg px-3.5 py-2.5 flex items-center justify-between cursor-pointer active:border-vault-gold"
            onClick={() => setShowAlbumPicker(true)}
          >
            <span className="text-[0.7rem] flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.5]">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              {selectedAlbum
                ? state.albums.find((a) => a.id === selectedAlbum)?.name || 'Tanpa Album'
                : 'Tanpa Album'}
            </span>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-vault-muted fill-none stroke-[1.5]">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        ) : (
          <div className="flex flex-col gap-1 max-h-[40dvh] overflow-y-auto no-scrollbar">
            <div
              className={`px-3.5 py-3 bg-vault-card border rounded-lg cursor-pointer text-[0.7rem] flex items-center gap-2 ${!selectedAlbum ? 'border-vault-gold text-vault-gold' : 'border-vault-border'}`}
              onClick={() => { setSelectedAlbum(null); setShowAlbumPicker(false) }}
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.5]">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              Tanpa Album
            </div>
            {state.albums.map((a) => (
              <div
                key={a.id}
                className={`px-3.5 py-3 bg-vault-card border rounded-lg cursor-pointer text-[0.7rem] flex items-center justify-between ${selectedAlbum === a.id ? 'border-vault-gold text-vault-gold' : 'border-vault-border'}`}
                onClick={() => { setSelectedAlbum(a.id); setShowAlbumPicker(false) }}
              >
                <span className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.5]">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  {a.name}
                </span>
                <span className="text-[0.58rem] text-vault-muted">{state.media.filter(x => x.albumId === a.id).length} file</span>
              </div>
            ))}
          </div>
        )}

        {/* Drop zone */}
        <div
          className={`border-[1.5px] border-dashed rounded-xl py-6 px-5 flex flex-col items-center gap-2.5 transition-all duration-200
                      ${dragOver ? 'border-vault-gold bg-vault-gold-dim' : 'border-vault-border'}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <svg viewBox="0 0 24 24" className="w-[30px] h-[30px] stroke-vault-muted fill-none stroke-[1]">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p className="text-[0.62rem] text-vault-muted tracking-[0.1em] text-center">Seret & lepas file di sini</p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full py-3 bg-vault-gold rounded-lg text-vault-bg font-mono text-[0.72rem]
                     tracking-[0.12em] uppercase active:bg-vault-gold-light active:scale-[0.98] disabled:opacity-50"
        >
          {uploading ? 'Mengupload...' : 'Pilih File'}
        </button>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-transparent border border-vault-border rounded-lg text-vault-muted
                     font-mono text-[0.7rem] tracking-[0.12em] uppercase active:border-vault-danger active:text-vault-danger"
        >
          Batal
        </button>
      </BottomSheet>
    </>
  )
}
