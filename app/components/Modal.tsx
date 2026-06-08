'use client'

import { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <div
      className={`fixed inset-0 z-[260] flex items-center justify-center p-5 transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-vault-surface border border-vault-border rounded-2xl p-6 w-full max-w-[360px] flex flex-col gap-3.5">
        {title && <div className="font-display text-[1.05rem]">{title}</div>}
        {children}
      </div>
    </div>
  )
}
