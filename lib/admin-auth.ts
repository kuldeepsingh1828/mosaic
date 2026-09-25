import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const SESSION_COOKIE = 'mosaic_admin_session'
const SESSION_MAX_AGE = 60 * 60 * 8

type SessionPayload = { username: string; exp: number }

function secret() {
  return process.env.SESSION_SECRET ?? ''
}

function sign(value: string) {
  return createHmac('sha256', secret()).update(value).digest('base64url')
}

function encode(payload: SessionPayload) {
  const value = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${value}.${sign(value)}`
}

function decode(value: string): SessionPayload | null {
  const [payload, signature] = value.split('.')
  if (!payload || !signature || !secret()) return null
  const expected = sign(payload)
  const valid = signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  if (!valid) return null
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()) as SessionPayload
    return parsed.exp > Date.now() ? parsed : null
  } catch {
    return null
  }
}

export async function createAdminSession(username: string) {
  const store = await cookies()
  store.set(SESSION_COOKIE, encode({ username, exp: Date.now() + SESSION_MAX_AGE * 1000 }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

export async function clearAdminSession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getAdminSession() {
  const value = (await cookies()).get(SESSION_COOKIE)?.value
  return value ? decode(value) : null
}

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && process.env.SESSION_SECRET)
}

export function validateAdminCredentials(username: string, password: string) {
  return username === process.env.ADMIN_USERNAME && validateAdminPassword(password)
}

export function validateAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD ?? ''
  const suppliedBuffer = Buffer.from(password)
  const expectedBuffer = Buffer.from(expected)
  return Boolean(expected) && suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer)
}

export const adminSessionCookie = SESSION_COOKIE

export function sessionMaxAge() {
  return SESSION_MAX_AGE
}

export function sessionToken(username: string) {
  return encode({ username, exp: Date.now() + SESSION_MAX_AGE * 1000 })
}
