import { NextResponse } from 'next/server'
import { getAdminSession, validateAdminPassword } from '@/lib/admin-auth'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { isLocation } from '@/lib/locations'

export async function POST(request: Request) {
  if (!(await getAdminSession())) return NextResponse.redirect(new URL('/admin/login', request.url))

  const formData = await request.formData()
  const password = String(formData.get('password') ?? '')
  const location = formData.get('location')
  if (!isLocation(location)) return NextResponse.redirect(new URL('/admin?resetError=server', request.url))
  if (!validateAdminPassword(password)) return NextResponse.redirect(new URL(`/admin?resetError=password&location=${location}`, request.url))

  const supabase = createSupabaseAdminClient()
  const { data: activity, error: activityError } = await supabase
    .from('activities')
    .select('id')
    .eq('location', location)
    .single()

  if (activityError || !activity) return NextResponse.redirect(new URL(`/admin?resetError=server&location=${location}`, request.url))

  const { error: resetError } = await supabase.rpc('reset_activity', { p_activity_id: activity.id })
  if (resetError) return NextResponse.redirect(new URL(`/admin?resetError=server&location=${location}`, request.url))

  return NextResponse.redirect(new URL(`/admin?reset=1&location=${location}`, request.url))
}
