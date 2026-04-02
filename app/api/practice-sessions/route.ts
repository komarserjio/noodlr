import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import db from '@/lib/db'
import { USER_ID_HEADER } from '@/lib/auth'
import type { PracticeSession } from '@/lib/types'

async function getUserId(): Promise<number> {
  const h = await headers()
  return parseInt(h.get(USER_ID_HEADER) ?? '0')
}

export async function GET(request: Request) {
  const userId = await getUserId()
  const { searchParams } = new URL(request.url)
  const songId = searchParams.get('songId')

  if (!songId) {
    return NextResponse.json({ error: 'songId is required' }, { status: 400 })
  }

  // Verify song belongs to user
  const song = db.prepare('SELECT id FROM songs WHERE id = ? AND user_id = ?').get(songId, userId)
  if (!song) {
    return NextResponse.json({ error: 'Song not found' }, { status: 404 })
  }

  const sessions = db
    .prepare('SELECT * FROM practice_sessions WHERE song_id = ? AND user_id = ? ORDER BY created_at DESC')
    .all(songId, userId) as PracticeSession[]

  return NextResponse.json({ sessions })
}

export async function POST(request: Request) {
  const userId = await getUserId()
  const body = await request.json()
  const { songId, duration } = body

  if (!songId || duration === undefined) {
    return NextResponse.json({ error: 'songId and duration are required' }, { status: 400 })
  }

  if (typeof duration !== 'number' || duration < 1) {
    return NextResponse.json({ error: 'duration must be a positive number' }, { status: 400 })
  }

  // Verify song exists and belongs to user
  const song = db
    .prepare('SELECT id FROM songs WHERE id = ? AND user_id = ?')
    .get(songId, userId)

  if (!song) {
    return NextResponse.json({ error: 'Song not found' }, { status: 404 })
  }

  // Insert practice session
  const result = db
    .prepare('INSERT INTO practice_sessions (user_id, song_id, duration) VALUES (?, ?, ?)')
    .run(userId, songId, Math.floor(duration))

  const session = db
    .prepare('SELECT * FROM practice_sessions WHERE id = ?')
    .get(result.lastInsertRowid) as PracticeSession

  return NextResponse.json({ session }, { status: 201 })
}
