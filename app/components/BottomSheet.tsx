'use client'

import { useEffect, useRef } from 'react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: React.ReactNode
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}: BottomSheetProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <div
      className={`fixed inset-0 z-[300] flex flex-col justify-end transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="absolute inset-0 bg-black/72 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={ref}
        className={`relative bg-vault-surface border-t border-vault-border rounded-t-[20px] p-5 pb-[calc(20px+env(safe-area-inset-bottom))]
                    flex flex-col gap-3 overflow-y-auto max-h-[85dvh] transition-transform duration-300
                    ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="w-9 h-1 bg-vault-border rounded-full mx-auto mb-1 flex-shrink-0" />
        {title && (
          <div className="font-display text-[1.05rem] text-center">{title}</div>
        )}
        {subtitle && (
          <p className="text-[0.6rem] text-vault-muted tracking-[0.12em] text-center">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  )
}
