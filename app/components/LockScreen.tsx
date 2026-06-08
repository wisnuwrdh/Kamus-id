'use client'

import { useState, useCallback, useEffect } from 'react'
import { useApp } from '@/lib/store'

export default function LockScreen() {
  const { state, actions } = useApp()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [isFirstLaunch, setIsFirstLaunch] = useState(false)
  const [setupPin, setSetupPin] = useState('')
  const [setupConfirm, setSetupConfirm] = useState('')
  const [setupStep, setSetupStep] = useState<'initial' | 'confirm'>('initial')

  useEffect(() => {
    if (!state.pin) {
      setIsFirstLaunch(true)
    }
  }, [state.pin])

  const handleNum = useCallback(
    (n: string) => {
      if (isFirstLaunch) return
      if (pin.length >= 4) return
      const newPin = pin + n
      setPin(newPin)
      if (newPin.length === 4) {
        setTimeout(async () => {
          const ok = await actions.checkPin(newPin)
          if (!ok) {
            setError(true)
            if (navigator.vibrate) navigator.vibrate([80, 40, 80])
            setTimeout(() => {
              setPin('')
              setError(false)
            }, 600)
          }
        }, 150)
      }
    },
    [pin, actions, isFirstLaunch]
  )

  const handleDel = useCallback(() => {
    if (isFirstLaunch) return
    setPin((p) => p.slice(0, -1))
  }, [isFirstLaunch])

  const handleSetup = useCallback(async () => {
    if (setupStep === 'initial') {
      if (setupPin.length !== 4) return
      setSetupStep('confirm')
    } else {
      if (setupPin !== setupConfirm) {
        if (navigator.vibrate) navigator.vibrate([80, 40, 80])
        return
      }
      await actions.setPin(setupPin)
      setIsFirstLaunch(false)
      await actions.checkPin(setupPin)
    }
  }, [setupStep, setupPin, setupConfirm, actions])

  const fakeWords = ['', 'm', 'mu', 'mus', 'musk']

  if (isFirstLaunch) {
    return (
      <div className="fixed inset-0 z-[100] bg-vault-bg flex flex-col">
        <AppBar />
        <FirstLaunchStep
          setupPin={setupPin}
          setSetupPin={setSetupPin}
          setupConfirm={setupConfirm}
          setSetupConfirm={setSetupConfirm}
          setupStep={setupStep}
          handleSetup={handleSetup}
        />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] bg-vault-bg flex flex-col">
      <AppBar />
      <SearchBar pin={pin} />
      <WordOfTheDay />
      <Numpad pin={pin} error={error} onNum={handleNum} onDel={handleDel} />
    </div>
  )
}

function AppBar() {
  return (
    <div
      className="bg-vault-green px-4 pt-[calc(10px+env(safe-area-inset-top))] pb-2.5 flex items-center gap-3 flex-shrink-0"
    >
      <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-white fill-none stroke-[1.5] flex-shrink-0">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
      <span className="text-white font-display text-[1.1rem] tracking-[0.04em]">Kamus ID</span>
      <span className="text-white/60 text-[0.55rem] tracking-[0.15em] uppercase ml-auto">
        Indonesia · Inggris
      </span>
    </div>
  )
}

