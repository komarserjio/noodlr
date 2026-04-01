import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { verifyPassword, createSessionToken, AUTH_COOKIE } from '@/lib/auth'

interface UserRow {
  id: number
  email: string
  password_hash: string
}

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const user = db
    .prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
    .get(email.toLowerCase().trim()) as UserRow | undefined

  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const token = await createSessionToken(user.id)
  const response = NextResponse.json({ success: true })

  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })

  return response
}
