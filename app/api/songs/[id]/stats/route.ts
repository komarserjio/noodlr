import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import db from '@/lib/db'
import { USER_ID_HEADER } from '@/lib/auth'

async function getUserId(): Promise<number> {
  const h = await headers()
  return parseInt(h.get(USER_ID_HEADER) ?? '0')
}

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0

  // dates are distinct UTC date strings sorted descending, e.g. "2026-04-02"
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const mostRecent = new Date(dates[0] + 'T00:00:00Z')
  const diffFromToday = (today.getTime() - mostRecent.getTime()) / 86400000

  // Streak is broken if most recent practice was more than 1 day ago
  if (diffFromToday > 1) return 0

  let streak = 1
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + 'T00:00:00Z')
    const curr = new Date(dates[i] + 'T00:00:00Z')
    const gap = (prev.getTime() - curr.getTime()) / 86400000
    if (gap === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId()
  const { id } = await params

  const song = db
    .prepare('SELECT id FROM songs WHERE id = ? AND user_id = ?')
    .get(id, userId)
  if (!song) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const totals = db
    .prepare(
      'SELECT COUNT(*) as total_sessions, COALESCE(SUM(duration), 0) as total_seconds FROM practice_sessions WHERE song_id = ? AND user_id = ?'
    )
    .get(id, userId) as { total_sessions: number; total_seconds: number }

  const practiceDates = (
    db
      .prepare(
        "SELECT DISTINCT date(created_at) as d FROM practice_sessions WHERE song_id = ? AND user_id = ? ORDER BY d DESC"
      )
      .all(id, userId) as { d: string }[]
  ).map((r) => r.d)

  return NextResponse.json({
    total_sessions: totals.total_sessions,
    minutes_total: Math.floor(totals.total_seconds / 60),
    days_in_a_row: computeStreak(practiceDates),
  })
}
