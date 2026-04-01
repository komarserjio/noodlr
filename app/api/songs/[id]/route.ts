import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import db from '@/lib/db'
import { USER_ID_HEADER } from '@/lib/auth'
import type { Song } from '@/lib/types'

async function getUserId(): Promise<number> {
  const h = await headers()
  return parseInt(h.get(USER_ID_HEADER) ?? '0')
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId()
  const { id } = await params
  const song = db
    .prepare('SELECT * FROM songs WHERE id = ? AND user_id = ?')
    .get(id, userId) as Song | undefined
  if (!song) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ song })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId()
  const { id } = await params
  const existing = db
    .prepare('SELECT id FROM songs WHERE id = ? AND user_id = ?')
    .get(id, userId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const { name, type, artist, album, url, key, bpm, time_signature, genre } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  db.prepare(`
    UPDATE songs
    SET name = ?, type = ?, artist = ?, album = ?, url = ?, key = ?, bpm = ?,
        time_signature = ?, genre = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(
    name.trim(),
    type || 'Song',
    artist?.trim() || null,
    album?.trim() || null,
    url?.trim() || null,
    key?.trim() || null,
    bpm ? parseInt(bpm) : null,
    time_signature?.trim() || null,
    genre?.trim() || null,
    id,
    userId
  )

  const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(id) as Song
  return NextResponse.json({ song })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId()
  const { id } = await params
  const existing = db
    .prepare('SELECT id FROM songs WHERE id = ? AND user_id = ?')
    .get(id, userId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  db.prepare('DELETE FROM songs WHERE id = ? AND user_id = ?').run(id, userId)
  return NextResponse.json({ success: true })
}
