// Must stay in sync with the `location` values in the `activities` table
// (see supabase/migrations/20260922000000_initial_schema.sql). 'site-c' is
// still a placeholder — rename it here and in the DB (update + CHECK
// constraint) when the real slug is decided.
export const LOCATIONS = ['idc-blr', 'idc-chn', 'site-c'] as const

export type Location = (typeof LOCATIONS)[number]

export const LOCATION_LABELS: Record<Location, string> = {
  'idc-blr': 'IDC Bengaluru',
  'idc-chn': 'IDC Chennai',
  'site-c': 'Site C',
}

export function isLocation(value: unknown): value is Location {
  return typeof value === 'string' && (LOCATIONS as readonly string[]).includes(value)
}
