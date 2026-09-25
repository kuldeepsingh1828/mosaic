import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Location } from '@/lib/locations'

export async function getActivityByLocation<T extends string>(
  supabase: SupabaseClient,
  location: Location,
  columns: T,
) {
  return supabase.from('activities').select(columns).eq('location', location).single()
}
