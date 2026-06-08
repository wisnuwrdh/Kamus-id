'use client'

import { useState, useRef, useEffect } from 'react'
import { useApp } from '@/lib/store'
import Modal from './Modal'

interface NewAlbumModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function NewAlbumModal({ isOpen, onClose }: NewAlbumModalProps) {
  const { actions } = useApp()
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setName('')
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const handleCreate = async () => {
    if (!name.trim()) return
    await actions.createAlbum(name.trim())
    setName('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Album Baru">
      <input
        ref={inputRef}
        className="w-full bg-vault-card border border-vault-border rounded-lg px-3.5 py-3 text-vault-text font-mono text-[0.8rem] outline-none focus:border-vault-gold"
        type="text" placeholder="Nama album..." maxLength={40}
        value={name} onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
      />
      <button
        onClick={handleCreate}
        className="w-full py-3 bg-vault-gold rounded-lg text-vault-bg font-mono text-[0.72rem] tracking-[0.12em] uppercase active:bg-vault-gold-light"
      >
        Buat Album
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
