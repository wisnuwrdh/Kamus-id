'use client'

import { useCallback } from 'react'
import { useApp } from '@/lib/store'
import Modal from './Modal'

interface DeleteAlbumModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DeleteAlbumModal({ isOpen, onClose }: DeleteAlbumModalProps) {
  const { state, actions } = useApp()
  const album = state.albums.find((a) => a.id === state.menuAlbumId)
  const cnt = state.media.filter((m) => m.albumId === state.menuAlbumId).length

  const handleDelete = useCallback(async () => {
    if (!state.menuAlbumId) return
    await actions.deleteAlbumAction(state.menuAlbumId)
    actions.setMenuAlbum(null)
    onClose()
  }, [state.menuAlbumId, actions, onClose])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hapus Album">
      <p className="text-[0.7rem] text-vault-muted tracking-[0.08em] leading-[1.6]">
        Yakin hapus album &ldquo;{album?.name || 'ini'}&rdquo;?
        {cnt > 0
          ? ` Semua ${cnt} file di dalamnya juga akan ikut terhapus permanen.`
          : ' Album kosong, langsung dihapus.'}
      </p>
      <button
        onClick={handleDelete}
        className="w-full py-2.5 bg-transparent border border-vault-danger rounded-lg text-vault-danger font-mono text-[0.7rem] tracking-[0.12em] uppercase active:bg-vault-danger active:text-white"
      >
        Ya, Hapus Album
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
