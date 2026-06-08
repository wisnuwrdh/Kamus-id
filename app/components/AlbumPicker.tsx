'use client'

import BottomSheet from './BottomSheet'

interface AlbumPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (albumId: string | null) => void
}

export default function AlbumPicker({ isOpen, onClose, onSelect }: AlbumPickerProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Simpan ke Album">
      <div className="flex flex-col gap-1.5 max-h-[40dvh] overflow-y-auto no-scrollbar">
        <div
          className="px-3.5 py-3 bg-vault-card border border-vault-border rounded-lg cursor-pointer text-[0.7rem] hover:border-vault-gold"
          onClick={() => {
            onSelect(null)
            onClose()
          }}
        >
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.5]">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            Tanpa Album
          </span>
        </div>
        {/* Albums would be mapped here */}
      </div>
    </BottomSheet>
  )
}
