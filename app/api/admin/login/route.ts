import { NextResponse } from 'next/server'
import { createAdminSession, isAdminConfigured, validateAdminCredentials } from '@/lib/admin-auth'

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: 'Admin access is not configured.' }, { status: 503 })
  }

  const formData = await request.formData()
  const username = String(formData.get('username') ?? '')
  const password = String(formData.get('password') ?? '')

  if (!validateAdminCredentials(username, password)) {
    return NextResponse.redirect(new URL('/admin/login?error=1', request.url))
  }

  await createAdminSession(username)
  return NextResponse.redirect(new URL('/admin', request.url))
}