function SearchBar({ pin }: { pin: string }) {
  const fakeWords = ['', 'm', 'mu', 'mus', 'musk']
  const placeholder = pin.length === 0 ? 'Cari kata...' : fakeWords[pin.length] || 'mus'

  return (
    <div className="bg-vault-green-dark px-3.5 py-2 flex-shrink-0">
      <div className="bg-white rounded-full flex items-center px-3.5 py-2 gap-2.5">
        <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-[#888] fill-none stroke-2 flex-shrink-0">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <div className="flex-1 flex gap-2 items-center min-h-5">
          <div className="flex gap-2 items-center">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full border-2 transition-all duration-150
                  ${pin.length > i
                    ? 'bg-vault-green border-vault-green shadow-[0_0_10px_rgba(26,107,60,0.7)] scale-125'
                    : 'border-[#ccc] bg-transparent'
                  }`}
              />
            ))}
          </div>
          <span
            className="font-mono text-[0.8rem]"
            style={{ color: pin.length === 0 ? '#bbb' : '#333' }}
          >
            {placeholder}
          </span>
        </div>
        <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-[#888] fill-none stroke-2 flex-shrink-0">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </div>
    </div>
  )
}

function WordOfTheDay() {
  return (
    <div className="flex-1 p-3 pt-3 pb-2 flex flex-col gap-2.5 overflow-hidden">
      <div className="bg-vault-card border border-vault-border rounded-xl p-3.5 flex-shrink-0">
        <div className="flex items-baseline gap-2.5 mb-1.5">
          <span className="font-display text-[1.25rem] text-vault-text">privasi</span>
          <span className="text-[0.62rem] text-vault-green tracking-[0.05em]">• pri·va·si •</span>
        </div>
        <div className="text-[0.62rem] text-vault-muted mb-1.5">noun</div>
        <div className="text-[0.75rem] text-vault-text leading-[1.6]">
          Kebebasan pribadi; keadaan terbebas dari pengawasan orang lain.
        </div>
        <div className="text-[0.68rem] text-vault-muted mt-2 italic leading-[1.5]">
          &ldquo;Menjaga{' '}
          <span className="text-vault-green">privasi</span> adalah hak setiap
          individu.&rdquo;
        </div>
      </div>
      <div className="flex-shrink-0">
        <div className="text-[0.56rem] text-vault-muted tracking-[0.2em] uppercase mb-2">
          <svg viewBox="0 0 24 24" className="w-[13px] h-[13px] stroke-current fill-none stroke-[1.5] inline-block align-middle mr-1">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Pencarian Terakhir
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['rahasia', 'kenangan', 'tersembunyi', 'aman'].map((w) => (
            <span
              key={w}
              className="bg-vault-card border border-vault-border rounded-full px-3 py-1 text-[0.68rem] text-vault-muted"
            >
              {w}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function Numpad({
  pin,
  error,
  onNum,
  onDel,
}: {
  pin: string
  error: boolean
  onNum: (n: string) => void
  onDel: () => void
}) {
  return (
    <div className="flex-shrink-0 bg-vault-surface border-t border-vault-border py-2 px-5 pb-[calc(10px+env(safe-area-inset-bottom))]">
      <div className="text-[0.52rem] text-vault-muted tracking-[0.15em] uppercase text-center mb-2">
        Ketuk angka untuk mencari
      </div>
      <div className="grid grid-cols-3 gap-[clamp(8px,2.5vw,16px)] w-[min(76vw,300px)] mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => onNum(String(n))}
            className={`aspect-square rounded-full border-[1.5px] border-vault-green bg-[#1a3d2b] text-vault-text
                       font-mono text-[1.1rem] font-medium transition-all duration-150
                       shadow-[0_2px_8px_rgba(0,0,0,0.4)] cursor-pointer select-none
                       active:scale-[0.88] active:bg-vault-green active:border-[#4caf7d]
                       ${error ? '!bg-vault-danger !border-vault-danger' : ''}`}
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => onNum('0')}
          className="col-start-2 aspect-square rounded-full border-[1.5px] border-vault-green bg-[#1a3d2b] text-vault-text
                     font-mono text-[1.1rem] font-medium transition-all duration-150
                     shadow-[0_2px_8px_rgba(0,0,0,0.4)] cursor-pointer select-none
                     active:scale-[0.88] active:bg-vault-green active:border-[#4caf7d]"
        >
          0
        </button>
        <button
          onClick={onDel}
          className="aspect-square rounded-full bg-transparent border-transparent text-vault-muted
                     font-mono text-[1.1rem] transition-all duration-150 cursor-pointer select-none
                     active:text-vault-danger"
        >
          ⌫
        </button>
      </div>
    </div>
  )
}

function FirstLaunchStep({
  setupPin,
  setSetupPin,
  setupConfirm,
  setSetupConfirm,
  setupStep,
  handleSetup,
}: {
  setupPin: string
  setSetupPin: React.Dispatch<React.SetStateAction<string>>
  setupConfirm: string
  setSetupConfirm: React.Dispatch<React.SetStateAction<string>>
  setupStep: 'initial' | 'confirm'
  handleSetup: () => void
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
      <div className="text-center">
        <div className="font-display text-[1.3rem] text-vault-text mb-2">
          Selamat Datang
        </div>
        <p className="text-[0.65rem] text-vault-muted tracking-[0.08em] leading-[1.7] max-w-[280px]">
          Atur PIN 4 digit untuk mengamankan vault kamu.
          <br />
          PIN ini akan digunakan setiap kali membuka app.
        </p>
      </div>

      {setupStep === 'initial' ? (
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150
                  ${setupPin.length > i
                    ? 'bg-vault-green border-vault-green shadow-[0_0_10px_rgba(26,107,60,0.7)] scale-125'
                    : 'border-vault-border bg-transparent'
                  }`}
              />
            ))}
          </div>
          <p className="text-[0.55rem] text-vault-muted tracking-[0.15em] uppercase">
            Masukkan PIN Baru
          </p>
          <div className="grid grid-cols-3 gap-3 w-[min(76vw,300px)]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                onClick={() => {
                  setSetupPin(p => p.length < 4 ? p + n : p)
                }}
                className="aspect-square rounded-full border-[1.5px] border-vault-green bg-[#1a3d2b] text-vault-text
                           font-mono text-[1.1rem] font-medium transition-all duration-150
                           shadow-[0_2px_8px_rgba(0,0,0,0.4)] active:scale-[0.88] active:bg-vault-green"
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setSetupPin(p => p.slice(0, -1))}
              className="col-start-2 aspect-square rounded-full bg-transparent border-transparent
                         text-vault-muted font-mono text-[1.1rem] active:text-vault-danger"
            >
              ⌫
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150
                  ${setupConfirm.length > i
                    ? 'bg-vault-gold border-vault-gold shadow-[0_0_10px_rgba(201,168,76,0.7)] scale-125'
                    : 'border-vault-border bg-transparent'
                  }`}
              />
            ))}
          </div>
          <p className="text-[0.55rem] text-vault-muted tracking-[0.15em] uppercase">
            Konfirmasi PIN
          </p>
          <div className="grid grid-cols-3 gap-3 w-[min(76vw,300px)]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                onClick={() =>
                  setSetupConfirm((p) => (p.length < 4 ? p + n : p))
                }
                className="aspect-square rounded-full border-[1.5px] border-vault-gold bg-[#3d3020] text-vault-text
                           font-mono text-[1.1rem] font-medium transition-all duration-150
                           shadow-[0_2px_8px_rgba(0,0,0,0.4)] active:scale-[0.88] active:bg-vault-gold-dim"
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setSetupConfirm((p) => p.slice(0, -1))}
              className="col-start-2 aspect-square rounded-full bg-transparent border-transparent
                         text-vault-muted font-mono text-[1.1rem] active:text-vault-danger"
            >
              ⌫
            </button>
          </div>
          {setupConfirm.length === 4 && setupPin !== setupConfirm && (
            <p className="text-[0.6rem] text-vault-danger tracking-[0.1em]">
              PIN tidak cocok! Coba lagi.
            </p>
          )}
          {setupConfirm.length === 4 && setupPin === setupConfirm && (
            <button
              onClick={handleSetup}
              className="w-full py-3 bg-vault-gold rounded-lg text-vault-bg font-mono text-[0.72rem] 
                         tracking-[0.12em] uppercase active:bg-vault-gold-light active:scale-[0.98]"
            >
              ✓ Simpan PIN
            </button>
          )}
        </div>
      )}
    </div>
  )
}
