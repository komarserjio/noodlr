import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { hashPassword, createSessionToken, AUTH_COOKIE } from '@/lib/auth'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const trimmedEmail = email.toLowerCase().trim()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail)
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
  }

  const passwordHash = await hashPassword(password)
  const result = db
    .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
    .run(trimmedEmail, passwordHash)

  const userId = result.lastInsertRowid as number
  const token = await createSessionToken(userId)
  const response = NextResponse.json({ success: true }, { status: 201 })

  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })

  return response
}
