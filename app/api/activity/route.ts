import { NextResponse } from 'next/server'

import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { isLocation, type Location } from '@/lib/locations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function getLocationFromRequest(request: Request): Location | null {
  const { searchParams } = new URL(request.url)
  const location = searchParams.get('location')

  return isLocation(location) ? location : null
}

export async function GET(request: Request) {
  try {
    const location = getLocationFromRequest(request)

    if (!location) {
      return NextResponse.json(
        { error: 'Unknown location' },
        { status: 400 },
      )
    }

    const supabase = createSupabaseAdminClient()

    console.log('Loading activity:', location)

    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select(
        'id, grid_size, timer_duration_seconds, status, started_at, ends_at',
      )
      .eq('location', location)
      .single()

    if (activityError) {
      console.error('ACTIVITY_ERROR:', activityError)

      return NextResponse.json(
        {
          error: 'Unable to load activity',
          details: activityError.message,
          code: activityError.code,
        },
        { status: 500 },
      )
    }

    console.log('Activity loaded:', activity.id)

    const { data: cells, error: cellsError } = await supabase
      .from('cells')
      .select('row, col, color')
      .eq('activity_id', activity.id)
      .order('created_at', { ascending: true })

    if (cellsError) {
      console.error('CELLS_ERROR:', cellsError)

      return NextResponse.json(
        {
          error: 'Unable to load canvas',
          details: cellsError.message,
          code: cellsError.code,
        },
        { status: 500 },
      )
    }

    console.log('Cells loaded:', cells?.length ?? 0)

    return NextResponse.json({
      activity,
      cells,
    })
  } catch (error) {
    console.error('ACTIVITY_UNHANDLED_ERROR:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
