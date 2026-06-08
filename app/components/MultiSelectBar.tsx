'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import { useApp } from '@/lib/store'
import BottomSheet from './BottomSheet'
import Modal from './Modal'

export default function MultiSelectBar() {
  const { state, dispatch, actions } = useApp()
  const [showMove, setShowMove] = useState(false)
  const [showConfirmDel, setShowConfirmDel] = useState(false)
  const multiRef = useRef(state.multiSelect)
  useEffect(() => { multiRef.current = state.multiSelect }, [state.multiSelect])

  const count = state.multiSelect.size

  const handleSelectAll = useCallback(() => {
    const list = actions.getFilteredMedia()
    if (multiRef.current.size === list.length) {
      dispatch({ type: 'CLEAR_MULTI' })
    } else {
      dispatch({ type: 'SET_ALL_MULTI', ids: list.map((m) => m.id) })
    }
  }, [actions, dispatch])

  const handleCancel = useCallback(() => {
    dispatch({ type: 'CLEAR_MULTI' })
  }, [dispatch])

  const handleDelete = useCallback(async () => {
    const ids = Array.from(multiRef.current)
    await actions.bulkDelete(ids)
  }, [actions])

  const handleBulkMove = useCallback(
    async (albumId: string | null) => {
      const ids = Array.from(multiRef.current)
      await actions.bulkMove(ids, albumId)
      setShowMove(false)
    },
    [actions]
  )

  if (count === 0) return null

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-vault-surface border-t border-vault-gold z-65
                      px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 flex items-center justify-between
                      animate-slide-up">
        <span className="text-[0.7rem] text-vault-gold tracking-[0.1em]">{count} dipilih</span>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="px-3.5 py-2 bg-transparent border border-vault-muted rounded-lg text-vault-muted font-mono text-[0.62rem]"
          >
            <svg viewBox="0 0 24 24" className="w-[13px] h-[13px] stroke-current fill-none stroke-2 inline-block align-middle mr-1">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <polyline points="9 11 12 14 22 4" />
            </svg>
            {count === actions.getFilteredMedia().length ? 'Batal Semua' : 'Semua'}
          </button>
          <button
            onClick={handleCancel}
            className="px-3.5 py-2 bg-transparent border border-vault-border rounded-lg text-vault-muted font-mono text-[0.62rem]"
          >
            Batal
          </button>
          <button
            onClick={() => setShowMove(true)}
            className="px-3.5 py-2 bg-transparent border border-vault-gold rounded-lg text-vault-gold font-mono text-[0.62rem]"
          >
            <svg viewBox="0 0 24 24" className="w-[13px] h-[13px] stroke-current fill-none stroke-2 inline-block align-middle mr-1">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            Pindah
          </button>
          <button
            onClick={() => setShowConfirmDel(true)}
            className="px-3.5 py-2 bg-transparent border border-vault-danger rounded-lg text-vault-danger font-mono text-[0.62rem]"
          >
            <svg viewBox="0 0 24 24" className="w-[13px] h-[13px] stroke-current fill-none stroke-2 inline-block align-middle mr-1">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
            Hapus
          </button>
        </div>
      </div>

      <BottomSheet isOpen={showMove} onClose={() => setShowMove(false)} title="Pindah ke Album">
        <div className="flex flex-col gap-1.5 max-h-[40dvh] overflow-y-auto no-scrollbar">
          <div
            className="px-3.5 py-3 bg-vault-card border border-vault-border rounded-lg cursor-pointer text-[0.7rem] flex items-center gap-1.5"
            onClick={() => handleBulkMove(null)}
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.5]">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            Tanpa Album
          </div>
          {state.albums.map((a) => (
            <div
              key={a.id}
              className="px-3.5 py-3 bg-vault-card border border-vault-border rounded-lg cursor-pointer text-[0.7rem] flex items-center justify-between"
              onClick={() => handleBulkMove(a.id)}
            >
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.5]">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                {a.name}
              </span>
              <span className="text-[0.58rem] text-vault-muted">
                {state.media.filter((x) => x.albumId === a.id).length} file
              </span>
            </div>
          ))}
        </div>
      </BottomSheet>

      {/* Delete confirmation */}
      <Modal isOpen={showConfirmDel} onClose={() => setShowConfirmDel(false)} title="Hapus File">
        <p className="text-[0.65rem] text-vault-muted tracking-[0.08em] leading-[1.6]">
          Yakin hapus <strong className="text-vault-text">{multiRef.current.size} file</strong>?<br />
          File akan terhapus permanen dari vault.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setShowConfirmDel(false)}
            className="flex-1 py-3 bg-transparent border border-vault-border rounded-lg text-vault-muted font-mono text-[0.68rem] tracking-[0.1em] uppercase active:border-vault-text"
          >
            Batal
          </button>
          <button
            onClick={() => {
              setShowConfirmDel(false)
              handleDelete()
            }}
            className="flex-1 py-3 bg-vault-danger rounded-lg text-white font-mono text-[0.68rem] tracking-[0.1em] uppercase active:opacity-80"
          >
            Ya, Hapus
          </button>
        </div>
      </Modal>
    </>
  )
}
