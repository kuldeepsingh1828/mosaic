'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { LOCATION_LABELS, type Location } from '@/lib/locations'
import { WORDS, type Word } from '@/lib/words'
import { WordPromptDialog } from '@/components/word-prompt-dialog'
import { MentionsPanel } from '@/components/mentions-panel'
import { PixelGrid } from '@/components/pixel-grid'

// How often (seconds) the wCare word-pool prompt re-appears for the next
// associate. Configurable via env so kiosk pacing can change without a
// code change.
const WCARE_REFRESH_SECONDS = Number(process.env.NEXT_PUBLIC_WCARE_REFRESH_SECONDS) || 45

// The canvas is a dynamically-reflowing tile grid (see components/pixel-grid.tsx
// and lib/grid-layout.ts) — there's no fixed grid_size driving rendering
// anymore; the number of tiles is just however many cells exist. The
// activity itself never ends/locks — associates can keep contributing
// indefinitely until an admin explicitly resets it.
type Activity = { id: string }
type RealtimeCell = { activity_id: string; row: number; col: number; color: string }

export function ActivityCanvas({ location }: { location: Location }) {
  const [activity, setActivity] = useState<Activity | null>(null)
  const [cells, setCells] = useState<Record<string, string>>({})
  const [tallies, setTallies] = useState<Record<string, number>>(Object.fromEntries(WORDS.map((word) => [word, 0])))
  const [promptOpen, setPromptOpen] = useState(true)
  const [votingSubmitting, setVotingSubmitting] = useState(false)
  const [votingError, setVotingError] = useState<string | undefined>()
  // Tracks whether the realtime websocket is actually connected. Starts
  // false (not yet connected) so the polling fallback below covers the
  // window before the first subscribe callback fires too.
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  // Cells currently mid pop-in animation, and which one (if any) was the
  // very first cell this client ever saw get painted — see the effect below.
  const [animatingCells, setAnimatingCells] = useState<Set<string>>(new Set())
  const prevCellsRef = useRef<Record<string, string> | null>(null)
  const firstCellKeyRef = useRef<string | null>(null)
  const hasSeenAnyCellRef = useRef(false)
  // Full-size toggle for just the grid (not the header/tally panel). Tries
  // the real Fullscreen API first; if it's unsupported or blocked (e.g.
  // some kiosk browsers, iOS Safari), falls back to an in-page full-size
  // layout instead.
  const canvasWrapperRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement) && document.fullscreenElement === canvasWrapperRef.current)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  async function toggleFullscreen() {
    const el = canvasWrapperRef.current
    if (!el) return
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await el.requestFullscreen()
      }
    } catch {
      setIsFullscreen((current) => !current)
    }
  }

  const load = useCallback(async () => {
    const response = await fetch(`/api/activity?location=${location}`, { cache: 'no-store' })
    if (!response.ok) return
    const data = await response.json()
    setActivity(data.activity as Activity)
    setCells(Object.fromEntries((data.cells ?? []).map((cell: { row: number; col: number; color: string }) => [`${cell.row}:${cell.col}`, cell.color])))
    if (data.tallies) setTallies(data.tallies as Record<string, number>)
  }, [location])

  useEffect(() => { void load() }, [load])

  // Detects newly-painted cells (present in `cells` but not in the previous
  // render's snapshot) and briefly flags them for the pop-in animation.
  // Skips the very first population of `cells` (initial load / tab switch)
  // so existing cells don't all animate at once — only cells added after
  // that count as "new."
  useEffect(() => {
    const previous = prevCellsRef.current
    prevCellsRef.current = cells

    if (previous === null) {
      if (Object.keys(cells).length > 0) hasSeenAnyCellRef.current = true
      return
    }

    const addedKeys = Object.keys(cells).filter((key) => !(key in previous))
    if (addedKeys.length === 0) return

    if (!hasSeenAnyCellRef.current && firstCellKeyRef.current === null) {
      firstCellKeyRef.current = addedKeys[0]
    }
    hasSeenAnyCellRef.current = true

    setAnimatingCells((current) => {
      const next = new Set(current)
      for (const key of addedKeys) next.add(key)
      return next
    })

    const timeout = window.setTimeout(() => {
      setAnimatingCells((current) => {
        const next = new Set(current)
        for (const key of addedKeys) next.delete(key)
        return next
      })
    }, 800)
    return () => window.clearTimeout(timeout)
  }, [cells])

  useEffect(() => {
    const activityId = activity?.id
    if (!activityId) return

    setRealtimeConnected(false)
    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel(`activity:${activityId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'activities', filter: `id=eq.${activityId}` },
        (payload) => {
          const nextActivity = payload.new as Activity
          if (nextActivity.id !== activityId) return

          // The only way `activities` changes now is an admin reset — always
          // reload so the cleared canvas/tallies show up immediately.
          setActivity(nextActivity)
          void load()
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cells', filter: `activity_id=eq.${activityId}` },
        (payload) => {
          const cell = payload.new as RealtimeCell
          if (cell.activity_id !== activityId) return
          setCells((current) => ({ ...current, [`${cell.row}:${cell.col}`]: cell.color }))
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cells', filter: `activity_id=eq.${activityId}` },
        (payload) => {
          const previous = payload.old as Partial<RealtimeCell>
          const cell = payload.new as RealtimeCell
          if (cell.activity_id !== activityId) return

          setCells((current) => {
            const next = { ...current }
            if (Number.isInteger(previous.row) && Number.isInteger(previous.col)) {
              delete next[`${previous.row}:${previous.col}`]
            }
            next[`${cell.row}:${cell.col}`] = cell.color
            return next
          })
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'cells', filter: `activity_id=eq.${activityId}` },
        (payload) => {
          const cell = payload.old as Partial<RealtimeCell>
          if (!Number.isInteger(cell.row) || !Number.isInteger(cell.col)) return

          setCells((current) => {
            const next = { ...current }
            delete next[`${cell.row}:${cell.col}`]
            return next
          })
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeConnected(true)
          void load()
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          // Websocket didn't connect (e.g. a proxy blocking the wss://
          // upgrade) — fall back to polling below.
          setRealtimeConnected(false)
        }
      })

    return () => { void supabase.removeChannel(channel) }
  }, [activity?.id, load])

  // Polling fallback: only runs while the realtime websocket isn't
  // connected, so networks that block wss:// upgrades still get updates
  // without manual refresh, while working networks stay push-based.
  useEffect(() => {
    if (realtimeConnected) return
    const interval = window.setInterval(() => void load(), 3000)
    return () => window.clearInterval(interval)
  }, [realtimeConnected, load])

  // wCare word-pool prompt: re-appears every WCARE_REFRESH_SECONDS so the
  // next associate walking up to the wall gets asked the question again.
  // The activity never ends, so this always keeps reopening.
  useEffect(() => {
    if (promptOpen || !activity) return
    const timeout = window.setTimeout(() => setPromptOpen(true), WCARE_REFRESH_SECONDS * 1000)
    return () => window.clearTimeout(timeout)
  }, [promptOpen, activity])

  const cellKeys = Object.keys(cells)

  async function submitWords(words: Word[]) {
    if (!activity || votingSubmitting) return
    setVotingSubmitting(true)
    setVotingError(undefined)
    try {
      const response = await fetch('/api/activity/vote', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ location, words }) })
      if (response.ok) {
        setPromptOpen(false)
        await load()
      } else {
        const result = await response.json().catch(() => null)
        setVotingError(result?.error ?? 'Unable to add your words. Please try again.')
      }
    } catch {
      setVotingError('Unable to add your words. Please try again.')
    } finally {
      setVotingSubmitting(false)
    }
  }

  return <main className="h-screen overflow-hidden bg-[#f5f6f4] px-5 py-8 text-[#20252b] sm:px-8 sm:py-10"><div className="mx-auto flex h-full w-full max-w-6xl flex-col">
    <WordPromptDialog open={promptOpen} submitting={votingSubmitting} error={votingError} onSubmit={submitWords} onDismiss={() => { setPromptOpen(false); setVotingError(undefined) }} />
    <header className="flex shrink-0 items-start justify-between gap-6"><div><div className="mb-3 flex items-center gap-2.5"><span className="grid size-7 grid-cols-2 gap-0.5 rounded-md bg-[#20252b] p-1.5" aria-hidden="true"><span className="rounded-[1px] bg-[#e87963]" /><span className="rounded-[1px] bg-[#f2b66d]" /><span className="rounded-[1px] bg-[#76a9c9]" /><span className="rounded-[1px] bg-[#8eae8a]" /></span><span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#687078]">{LOCATION_LABELS[location]}</span></div><h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Create Together</h1><p className="mt-2 text-sm text-[#687078] sm:text-base">Answer the prompt and watch the wall grow.</p></div></header>
    <div className="flex min-h-0 flex-1 flex-col gap-6 py-6 lg:flex-row lg:items-stretch lg:justify-center">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center" aria-label="Shared pixel canvas">
        <div ref={canvasWrapperRef} className={`relative flex min-h-0 w-full flex-1 items-center justify-center ${isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen bg-white' : ''}`}>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit full size' : 'Full size grid'}
            className="absolute right-2 top-2 z-20 flex size-8 items-center justify-center rounded-full border border-[#dfe3df] bg-white/90 text-[#687078] shadow-sm hover:text-[#20252b] focus:outline-none focus:ring-2 focus:ring-[#20252b]/30"
          >
            {isFullscreen ? <Minimize2 className="size-4" aria-hidden="true" /> : <Maximize2 className="size-4" aria-hidden="true" />}
          </button>
          <PixelGrid cellKeys={cellKeys} cells={cells} animatingCells={animatingCells} firstCellKey={firstCellKeyRef.current} />
        </div>
      </section>
      {!isFullscreen ? <MentionsPanel tallies={tallies} /> : null}
    </div>
    <footer className="shrink-0 pt-5 text-center text-xs text-[#9aa09e]">Every square is a small contribution.</footer>
  </div></main>
}
