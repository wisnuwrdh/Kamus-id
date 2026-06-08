'use client'

import { useState, useRef, useEffect } from 'react'
import { useApp } from '@/lib/store'
import Modal from './Modal'

interface RenameAlbumModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function RenameAlbumModal({ isOpen, onClose }: RenameAlbumModalProps) {
  const { state, actions } = useApp()
  const album = state.albums.find((a) => a.id === state.menuAlbumId)
  const [name, setName] = useState(album?.name || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setName(album?.name || '')
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen, album])

  const handleRename = async () => {
    if (!name.trim() || !state.menuAlbumId) return
    await actions.renameAlbum(state.menuAlbumId, name.trim())
    actions.setMenuAlbum(null)
    setName('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ganti Nama Album">
      <input
        ref={inputRef}
        className="w-full bg-vault-card border border-vault-border rounded-lg px-3.5 py-3 text-vault-text font-mono text-[0.8rem] outline-none focus:border-vault-gold"
        type="text" placeholder="Nama baru..." maxLength={40}
        value={name} onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleRename()}
      />
      <button
        onClick={handleRename}
        className="w-full py-3 bg-vault-gold rounded-lg text-vault-bg font-mono text-[0.72rem] tracking-[0.12em] uppercase active:bg-vault-gold-light"
      >
        Simpan
      </button>
      <button
        onClick={onClose}
        className="w-full py-2.5 bg-transparent border border-vault-border rounded-lg text-vault-muted font-mono text-[0.7rem] tracking-[0.12em] uppercase"
      >
        Batal
      </button>
    </Modal>
  )
}
