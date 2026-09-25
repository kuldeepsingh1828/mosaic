'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { TallyList } from '@/components/tally-chart'

// Highcharts' UMD modules set/read a shared `window._Highcharts` global to
// wire the wordcloud series into core Highcharts. That global doesn't
// exist during server rendering (no `window`), which crashes the whole
// page. Loading this client-only, after hydration, sidesteps it entirely.
const WordCloudChart = dynamic(() => import('@/components/word-cloud-chart').then((mod) => mod.WordCloudChart), {
  ssr: false,
  loading: () => <p className="py-8 text-center text-xs text-[#8a9197]">Loading word cloud…</p>,
})

const TABS = ['Mentions', 'Word Cloud'] as const
type Tab = (typeof TABS)[number]

export function MentionsPanel({ tallies }: { tallies: Record<string, number> }) {
  const [tab, setTab] = useState<Tab>('Mentions')

  return (
    <aside className="w-full shrink-0 overflow-y-auto rounded-2xl border border-[#dfe3df] bg-white p-5 shadow-[0_4px_20px_rgba(32,37,43,0.04)] lg:w-72" aria-label="Word mentions">
      <div className="flex gap-1 rounded-lg bg-[#f1f3f1] p-1" role="tablist" aria-label="Mentions view">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${tab === t ? 'bg-white text-[#20252b] shadow-sm' : 'text-[#687078] hover:text-[#20252b]'}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-4" role="tabpanel">
        {tab === 'Mentions' ? <TallyList tallies={tallies} /> : <WordCloudChart tallies={tallies} />}
      </div>
    </aside>
  )
}
