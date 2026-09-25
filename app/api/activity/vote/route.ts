import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { isLocation } from '@/lib/locations'
import { WORD_COLORS, isWord, type Word } from '@/lib/words'

export const dynamic = 'force-dynamic'

// How many cells get painted per selected word each time someone submits
// the wCare word-pool prompt. One cell per word keeps mentions == painted
// cells, so the canvas fill rate matches the tally counts 1:1.
const CELLS_PER_WORD = 1

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const location = isLocation(body?.location) ? body.location : null
  const words: Word[] = Array.isArray(body?.words)
    ? Array.from(new Set(body.words.filter(isWord)))
    : []

  if (!location) return NextResponse.json({ error: 'Unknown location' }, { status: 400 })
  if (words.length === 0) return NextResponse.json({ error: 'Select at least one word' }, { status: 400 })

  const supabase = createSupabaseAdminClient()
  const { data: activity, error: activityError } = await supabase
    .from('activities')
    .select('id')
    .eq('location', location)
    .single()

  if (activityError) return NextResponse.json({ error: 'Unable to load activity' }, { status: 500 })

  // The activity never locks or expires — associates can keep adding words
  // to the wall indefinitely until an admin explicitly resets it.
  for (const word of words) {
    const { error: tallyError } = await supabase.rpc('increment_word_tally', { p_activity_id: activity.id, p_word: word })
    if (tallyError) return NextResponse.json({ error: 'Unable to record vote' }, { status: 500 })
  }

  // The canvas is a dynamically-reflowing tile grid, not a fixed-position
  // pixel grid — there's no meaningful (row, col) to paint into anymore.
  // `row`/`col` are just a synthetic, ever-incrementing identifier so each
  // new cell gets a unique key in the `cells` table (unique on
  // activity_id, row, col); the client renders cells in `created_at`
  // order and lays them out itself via calculateGridLayout.
  const { count, error: countError } = await supabase
    .from('cells')
    .select('*', { count: 'exact', head: true })
    .eq('activity_id', activity.id)

  if (countError) return NextResponse.json({ error: 'Unable to load canvas' }, { status: 500 })

  let nextIndex = count ?? 0
  const totalCellsToInsert = words.length * CELLS_PER_WORD
  const inserts: { activity_id: string; row: number; col: number; color: string }[] = []
  for (const word of words) {
    for (let i = 0; i < CELLS_PER_WORD; i++) {
      inserts.push({ activity_id: activity.id, row: 0, col: nextIndex, color: WORD_COLORS[word] })
      nextIndex += 1
    }
  }

  if (inserts.length > 0) {
    const { error: insertError } = await supabase.from('cells').upsert(inserts, { onConflict: 'activity_id,row,col' })
    if (insertError) return NextResponse.json({ error: 'Unable to update canvas' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, painted: inserts.length, totalPlanned: totalCellsToInsert })
}
