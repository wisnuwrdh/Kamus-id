'use client'

import { useCallback } from 'react'
import { useApp } from '@/lib/store'
import BottomSheet from './BottomSheet'

interface MoveAlbumSheetProps {
  isOpen: boolean
  onClose: () => void
  mediaId: string
}

export default function MoveAlbumSheet({ isOpen, onClose, mediaId }: MoveAlbumSheetProps) {
  const { state, actions } = useApp()
  const m = state.media.find((x) => x.id === mediaId)
  const curAlb = m?.albumId || null

  const handleMove = useCallback(
    async (albumId: string | null) => {
      await actions.bulkMove([mediaId], albumId)
      onClose()
    },
    [mediaId, actions, onClose]
  )

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Pindah ke Album">
      <div className="flex flex-col gap-1.5 max-h-[40dvh] overflow-y-auto no-scrollbar">
        <div
          className={`px-3.5 py-3 bg-vault-card border rounded-lg cursor-pointer text-[0.7rem] flex items-center justify-between
                      ${!curAlb ? 'border-vault-gold text-vault-gold' : 'border-vault-border text-vault-text'}`}
          onClick={() => handleMove(null)}
        >
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.5]">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            Tanpa Album
          </span>
          <span className="text-[0.58rem] text-vault-muted">
            {!curAlb ? '✓ Sekarang' : ''}
          </span>
        </div>
        {state.albums.map((a) => (
          <div
            key={a.id}
            className={`px-3.5 py-3 bg-vault-card border rounded-lg cursor-pointer text-[0.7rem] flex items-center justify-between
                        ${curAlb === a.id ? 'border-vault-gold text-vault-gold' : 'border-vault-border text-vault-text'}`}
            onClick={() => handleMove(a.id)}
          >
            <span className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.5]">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              {a.name}
            </span>
            <span className="text-[0.58rem] text-vault-muted">
              {curAlb === a.id
                ? '✓ Sekarang'
                : `${state.media.filter((x) => x.albumId === a.id).length} file`}
            </span>
          </div>
        ))}
      </div>
    </BottomSheet>
  )
}
