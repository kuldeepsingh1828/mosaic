'use client'

import { useState } from 'react'
import { WORDS, type Word } from '@/lib/words'

export function WordPromptDialog({
  open,
  submitting,
  error,
  onSubmit,
  onDismiss,
}: {
  open: boolean
  submitting: boolean
  error?: string
  onSubmit: (words: Word[]) => void
  onDismiss: () => void
}) {
  const [selected, setSelected] = useState<Word[]>([])

  if (!open) return null

  function toggle(word: Word) {
    setSelected((current) => (current.includes(word) ? current.filter((w) => w !== word) : [...current, word]))
  }

  function handleSubmit() {
    if (selected.length === 0) return
    onSubmit(selected)
    setSelected([])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#20252b]/60 px-4" role="dialog" aria-modal="true" aria-labelledby="word-prompt-title">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-1 text-[#8a9197] hover:bg-[#f1f3f1] hover:text-[#20252b] focus:outline-none focus:ring-2 focus:ring-[#20252b]/30"
        >
          ✕
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#687078]">wCare Digital Wall Activity</p>
        <h2 id="word-prompt-title" className="mt-2 text-xl font-semibold tracking-[-0.02em] sm:text-2xl">
          Words to describe &lsquo;What I bring&rsquo; or &lsquo;What helps me thrive&rsquo;
        </h2>
        <p className="mt-1 text-sm text-[#687078]">Pick one or more words, then add them to the wall.</p>
        {error ? <p className="mt-3 rounded-lg bg-[#fbeceb] px-3 py-2 text-sm text-[#a3453a]" role="alert">{error}</p> : null}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {WORDS.map((word) => {
            const checked = selected.includes(word)
            return (
              <button
                key={word}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => toggle(word)}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${checked ? 'border-[#20252b] bg-[#20252b] text-white' : 'border-[#dfe3df] bg-white text-[#20252b] hover:border-[#20252b]'}`}
              >
                {word}
              </button>
            )
          })}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={selected.length === 0 || submitting}
            className="h-10 rounded-lg bg-[#20252b] px-5 text-sm font-medium text-white hover:bg-[#3c444b] focus:outline-none focus:ring-2 focus:ring-[#20252b]/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Adding…' : 'Add to the wall'}
          </button>
        </div>
      </div>
    </div>
  )
}
