'use client'

import { useRef, useCallback } from 'react'

interface UseLongPressOptions {
  onLongPress: () => void
  delay?: number
}

export function useLongPress({ onLongPress, delay = 500 }: UseLongPressOptions) {
  const timer = useRef<NodeJS.Timeout | null>(null)

  const start = useCallback(() => {
    timer.current = setTimeout(() => {
      onLongPress()
    }, delay)
  }, [onLongPress, delay])

  const cancel = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  return {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchCancel: cancel,
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
  }
}
