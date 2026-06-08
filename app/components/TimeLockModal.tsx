'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '@/lib/store'
import { fmtDateTime } from '@/lib/utils'
import Modal from './Modal'

interface TimeLockModalProps {
  isOpen: boolean
  onClose: () => void
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export default function TimeLockModal({ isOpen, onClose }: TimeLockModalProps) {
  const { state, actions } = useApp()

  const tl = state.timeLock
  const isActive = tl && Date.now() < tl.unlockAt

  // Picker state — default: now + 1hr
  const now = new Date()
  const [day, setDay] = useState(now.getDate())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [hour, setHour] = useState(now.getHours())
  const [min, setMin] = useState(now.getMinutes())
  const [sec, setSec] = useState(now.getSeconds())

  useEffect(() => {
    if (isOpen) {
      const d = new Date(Date.now() + 3600000)
      setDay(d.getDate())
      setMonth(d.getMonth() + 1)
      setYear(d.getFullYear())
      setHour(d.getHours())
      setMin(d.getMinutes())
      setSec(d.getSeconds())
    }
  }, [isOpen])

  const getTargetDate = useCallback(() => {
    return new Date(year, month - 1, day, hour, min, sec)
  }, [year, month, day, hour, min, sec])

  const handleSave = async () => {
    const target = getTargetDate()
    if (target.getTime() <= Date.now()) {
      actions.showToast('⚠️ Waktu harus di masa depan')
      return
    }
    await actions.setTimeLock({
      unlockAt: target.getTime(),
      startAt: Date.now(),
    })
    actions.showToast('🔒 Time-Lock aktif! Terkunci sampai ' + fmtDateTime(target.getTime()))
    onClose()
  }

  const handleRemove = async () => {
    await actions.setTimeLock(null)
    actions.showToast('🔓 Time-Lock dihapus')
    onClose()
  }

  const setPreset = (amount: number, unit: 'hour' | 'day' | 'week' | 'month') => {
    const d = new Date()
    if (unit === 'hour') d.setHours(d.getHours() + amount)
    else if (unit === 'day') d.setDate(d.getDate() + amount)
    else if (unit === 'week') d.setDate(d.getDate() + amount * 7)
    else if (unit === 'month') d.setMonth(d.getMonth() + amount)
    setDay(d.getDate())
    setMonth(d.getMonth() + 1)
    setYear(d.getFullYear())
    setHour(d.getHours())
    setMin(d.getMinutes())
    setSec(d.getSeconds())
  }

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
  const maxDay = new Date(year, month, 0).getDate()
  const days = clamp(day, 1, maxDay)

  const preview = getTargetDate()
  const previewStr =
    preview.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) +
    '  ' +
    String(hour).padStart(2, '0') +
    ':' +
    String(min).padStart(2, '0') +
    ':' +
    String(sec).padStart(2, '0')

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⏳ Time-Lock Vault">
      {/* Current lock status */}
      {isActive && tl && (
        <div className="w-full bg-vault-card border border-vault-border rounded-lg p-2.5 flex items-center justify-between gap-2">
          <div>
            <span className="text-[0.52rem] text-vault-muted tracking-[0.15em] uppercase block">Terkunci sampai</span>
            <strong className="text-vault-gold text-[0.72rem]">{fmtDateTime(tl.unlockAt)}</strong>
          </div>
          <button
            onClick={handleRemove}
            className="px-3 py-1.5 bg-transparent border border-vault-danger rounded-lg text-vault-danger font-mono text-[0.6rem] whitespace-nowrap flex-shrink-0"
          >
            Hapus
          </button>
        </div>
      )}

