import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import db from '@/lib/db'
import { USER_ID_HEADER } from '@/lib/auth'
import type { Song } from '@/lib/types'

async function getUserId(): Promise<number> {
  const h = await headers()
  return parseInt(h.get(USER_ID_HEADER) ?? '0')
}

export async function GET(request: Request) {
  const userId = await getUserId()
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') ?? ''
  const type = searchParams.get('type') ?? ''
  const sort = searchParams.get('sort') ?? 'created_at'
  const order = searchParams.get('order') === 'asc' ? 'ASC' : 'DESC'

  const allowed = ['name', 'artist', 'type', 'genre', 'bpm', 'created_at', 'key']
  const sortCol = allowed.includes(sort) ? sort : 'created_at'

  let query = 'SELECT * FROM songs WHERE user_id = ?'
  const params: (string | number)[] = [userId]

  if (search) {
    query += ' AND (name LIKE ? OR artist LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }

  if (type) {
    query += ' AND type = ?'
    params.push(type)
  }

  query += ` ORDER BY ${sortCol} ${order}`

  const songs = db.prepare(query).all(...params) as Song[]
  return NextResponse.json({ songs })
}

export async function POST(request: Request) {
  const userId = await getUserId()
  const body = await request.json()
  const { name, type, artist, album, url, key, bpm, time_signature, genre } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const stmt = db.prepare(`
    INSERT INTO songs (user_id, name, type, artist, album, url, key, bpm, time_signature, genre)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    userId,
    name.trim(),
    type || 'Song',
    artist?.trim() || null,
    album?.trim() || null,
    url?.trim() || null,
    key?.trim() || null,
    bpm ? parseInt(bpm) : null,
    time_signature?.trim() || null,
    genre?.trim() || null
  )

  const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(result.lastInsertRowid) as Song
  return NextResponse.json({ song }, { status: 201 })
}
