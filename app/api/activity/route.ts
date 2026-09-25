import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { isLocation, type Location } from '@/lib/locations'
import { WORDS } from '@/lib/words'

export const dynamic = 'force-dynamic'

function getLocationFromRequest(request: Request): Location | null {
  const { searchParams } = new URL(request.url)
  const location = searchParams.get('location')
  return isLocation(location) ? location : null
}

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'API is working',
  })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const location = isLocation(body?.location) ? body.location : null
  const row = Number(body?.row)
  const col = Number(body?.col)
  const color = body?.color === null ? null : String(body?.color ?? '')

  if (!location) return NextResponse.json({ error: 'Unknown location' }, { status: 400 })
  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || (!color && color !== null)) {
    return NextResponse.json({ error: 'Invalid cell' }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()
  const { data: activity, error: activityError } = await supabase
    .from('activities')
    .select('id, grid_size')
    .eq('location', location)
    .single()

  if (activityError) return NextResponse.json({ error: 'Unable to load activity' }, { status: 500 })
  if (row >= activity.grid_size || col >= activity.grid_size) return NextResponse.json({ error: 'Cell out of bounds' }, { status: 400 })

  const result = color === null
    ? await supabase.from('cells').delete().eq('activity_id', activity.id).eq('row', row).eq('col', col)
    : await supabase.from('cells').upsert({ activity_id: activity.id, row, col, color }, { onConflict: 'activity_id,row,col' })

  if (result.error) return NextResponse.json({ error: 'Unable to save cell' }, { status: 500 })

  const { data: expansion, error: expansionError } = await supabase.rpc('expand_activity_if_full', {
    p_activity_id: activity.id,
  })
  if (expansionError) return NextResponse.json({ error: 'Unable to update canvas size' }, { status: 500 })

  const expansionResult = Array.isArray(expansion) ? expansion[0] : expansion
  return NextResponse.json({
    ok: true,
    expanded: Boolean(expansionResult?.expanded),
    gridSize: expansionResult?.new_grid_size ?? activity.grid_size,
  })
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null)
  const location = isLocation(body?.location) ? body.location : null
  const gridSize = Number(body?.gridSize)
  const timerDurationSeconds = Number(body?.timerDurationSeconds)

  if (!location) return NextResponse.json({ error: 'Unknown location' }, { status: 400 })
  if (![20, 30, 40, 50].includes(gridSize) || !Number.isInteger(timerDurationSeconds) || timerDurationSeconds < 60 || timerDurationSeconds > 3600) {
    return NextResponse.json({ error: 'Invalid settings' }, { status: 400 })
  }
  const supabase = createSupabaseAdminClient()
  const { data: activity } = await supabase.from('activities').select('id, status').eq('location', location).single()
  if (!activity || activity.status !== 'ready') return NextResponse.json({ error: 'Activity has started' }, { status: 409 })
  const { error } = await supabase.from('activities').update({ starting_grid_size: gridSize, grid_size: gridSize, timer_duration_seconds: timerDurationSeconds }).eq('id', activity.id)
  if (error) return NextResponse.json({ error: 'Unable to save settings' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
