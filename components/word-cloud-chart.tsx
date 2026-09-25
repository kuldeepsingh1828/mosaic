'use client'

import { useMemo } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
// Highcharts v10+ modules self-register the moment they're imported (they
// mutate the shared Highcharts instance as a side effect) — there's no
// function to call. Side-effect-only import, deliberately unused binding.
import 'highcharts/modules/wordcloud'
import { WORD_COLORS, type Word } from '@/lib/words'

export function WordCloudChart({ tallies }: { tallies: Record<string, number> }) {
  const options = useMemo<Highcharts.Options>(() => {
    const data = (Object.keys(tallies) as Word[]).map((word) => ({
      name: word,
      // Every word stays visible (weight floor of 1) even before any votes
      // come in; mentions grow the word from there.
      weight: Math.max(1, tallies[word] ?? 0),
      color: WORD_COLORS[word],
    }))

    return {
      chart: { type: 'wordcloud', backgroundColor: 'transparent', height: 260, margin: [0, 0, 0, 0] },
      title: { text: undefined },
      credits: { enabled: false },
      accessibility: { enabled: false },
      tooltip: { pointFormat: '{point.name}: <b>{point.weight}</b> mention(s)' },
      plotOptions: { wordcloud: { minFontSize: 12, maxFontSize: 40, rotation: { orientations: 1, from: 0, to: 0 } } },
      series: [{ type: 'wordcloud', name: 'Mentions', data }],
    }
  }, [tallies])

  return <HighchartsReact highcharts={Highcharts} options={options} />
}
