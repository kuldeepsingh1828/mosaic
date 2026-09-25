import { WORDS, WORD_COLORS, type Word } from '@/lib/words'

// Bar-list body only (no wrapper chrome) so it can be embedded inside
// MentionsPanel's tabs. TallyChart below wraps this for standalone use.
export function TallyList({ tallies }: { tallies: Record<string, number> }) {
  const max = Math.max(1, ...WORDS.map((word) => tallies[word] ?? 0))
  const sorted: Word[] = [...WORDS].sort((a, b) => (tallies[b] ?? 0) - (tallies[a] ?? 0))

  return (
    <ul className="flex flex-col gap-3">
      {sorted.map((word) => {
        const count = tallies[word] ?? 0
        const width = Math.round((count / max) * 100)
        return (
          <li key={word}>
            <div className="flex items-center justify-between text-xs font-medium text-[#20252b]">
              <span>{word}</span>
              <span className="tabular-nums text-[#687078]">{count}</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#eef0ed]">
              <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: WORD_COLORS[word] }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function TallyChart({ tallies }: { tallies: Record<string, number> }) {
  return (
    <aside className="w-full shrink-0 rounded-2xl border border-[#dfe3df] bg-white p-5 shadow-[0_4px_20px_rgba(32,37,43,0.04)] lg:w-64" aria-label="Word mention tally">
      <h3 className="text-sm font-semibold">Mentions</h3>
      <div className="mt-4">
        <TallyList tallies={tallies} />
      </div>
    </aside>
  )
}
