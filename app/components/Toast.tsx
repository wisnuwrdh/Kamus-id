'use client'

import { useApp } from '@/lib/store'

export default function Toast() {
  const { state } = useApp()

  if (!state.toast) return null

  return (
    <div
      className="fixed top-[calc(80px+env(safe-area-inset-top))] left-1/2 -translate-x-1/2 translate-y-0 z-[9998] 
                  px-5 py-2.5 rounded-full text-[0.68rem] tracking-[0.1em] whitespace-nowrap
                  bg-vault-card border border-vault-gold text-vault-text
                  animate-fade-in"
    >
      {state.toast}
    </div>
  )
}
