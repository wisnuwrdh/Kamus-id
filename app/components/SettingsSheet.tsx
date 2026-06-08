'use client'

import { useState, useRef, useCallback } from 'react'
import { useApp } from '@/lib/store'
import BottomSheet from './BottomSheet'
import Modal from './Modal'
import { ensureVaultDir, listVaultFiles } from '@/lib/storage'

interface SettingsSheetProps {
  isOpen: boolean
  onClose: () => void
  onOpenTL: () => void
}

export default function SettingsSheet({ isOpen, onClose, onOpenTL }: SettingsSheetProps) {
  const { state, dispatch, actions } = useApp()
  const [showChangePIN, setShowChangePIN] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [showBackup, setShowBackup] = useState(false)
  const [backupProgress, setBackupProgress] = useState(0)
  const [backupMsg, setBackupMsg] = useState('')
  const [oldPIN, setOldPIN] = useState('')
  const [newPIN, setNewPIN] = useState('')
  const [confirmPIN, setConfirmPIN] = useState('')
  const restoreInputRef = useRef<HTMLInputElement>(null)

  const handleChangePIN = useCallback(async () => {
    if (oldPIN.length !== 4 || newPIN.length !== 4 || newPIN !== confirmPIN) {
      actions.showToast('❌ PIN tidak valid')
      return
    }
    await actions.setPin(newPIN)
    setShowChangePIN(false)
    setOldPIN('')
    setNewPIN('')
    setConfirmPIN('')
    actions.showToast('✅ PIN berhasil diubah')
  }, [oldPIN, newPIN, confirmPIN, actions])

  const handleBackup = useCallback(async () => {
    if (state.media.length === 0) {
      actions.showToast('Tidak ada data untuk dibackup')
      return
    }
    setShowBackup(true)
    setBackupProgress(0)
    setBackupMsg('Menyiapkan...')

    try {
      const metadata = {
        version: 1,
        created: new Date().toISOString(),
        albums: state.albums,
        media: state.media.map((m) => ({
          id: m.id,
          name: m.name,
          type: m.type,
          mime: m.mime,
          timestamp: m.timestamp,
          date: m.date,
          fav: m.fav,
          size: m.size,
          albumId: m.albumId,
          thumb: m.thumb || null,
        })),
      }

      const encoder = new TextEncoder()
      const chunks: Uint8Array[] = []

      // Helper to push length-prefixed data
      const push = (data: Uint8Array) => {
        const lenBuf = new Uint8Array(4)
        new DataView(lenBuf.buffer).setUint32(0, data.length, true)
        chunks.push(lenBuf, data)
      }

      // Manifest: length-prefixed
      const manifestBytes = encoder.encode(JSON.stringify(metadata))
      push(manifestBytes)

      let done = 0
      for (const m of state.media) {
        setBackupProgress(Math.round((done / state.media.length) * 100))
        setBackupMsg(`Mengemas ${done + 1}/${state.media.length}...`)

        // Push ID (always)
        push(encoder.encode(m.id))

        let blob = m.blob
        if (!blob) {
          blob = await actions.getBlobForMedia(m)
        }
        if (blob) {
          const ab = await blob.arrayBuffer()
          push(new Uint8Array(ab))
        } else {
          push(new Uint8Array(0)) // empty blob
        }
        done++
      }

      setBackupProgress(95)
      setBackupMsg('Menyusun file...')

      const allParts = new Uint8Array(chunks.reduce((sum, c) => sum + c.length, 0))
      let offset = 0
      for (const c of chunks) {
        allParts.set(c, offset)
        offset += c.length
      }

      const d = new Date()
      const fname = `vault-backup-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.vault`

      // Try saving via Capacitor Filesystem (Downloads folder)
      try {
        const mod = await import('@capacitor/filesystem')
        let binary = ''
        const chunkSize = 8192
        for (let i = 0; i < allParts.length; i += chunkSize) {
          binary += String.fromCharCode(...allParts.subarray(i, i + chunkSize))
        }
        const base64 = btoa(binary)
        await mod.Filesystem.writeFile({
          path: fname,
          data: base64,
          directory: mod.Directory.Downloads,
        })
        setBackupProgress(100)
        setBackupMsg(`✅ Tersimpan di folder Downloads/${fname}`)
        setTimeout(() => setShowBackup(false), 2000)
      } catch {
        // Fallback: browser download (dev mode)
        const finalBlob = new Blob([allParts], { type: 'application/octet-stream' })
        const url = URL.createObjectURL(finalBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = fname
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        setTimeout(() => {
          URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }, 3000)

        setBackupProgress(100)
        setBackupMsg('Berhasil! File siap di-download')
        setTimeout(() => setShowBackup(false), 1500)
      }
    } catch (e) {
      console.error('Backup error:', e)
      actions.showToast('❌ Backup gagal: ' + (e as Error).message)
      setShowBackup(false)
    }
  }, [state.media, state.albums, actions])

  const handleRestore = useCallback(async (file: File) => {
    if (!file) return
    setShowBackup(true)
    setBackupProgress(0)
    setBackupMsg('Membaca file backup...')
    try {
      const ab = await file.arrayBuffer()
      const bytes = new Uint8Array(ab)

      // Parse manifest length (first 4 bytes = uint32 LE)
      if (bytes.length < 4) throw new Error('File tidak valid')
      const manifestLen = new DataView(ab, 0, 4).getUint32(0, true)
      const manifestStart = 4
      if (manifestLen < 10 || manifestLen > 10 * 1024 * 1024) throw new Error('Manifest tidak valid')

      // Parse manifest
      const manifestStr = new TextDecoder().decode(bytes.slice(manifestStart, manifestStart + manifestLen))
      const manifest = JSON.parse(manifestStr)
      if (!manifest.version || !Array.isArray(manifest.media)) throw new Error('Format backup tidak dikenal')

      setBackupProgress(20)
      setBackupMsg(`Ditemukan ${manifest.media.length} file, ${manifest.albums?.length || 0} album`)

      // Parse blob data after manifest
      let offset = manifestStart + manifestLen
      const readU32 = () => {
        if (offset + 4 > bytes.length) return null
        const v = new DataView(ab, offset, 4).getUint32(0, true)
        offset += 4
        return v
      }

      // Wirings for restoring: clear DB first
      setBackupProgress(30)
      setBackupMsg('Membersihkan data lama...')
      await new Promise(r => setTimeout(r, 100))

      await actions.clearData()

      setBackupProgress(40)
      setBackupMsg('Memulihkan album...')

      // Restore albums
      if (manifest.albums?.length > 0) {
        const storage = await import('@/lib/storage')
        for (const a of manifest.albums) {
          try { await storage.putAlbum(a) } catch (e) { console.warn('Album restore skip:', e) }
        }
        const restoredAlbums = await storage.getAllAlbums()
        for (const a of restoredAlbums) {
          dispatch({ type: 'ADD_ALBUM', album: a })
        }
      }

      setBackupProgress(50)
      setBackupMsg('Memulihkan file...')

      // Restore media
      let restoredCount = 0
      const mediaMetaList: any[] = []
      for (const meta of manifest.media) {
        const idLen = readU32()
        if (idLen === null) break
        const id = new TextDecoder().decode(bytes.slice(offset, offset + idLen))
        offset += idLen

        const dataLen = readU32()
        if (dataLen === null || offset + dataLen > bytes.length) break

        const item = {
          id,
          name: meta.name,
          type: meta.type,
          mime: meta.mime,
          timestamp: meta.timestamp,
          date: meta.date,
          fav: meta.fav || false,
          size: meta.size || 0,
          albumId: meta.albumId || null,
          thumb: meta.thumb || null,
        }

        if (dataLen > 0) {
          const dataBytes = bytes.slice(offset, offset + dataLen)
          offset += dataLen
          const blob = new Blob([dataBytes], { type: meta.mime || 'application/octet-stream' })

          const storageMod = await import('@/lib/storage')
          const ok = await storageMod.saveBlob(id, blob)
          if (ok) {
            await storageMod.putMedia({ ...item, blob: null })
          } else {
            await storageMod.putMedia({ ...item, blob })
          }
        } else {
          offset += 0
          const storageMod = await import('@/lib/storage')
          await storageMod.putMedia({ ...item, blob: null })
        }

        mediaMetaList.push({ ...item, blob: null })
        restoredCount++

        if (restoredCount % 3 === 0) {
          setBackupProgress(50 + (restoredCount / manifest.media.length) * 40)
          setBackupMsg(`Memulihkan ${restoredCount}/${manifest.media.length}...`)
          await new Promise(r => setTimeout(r, 0))
        }
      }

      // Reload semua media ke state
      const storageReload = await import('@/lib/storage')
      const allMediaNew = await storageReload.getAllMedia()
      allMediaNew.sort((a: any, b: any) => b.timestamp - a.timestamp)
      if (allMediaNew.length > 0) {
        dispatch({ type: 'ADD_MEDIA', items: allMediaNew })
      }

      setBackupProgress(100)
      setBackupMsg(`✅ ${restoredCount} file & ${manifest.albums?.length || 0} album dipulihkan!`)
      setTimeout(() => {
        setShowBackup(false)
        actions.showToast('✅ Restore berhasil!')
      }, 1500)
    } catch (e) {
      console.error('Restore error:', e)
      setShowBackup(false)
      actions.showToast('❌ Restore gagal: ' + (e as Error).message)
    }
  }, [actions, dispatch])

  const handleReset = useCallback(async () => {
    await actions.clearData()
    setShowReset(false)
    onClose()
  }, [actions, onClose])

  const hasTimeLock = state.timeLock && Date.now() < state.timeLock.unlockAt

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} title="Pengaturan">
        <div className="flex flex-col gap-2">
          <ActionItem
            label="Time-Lock Vault"
            onClick={() => { onOpenTL(); onClose() }}
            badge={hasTimeLock ? 'Aktif' : undefined}
            badgeClass="text-vault-gold border-vault-gold bg-vault-gold-dim"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[1.5]">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </ActionItem>

          <ActionItem label="Ganti PIN" onClick={() => setShowChangePIN(true)}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[1.5]">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </ActionItem>

          <ActionItem label="Backup Data" onClick={handleBackup}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[1.5]">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </ActionItem>

          <ActionItem label="Pulihkan dari Backup" onClick={() => restoreInputRef.current?.click()}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[1.5]">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </ActionItem>

          <ActionItem label="Reset Semua Data" onClick={() => setShowReset(true)} danger>
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[1.5]">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
          </ActionItem>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-transparent border border-vault-border rounded-lg text-vault-muted
                     font-mono text-[0.7rem] tracking-[0.12em] uppercase"
        >
          Tutup
        </button>
      </BottomSheet>

      <input
        ref={restoreInputRef}
        type="file"
        accept=".vault"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleRestore(e.target.files[0])}
      />

      {/* Change PIN Modal */}
      <Modal isOpen={showChangePIN} onClose={() => setShowChangePIN(false)} title="Ganti PIN">
        <div>
          <div className="text-[0.6rem] text-vault-muted tracking-[0.1em] uppercase mb-1.5">PIN Lama</div>
          <input
            className="w-full bg-vault-card border border-vault-border rounded-lg px-3.5 py-3 text-vault-text font-mono text-[0.8rem] outline-none focus:border-vault-gold"
            type="password" inputMode="numeric" maxLength={4} placeholder="••••"
            value={oldPIN} onChange={(e) => setOldPIN(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
        </div>
        <div>
          <div className="text-[0.6rem] text-vault-muted tracking-[0.1em] uppercase mb-1.5">PIN Baru</div>
          <input
            className="w-full bg-vault-card border border-vault-border rounded-lg px-3.5 py-3 text-vault-text font-mono text-[0.8rem] outline-none focus:border-vault-gold"
            type="password" inputMode="numeric" maxLength={4} placeholder="••••"
            value={newPIN} onChange={(e) => setNewPIN(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
        </div>
        <div>
          <div className="text-[0.6rem] text-vault-muted tracking-[0.1em] uppercase mb-1.5">Konfirmasi PIN Baru</div>
          <input
            className="w-full bg-vault-card border border-vault-border rounded-lg px-3.5 py-3 text-vault-text font-mono text-[0.8rem] outline-none focus:border-vault-gold"
            type="password" inputMode="numeric" maxLength={4} placeholder="••••"
            value={confirmPIN} onChange={(e) => setConfirmPIN(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
        </div>
        <button
          onClick={handleChangePIN}
          className="w-full py-3 bg-vault-gold rounded-lg text-vault-bg font-mono text-[0.72rem] tracking-[0.12em] uppercase active:bg-vault-gold-light"
        >
          Simpan PIN Baru
        </button>
        <button
          onClick={() => setShowChangePIN(false)}
          className="w-full py-2.5 bg-transparent border border-vault-border rounded-lg text-vault-muted font-mono text-[0.7rem] tracking-[0.12em] uppercase"
        >
          Batal
        </button>
      </Modal>

      {/* Backup Progress Modal */}
      <Modal isOpen={showBackup} onClose={() => setShowBackup(false)} title="Backup Data">
        <div className="w-full bg-vault-border rounded h-1.5 overflow-hidden">
          <div className="h-full bg-vault-gold rounded transition-all duration-300" style={{ width: `${backupProgress}%` }} />
        </div>
        <p className="text-[0.65rem] text-vault-muted tracking-[0.08em] text-center">{backupMsg}</p>
      </Modal>

      {/* Reset Modal */}
      <Modal isOpen={showReset} onClose={() => setShowReset(false)} title="Reset Semua Data">
        <p className="text-[0.7rem] text-vault-muted tracking-[0.08em] leading-[1.6]">
          Semua foto, video, album, dan pengaturan akan dihapus permanen.
          Tindakan ini{' '}
          <strong className="text-vault-danger">tidak bisa dibatalkan</strong>.
          <br /><br />
          Pastikan kamu sudah backup sebelum melanjutkan.
        </p>
        <button
          onClick={handleReset}
          className="w-full py-2.5 bg-transparent border border-vault-danger rounded-lg text-vault-danger font-mono text-[0.7rem] tracking-[0.12em] uppercase active:bg-vault-danger active:text-white"
        >
          Ya, Hapus Semua Data
        </button>
        <button
          onClick={() => setShowReset(false)}
          className="w-full py-2.5 bg-transparent border border-vault-border rounded-lg text-vault-muted font-mono text-[0.7rem] tracking-[0.12em] uppercase"
        >
          Batal
        </button>
      </Modal>
    </>
  )
}

function ActionItem({
  label,
  onClick,
  children,
  danger,
  badge,
  badgeClass,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  danger?: boolean
  badge?: string
  badgeClass?: string
}) {
  return (
    <div
      onClick={onClick}
      className={`px-3.5 py-3.5 bg-vault-card border border-vault-border rounded-lg cursor-pointer text-[0.72rem] 
                  tracking-[0.1em] uppercase flex items-center gap-2.5 transition-all duration-200
                  ${danger ? 'active:border-vault-danger active:text-vault-danger' : 'active:border-vault-gold active:text-vault-gold'}`}
    >
      <span className="text-inherit">{children}</span>
      <span className="flex-1">{label}</span>
      {badge && (
        <span className={`text-[0.55rem] px-2 py-0.5 rounded-full border ${badgeClass || 'text-vault-muted border-vault-border'}`}>
          {badge}
        </span>
      )}
    </div>
  )
}
