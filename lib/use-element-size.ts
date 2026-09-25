'use client'

import { useEffect, useRef, useState } from 'react'

// Tracks an element's content-box size via ResizeObserver, so layout math
// (calculateGridLayout) always reacts to real available space — including
// window resizes, orientation changes, sidebar/header changes, and
// entering/exiting fullscreen — without any vh/vw guesswork.
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => {
      const rect = el.getBoundingClientRect()
      setSize((current) => (current.width === rect.width && current.height === rect.height ? current : { width: rect.width, height: rect.height }))
    }

    // Seed the initial size synchronously via getBoundingClientRect rather
    // than waiting on the ResizeObserver's first callback: RO (and rAF)
    // delivery is tied to the rendering pipeline and can be deferred
    // indefinitely on a backgrounded/occluded tab, whereas layout geometry
    // is available immediately regardless of paint/visibility state.
    measure()

    const observer = new ResizeObserver(() => measure())
    observer.observe(el)
    // Extra safety net for environments where RO callbacks lag (e.g. a
    // throttled/hidden tab) — window resize/orientation changes still
    // trigger a fresh measurement.
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('orientationchange', measure)
    }
  }, [])

  return [ref, size] as const
}
