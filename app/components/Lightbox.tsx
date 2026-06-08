'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useApp } from '@/lib/store'
import { fmtTime } from '@/lib/utils'
import MoveAlbumSheet from './MoveAlbumSheet'

export default function Lightbox() {
  const { state, dispatch, actions } = useApp()
  const filtered = actions.getFilteredMedia()
  const m = filtered[state.lightboxIndex]
  const [uiVisible, setUiVisible] = useState(true)
  const [vidPlaying, setVidPlaying] = useState(false)
  const [vidProgress, setVidProgress] = useState(0)
  const [vidCurrent, setVidCurrent] = useState(0)
  const [vidDur, setVidDur] = useState(0)
  const [showMoveSheet, setShowMoveSheet] = useState(false)
  const [scale, setScale] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [showZoomHint, setShowZoomHint] = useState(false)

  const vidRef = useRef<HTMLVideoElement>(null)
  const vidInterval = useRef<NodeJS.Timeout | null>(null)
  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const topbarRef = useRef<HTMLDivElement>(null)
  const infobarRef = useRef<HTMLDivElement>(null)

  // Touch/swipe state
  const tsx = useRef(0)
  const tsy = useRef(0)
  const tMoved = useRef(false)
  const lastPinchD = useRef(0)
  const lastScale = useRef(1)
  const lastPanX = useRef(0)
  const lastPanY = useRef(0)
  const lastTap = useRef(0)

  const isLightboxOpen = state.isLightboxOpen

  // Reset state when opening/closing
  useEffect(() => {
    if (isLightboxOpen) {
      setScale(1)
      setPanX(0)
      setPanY(0)
      lastScale.current = 1
      lastPanX.current = 0
      lastPanY.current = 0
      setUiVisible(true)
      setShowZoomHint(true)
      setTimeout(() => setShowZoomHint(false), 2000)
    }
  }, [isLightboxOpen, state.lightboxIndex])

  // Video progress
  const startVidInterval = useCallback(() => {
    if (vidInterval.current) clearInterval(vidInterval.current)
    vidInterval.current = setInterval(() => {
      const vid = vidRef.current
      if (!vid || !vid.duration) return
      const pct = (vid.currentTime / vid.duration) * 100
      setVidProgress(pct)
      setVidCurrent(vid.currentTime)
      setVidDur(vid.duration)
      setVidPlaying(!vid.paused)
    }, 250)
  }, [])

  const stopVidInterval = useCallback(() => {
    if (vidInterval.current) {
      clearInterval(vidInterval.current)
      vidInterval.current = null
    }
  }, [])

  const togglePlay = useCallback(() => {
    const vid = vidRef.current
    if (!vid) return
    if (vid.paused) { vid.play() } else { vid.pause() }
  }, [])

  const skipVideo = useCallback((sec: number) => {
    const vid = vidRef.current
    if (!vid) return
    vid.currentTime = Math.max(0, Math.min(vid.duration || 0, vid.currentTime + sec))
  }, [])

  const close = useCallback(() => {
    stopVidInterval()
    if (vidRef.current) {
      vidRef.current.pause()
      vidRef.current.src = ''
    }
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    actions.closeLightbox()
  }, [actions, stopVidInterval])

  const nav = useCallback(
    (dir: number) => {
      stopVidInterval()
      if (vidRef.current) {
        vidRef.current.pause()
        vidRef.current.src = ''
      }
      setScale(1)
      setPanX(0)
      setPanY(0)
      lastScale.current = 1
      lastPanX.current = 0
      lastPanY.current = 0
      actions.navLightbox(dir)
    },
    [actions, stopVidInterval]
  )

  const toggleUI = useCallback(() => {
    setUiVisible((v) => !v)
  }, [])

  const handleToggleFav = useCallback(async () => {
    if (!m) return
    await actions.toggleFav(m.id)
  }, [m, actions])

  const handleDelete = useCallback(() => {
    if (!m) return
    close()
    setTimeout(() => {
      actions.deleteMedia(m.id)
      actions.showToast('File dihapus')
    }, 50)
  }, [m, actions, close])

  // Keyboard navigation
  useEffect(() => {
    if (!isLightboxOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') nav(-1)
      if (e.key === 'ArrowRight') nav(1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isLightboxOpen, close, nav])

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      tsx.current = e.touches[0].clientX
      tsy.current = e.touches[0].clientY
      tMoved.current = false
    }
    if (e.touches.length === 2) {
      e.preventDefault()
      lastPinchD.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      lastScale.current = scale
    }
  }, [scale])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const newScale = Math.min(5, Math.max(1, lastScale.current * (d / lastPinchD.current)))
      setScale(newScale)
    } else if (e.touches.length === 1 && scale > 1) {
      e.preventDefault()
      const dx = (e.touches[0].clientX - tsx.current) / scale
      const dy = (e.touches[0].clientY - tsy.current) / scale
      setPanX(lastPanX.current + dx)
      setPanY(lastPanY.current + dy)
      tMoved.current = true
    } else if (e.touches.length === 1) {
      const dx = Math.abs(e.touches[0].clientX - tsx.current)
      const dy = Math.abs(e.touches[0].clientY - tsy.current)
      if (dx > 8 || dy > 8) tMoved.current = true
    }
  }, [scale])

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (scale > 1.05) {
        lastPanX.current = panX
        lastPanY.current = panY
        if (scale < 1.05) setScale(1)
        return
      }
      if (e.changedTouches.length === 1) {
        const dx = e.changedTouches[0].clientX - tsx.current
        const dy = e.changedTouches[0].clientY - tsy.current
        if (tMoved.current && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
          nav(dx < 0 ? 1 : -1)
          return
        }
        // Double tap
        const now = Date.now()
        if (now - lastTap.current < 300) {
          if (scale > 1) {
            setScale(1)
            setPanX(0)
            setPanY(0)
            lastPanX.current = 0
            lastPanY.current = 0
          } else {
            setScale(2.5)
          }
        }
        lastTap.current = now
      }
      if (e.changedTouches.length === 0) {
        if (scale < 1.05) setScale(1)
      }
    },
    [scale, panX, panY, nav]
  )

  // Wheel zoom
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const newScale = Math.min(5, Math.max(1, scale - e.deltaY * 0.005))
    if (newScale <= 1) {
      setScale(1)
      setPanX(0)
      setPanY(0)
      lastPanX.current = 0
      lastPanY.current = 0
    } else {
      setScale(newScale)
    }
  }, [scale])

  const vidProgressWrapRef = useRef<HTMLDivElement>(null)
  const seekVideo = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const vid = vidRef.current
      if (!vid || !vid.duration || !vidProgressWrapRef.current) return
      const rect = vidProgressWrapRef.current.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      vid.currentTime = pct * vid.duration
    },
    []
  )

  if (!isLightboxOpen || !m) return null

  const isVideo = m.type === 'video'
  const isGif = m.type === 'gif'
  const imgStyle: React.CSSProperties = {
    transform: `scale(${scale}) translate(${panX}px, ${panY}px)`,
    transformOrigin: 'center',
  }

  return (
    <div className="fixed inset-0 bg-black z-[200] flex flex-col">
      {/* Top bar */}
      <div
        ref={topbarRef}
        className={`flex items-center justify-between px-4 pt-[calc(14px+env(safe-area-inset-top))] pb-3.5
                    bg-gradient-to-b from-black/85 to-transparent absolute top-0 left-0 right-0 z-10
                    transition-all duration-300 ${uiVisible ? 'opacity-100' : 'opacity-0 -translate-y-full pointer-events-none'}`}
      >
        <span className="text-[0.65rem] tracking-[0.15em] text-white/80">
          {state.lightboxIndex + 1} / {filtered.length}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMoveSheet(true)}
            className="w-9 h-9 rounded-md border border-vault-border bg-transparent flex items-center justify-center text-vault-muted"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[1.5]">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="w-9 h-9 rounded-md border border-vault-border bg-transparent flex items-center justify-center text-vault-muted"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[1.5]">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
          </button>
          <button
            onClick={close}
            className="w-9 h-9 rounded-md border border-vault-border bg-transparent flex items-center justify-center text-vault-muted"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[1.5]">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Media area */}
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden touch-none bg-black"
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest('button')) toggleUI()
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
      >
        {/* Arrows */}
        <button
          ref={prevRef}
          onClick={(e) => { e.stopPropagation(); nav(-1) }}
          className={`absolute top-1/2 -translate-y-1/2 left-2 z-5 w-9 h-9
                     bg-black/40 border border-white/15 text-white/70 flex items-center justify-center
                     rounded transition-all duration-300 active:border-vault-gold active:text-vault-gold
                     ${uiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[1.5]">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          ref={nextRef}
          onClick={(e) => { e.stopPropagation(); nav(1) }}
          className={`absolute top-1/2 -translate-y-1/2 right-2 z-5 w-9 h-9
                     bg-black/40 border border-white/15 text-white/70 flex items-center justify-center
                     rounded transition-all duration-300 active:border-vault-gold active:text-vault-gold
                     ${uiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[1.5]">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Image */}
        {!isVideo && !isGif && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            id="lbImg"
            src={actions.getUrlForMedia(m) || m.thumb || ''}
            alt={m.name}
            className="w-full h-full object-contain select-none"
            style={imgStyle}
            draggable={false}
          />
        )}

        {/* Video */}
        {isVideo && (
          <video
            ref={vidRef}
            id="lbVid"
            className="absolute inset-0 w-full h-full object-contain"
            playsInline
            src={actions.getUrlForMedia(m) || ''}
            onLoadedMetadata={() => {
              if (vidRef.current) {
                setVidDur(vidRef.current.duration)
                vidRef.current.play().catch(() => {})
              }
            }}
            onPlay={() => { setVidPlaying(true); startVidInterval() }}
            onPause={() => { setVidPlaying(false); stopVidInterval() }}
            onEnded={() => { setVidPlaying(false); stopVidInterval() }}
          />
        )}

        {/* GIF */}
        {isGif && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            id="lbGif"
            src={actions.getUrlForMedia(m) || m.thumb || ''}
            alt={m.name}
            className="absolute inset-0 w-full h-full object-contain"
          />
        )}

        {/* Video Controls */}
        {isVideo && (
          <div
            className={`absolute bottom-[80px] left-1/2 -translate-x-1/2 z-8 flex flex-col items-center gap-2.5 w-[85%] max-w-[360px]
                        transition-opacity duration-300 ${uiVisible ? 'flex' : 'hidden'}`}
          >
            {/* Progress bar */}
            <div
              ref={vidProgressWrapRef}
              className="w-full h-7 flex items-center cursor-pointer"
              onClick={seekVideo}
              onTouchStart={seekVideo}
            >
              <div className="w-full h-[3px] bg-white/25 rounded-sm relative">
                <div
                  className="h-full bg-vault-gold rounded-sm"
                  style={{ width: `${vidProgress}%` }}
                />
                <div
                  className="absolute top-1/2 w-3 h-3 rounded-full bg-vault-gold -translate-y-1/2"
                  style={{ left: `${vidProgress}%` }}
                />
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-5">
              <button
                onClick={() => skipVideo(-10)}
                className="bg-transparent border-none text-white/85 cursor-pointer flex flex-col items-center gap-0.5"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-white fill-none stroke-[1.8]">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
                  <text x="12" y="14" textAnchor="middle" fontSize="5.5" fill="white" stroke="none" fontFamily="monospace" fontWeight="bold">10</text>
                </svg>
                <span className="text-[0.45rem] text-white/60">-10s</span>
              </button>
              <button
                onClick={togglePlay}
                className="bg-white/15 border-2 border-white/50 rounded-full w-[54px] h-[54px] text-white cursor-pointer flex items-center justify-center backdrop-blur-sm"
              >
                {vidPlaying ? (
                  <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] fill-white stroke-none">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] fill-white stroke-none">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => skipVideo(10)}
                className="bg-transparent border-none text-white/85 cursor-pointer flex flex-col items-center gap-0.5"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-white fill-none stroke-[1.8]">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-.49-4.5" />
                  <text x="12" y="14" textAnchor="middle" fontSize="5.5" fill="white" stroke="none" fontFamily="monospace" fontWeight="bold">10</text>
                </svg>
                <span className="text-[0.45rem] text-white/60">+10s</span>
              </button>
            </div>

            {/* Time display */}
            <div className="flex justify-between w-full">
              <span className="text-[0.58rem] text-white/70 font-mono">{fmtTime(vidCurrent)}</span>
              <span className="text-[0.58rem] text-white/70 font-mono">{fmtTime(vidDur)}</span>
            </div>
          </div>
        )}

        {/* Zoom hint */}
        <div
          className={`absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/60 border border-white/15 text-white/70
                     px-3 py-1 rounded-full text-[0.55rem] tracking-[0.1em] pointer-events-none z-6 whitespace-nowrap
                     transition-opacity duration-300 ${showZoomHint ? 'opacity-100' : 'opacity-0'}`}
        >
          Pinch / double-tap to zoom
        </div>
      </div>

      {/* Info bar */}
      <div
        ref={infobarRef}
        className={`flex-shrink-0 px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 flex flex-col gap-2
                    border-t border-white/10 bg-gradient-to-t from-black/90 to-black/70 absolute bottom-0 left-0 right-0 z-10
                    transition-all duration-300 ${uiVisible ? 'opacity-100' : 'opacity-0 translate-y-full pointer-events-none'}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="font-display text-[0.9rem]">{m.name}</div>
            <div className="text-[0.6rem] text-vault-gold tracking-[0.15em] mt-0.5">{m.date}</div>
          </div>
          <button
            onClick={handleToggleFav}
            className={`px-3.5 py-2 rounded font-mono text-[0.62rem] tracking-[0.12em] uppercase cursor-pointer
                       flex items-center gap-1.5 transition-all duration-200
                       ${m.fav
                         ? 'border border-vault-gold text-vault-gold'
                         : 'bg-white/10 border border-white/20 text-white/80'
                       }`}
          >
            <svg viewBox="0 0 24 24" className="w-3 h-3 stroke-current fill-none stroke-[1.5]">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {m.fav ? '★' : '☆'} Favorit
          </button>
        </div>
        <div className="flex gap-3 mt-1">
          <span className="text-[0.56rem] text-vault-muted tracking-[0.08em] bg-vault-card border border-vault-border rounded px-1.5 py-0.5">
            {m.size ? (m.size / 1024 / 1024).toFixed(2) + ' MB' : '—'}
          </span>
          <span className="text-[0.56rem] text-vault-muted tracking-[0.08em] bg-vault-card border border-vault-border rounded px-1.5 py-0.5">
            {state.albums.find((a) => a.id === m.albumId)?.name || 'Tanpa Album'}
          </span>
        </div>
      </div>

      {/* Move sheet */}
      <MoveAlbumSheet isOpen={showMoveSheet} onClose={() => setShowMoveSheet(false)} mediaId={m.id} />
    </div>
  )
}


