'use client'

import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/lib/store'
import { fmtDateTime } from '@/lib/utils'
import { getLastClock, setLastClock } from '@/lib/storage'

export default function TimeLockOverlay() {
  const { state } = useApp()
  const [now, setNow] = useState(Date.now())
  const [clockTampered, setClockTampered] = useState(false)
  const tl = state.timeLock

  // Detect clock manipulation
  useEffect(() => {
    const lastClock = getLastClock()
    const current = Date.now()
    if (lastClock > 0 && current < lastClock) {
      setClockTampered(true)
    }
    setLastClock(current)
  }, [])

  const isActive = clockTampered || (tl && now < tl.unlockAt)

  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [isActive])

  if (!isActive) return null

  const diff = tl ? tl.unlockAt - now : 0
  const days = Math.max(0, Math.floor(diff / 86400000))
  const hours = Math.max(0, Math.floor((diff % 86400000) / 3600000))
  const mins = Math.max(0, Math.floor((diff % 3600000) / 60000))
  const secs = Math.max(0, Math.floor((diff % 60000) / 1000))
  const total = tl ? tl.unlockAt - tl.startAt : 1
  const passed = now - (tl ? tl.startAt : now)
  const pct = total > 0 ? Math.min(100, Math.max(0, (passed / total) * 100)) : 0

  const CountdownBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center gap-1.5 bg-vault-card border border-vault-border rounded-xl py-2.5 px-1.5">
      <span className="font-display text-[2rem] text-vault-green leading-none">{String(value).padStart(2, '0')}</span>
      <span className="text-[0.48rem] text-vault-muted tracking-[0.2em] uppercase">{label}</span>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-vault-bg">
      {/* App bar */}
      <div className="bg-vault-green px-4 pt-[calc(10px+env(safe-area-inset-top))] pb-2.5 flex items-center gap-3 flex-shrink-0">
        <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-white fill-none stroke-[1.5] flex-shrink-0">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <span className="text-white font-display text-[1.1rem] tracking-[0.04em]">Kamus ID</span>
        <span className="text-white/60 text-[0.55rem] tracking-[0.15em] uppercase ml-auto">Indonesia · Inggris</span>
      </div>

      {/* Search bar disabled */}
      <div className="bg-vault-green-dark px-3.5 py-2 flex-shrink-0">
        <div className="bg-white rounded-full flex items-center px-3.5 py-2 gap-2.5 opacity-60">
          <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-[#888] fill-none stroke-2 flex-shrink-0">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="flex-1 text-[#aaa] font-mono text-[0.78rem]">Pencarian tidak tersedia...</span>
          <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-[#888] fill-none stroke-2 flex-shrink-0">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 gap-3.5 overflow-hidden">
        {/* Word card */}
        <div className="w-full bg-vault-card border border-vault-border rounded-xl px-3.5 py-3 flex-shrink-0">
          <div className="flex items-baseline gap-2.5 mb-1">
            <span className="font-display text-[1.15rem] text-vault-text">{clockTampered ? 'dicurangi' : 'terkunci'}</span>
            <span className="text-[0.6rem] text-vault-green tracking-[0.05em]">• {clockTampered ? 'di·cu·rangi' : 'ter·kun·ci'} •</span>
          </div>
          <div className="text-[0.6rem] text-vault-muted mb-1">adjective</div>
          <div className="text-[0.72rem] text-vault-text leading-[1.55]">
            {clockTampered
              ? 'Terdeteksi perubahan jam pada perangkat. Vault tetap dikunci untuk keamanan.'
              : 'Dalam keadaan dikunci; tidak dapat dibuka sampai waktu yang ditentukan tiba.'}
          </div>
          <div className="text-[0.65rem] text-vault-muted mt-1.5 italic leading-[1.5]">
            {clockTampered
              ? '&ldquo;Keamanan adalah prioritas — jangan coba-coba.&rdquo;'
              : '&ldquo;Pintu itu masih <span className="text-vault-green">terkunci</span> — bersabar menunggu waktunya.&rdquo;'}
          </div>
        </div>

        {!clockTampered && tl && (
          <>
            {/* Separator */}
            <div className="w-full flex items-center gap-2">
              <div className="flex-1 h-px bg-vault-border" />
              <span className="text-[0.5rem] text-vault-muted tracking-[0.2em] uppercase">Hitung Mundur</span>
              <div className="flex-1 h-px bg-vault-border" />
            </div>

            {/* Countdown grid */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-[320px]">
              <CountdownBlock value={days} label="Hari" />
              <CountdownBlock value={hours} label="Jam" />
              <CountdownBlock value={mins} label="Menit" />
              <CountdownBlock value={secs} label="Detik" />
            </div>

            {/* Unlock info */}
            <div className="w-full bg-vault-card border border-[#1a3d2b] rounded-xl p-2.5 flex flex-col gap-1">
              <span className="text-[0.52rem] text-vault-muted tracking-[0.18em] uppercase">Vault bisa dibuka pada</span>
              <span className="text-[0.72rem] text-[#4caf7d] tracking-[0.04em] font-medium">{fmtDateTime(tl.unlockAt)}</span>
              <div className="w-full bg-vault-border rounded h-[3px] overflow-hidden mt-1.5">
                <div className="h-full bg-vault-green rounded transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </>
        )}

        <div className="text-[0.52rem] text-vault-muted tracking-[0.12em] text-center leading-[1.8] pb-[calc(10px+env(safe-area-inset-bottom))]">
          Kamus ID — menjaga privasi Anda
          <br />
          Numpad dinonaktifkan sementara
        </div>
      </div>
    </div>
  )
}