      {/* Presets */}
      <div>
        <div className="text-[0.52rem] text-vault-muted tracking-[0.18em] uppercase mb-1.5">Preset Cepat</div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            [1, 'hour', '+1 Jam'],
            [6, 'hour', '+6 Jam'],
            [12, 'hour', '+12 Jam'],
            [1, 'day', '+1 Hari'],
            [3, 'day', '+3 Hari'],
            [1, 'week', '+1 Minggu'],
            [2, 'week', '+2 Minggu'],
            [1, 'month', '+1 Bulan'],
            [3, 'month', '+3 Bulan'],
          ].map(([amt, unit, label]) => (
            <button
              key={label as string}
              onClick={() => setPreset(amt as number, unit as 'hour' | 'day' | 'week' | 'month')}
              className="px-3 py-2 rounded-lg border border-vault-border bg-vault-card text-vault-text font-mono text-[0.68rem] 
                         tracking-[0.06em] transition-all active:border-vault-green active:text-[#4caf7d] active:bg-[rgba(26,107,60,0.15)]"
            >
              {label as string}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Picker */}
      <div>
        <div className="text-[0.52rem] text-vault-muted tracking-[0.18em] uppercase mb-2">Pilih Waktu Spesifik</div>

        {/* Date */}
        <div className="text-[0.5rem] text-vault-muted tracking-[0.15em] uppercase text-center mb-1">Tanggal</div>
        <div className="flex gap-1 items-center mb-2">
          <StepperInput
            value={days}
            min={1}
            max={maxDay}
            onChange={(v) => setDay(v)}
            format={(v) => String(v).padStart(2, '0')}
          />
          <span className="font-display text-[1.2rem] text-vault-border flex-shrink-0">/</span>
          <StepperInput
            value={month}
            min={1}
            max={12}
            onChange={(v) => {
              setMonth(v)
              const md = new Date(year, v, 0).getDate()
              if (day > md) setDay(md)
            }}
            format={(v) => MONTHS_SHORT[v - 1]}
            wide
          />
          <span className="font-display text-[1.2rem] text-vault-border flex-shrink-0">/</span>
          <StepperInput
            value={year}
            min={2024}
            max={2099}
            onChange={(v) => setYear(v)}
            format={(v) => String(v)}
            wide
          />
        </div>

        {/* Time */}
        <div className="text-[0.5rem] text-vault-muted tracking-[0.15em] uppercase text-center mb-1 mt-1">Waktu</div>
        <div className="flex gap-1 items-center">
          <StepperInput
            value={hour}
            min={0}
            max={23}
            onChange={(v) => setHour(v)}
            format={(v) => String(v).padStart(2, '0')}
          />
          <span className="font-display text-[1.2rem] text-vault-border flex-shrink-0">:</span>
          <StepperInput
            value={min}
            min={0}
            max={59}
            onChange={(v) => setMin(v)}
            format={(v) => String(v).padStart(2, '0')}
          />
          <span className="font-display text-[1.2rem] text-vault-border flex-shrink-0">:</span>
          <StepperInput
            value={sec}
            min={0}
            max={59}
            onChange={(v) => setSec(v)}
            format={(v) => String(v).padStart(2, '0')}
          />
        </div>

        {/* Preview */}
        <div className="mt-2 bg-vault-gold-dim border border-vault-gold-dim rounded-lg px-3.5 py-2.5 text-[0.72rem] text-vault-gold tracking-[0.06em] text-center">
          🔒 {previewStr}
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-3 bg-vault-gold rounded-lg text-vault-bg font-mono text-[0.72rem] tracking-[0.12em] uppercase active:bg-vault-gold-light"
      >
        🔒 Aktifkan Time-Lock
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

function StepperInput({
  value,
  min,
  max,
  onChange,
  format,
  wide,
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  format: (v: number) => string
  wide?: boolean
}) {
  const step = (delta: number) => {
    const next = value + delta
    onChange(next > max ? min : next < min ? max : next)
  }
  return (
    <div className={`flex-1 ${wide ? 'flex-[1.6]' : ''} flex items-center h-10 bg-vault-card border border-vault-border rounded-lg overflow-hidden`}>
      <button
        onClick={() => step(-1)}
        className="w-7 h-full flex items-center justify-center text-vault-muted active:text-vault-gold flex-shrink-0"
      >
        <svg viewBox="0 0 24 24" className="w-3 h-3 stroke-current fill-none stroke-[1.5]">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <div className="flex-1 flex items-center justify-center font-display text-[1rem] text-vault-gold">
        {format(value)}
      </div>
      <button
        onClick={() => step(1)}
        className="w-7 h-full flex items-center justify-center text-vault-muted active:text-vault-gold flex-shrink-0"
      >
        <svg viewBox="0 0 24 24" className="w-3 h-3 stroke-current fill-none stroke-[1.5]">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  )
}
