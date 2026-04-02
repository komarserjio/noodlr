'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { NavBar } from '@/components/NavBar'
import { Button } from '@/components/ui/button'
import { TYPE_COLORS, type Song, type PracticeSession } from '@/lib/types'

interface SongStats {
  total_sessions: number
  minutes_total: number
  days_in_a_row: number
}
import {
  Play,
  Pause,
  Square,
  Pencil,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react'

const PRACTICE_DURATION = 5 * 60

interface ActiveTimer {
  secondsLeft: number
  bpm: number | null
  beatsPerBar: number
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'Z').toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr + 'Z').toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function parseBeatsPerBar(timeSignature: string | null): number {
  if (!timeSignature) return 4
  const n = parseInt(timeSignature.split('/')[0])
  return isNaN(n) || n < 1 ? 4 : n
}

export default function SongViewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [song, setSong] = useState<Song | null>(null)
  const [sessions, setSessions] = useState<PracticeSession[]>([])
  const [stats, setStats] = useState<SongStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Timer state
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Metronome state
  const audioCtxRef = useRef<AudioContext | null>(null)
  const metronomeRef = useRef<NodeJS.Timeout | null>(null)
  const beatCountRef = useRef(0)
  const [beatType, setBeatType] = useState<'accent' | 'regular' | null>(null)

  const fetchData = useCallback(async () => {
    const [songRes, sessionsRes, statsRes] = await Promise.all([
      fetch(`/api/songs/${id}`),
      fetch(`/api/practice-sessions?songId=${id}`),
      fetch(`/api/songs/${id}/stats`),
    ])
    if (!songRes.ok) { router.push('/songs'); return }
    const { song } = await songRes.json()
    const { sessions } = await sessionsRes.json()
    const statsData = statsRes.ok ? await statsRes.json() : null
    setSong(song)
    setSessions(sessions)
    setStats(statsData)
    setLoading(false)
  }, [id, router])

  useEffect(() => { fetchData() }, [fetchData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMetronome()
      audioCtxRef.current?.close()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Timer countdown effect
  useEffect(() => {
    if (!activeTimer || isPaused) return

    timerIntervalRef.current = setInterval(() => {
      setActiveTimer((prev) => {
        if (!prev) return null
        const newSecondsLeft = prev.secondsLeft - 1
        if (newSecondsLeft <= 0) {
          handleStopTimer(PRACTICE_DURATION)
          return null
        }
        return { ...prev, secondsLeft: newSecondsLeft }
      })
    }, 1000)

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTimer?.bpm, isPaused])

  function playClick(accented: boolean) {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
    const ctx = audioCtxRef.current
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = accented ? 1200 : 800
    const duration = accented ? 0.06 : 0.04
    const volume = accented ? 1.0 : 0.5
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  }

  function startMetronome(bpm: number, beatsPerBar: number) {
    stopMetronome()
    beatCountRef.current = 0
    const intervalMs = (60 / bpm) * 1000
    const tick = () => {
      const isAccent = beatCountRef.current === 0
      playClick(isAccent)
      setBeatType(isAccent ? 'accent' : 'regular')
      setTimeout(() => setBeatType(null), 100)
      beatCountRef.current = (beatCountRef.current + 1) % beatsPerBar
    }
    tick()
    metronomeRef.current = setInterval(tick, intervalMs)
  }

  function stopMetronome() {
    if (metronomeRef.current) {
      clearInterval(metronomeRef.current)
      metronomeRef.current = null
    }
    beatCountRef.current = 0
    setBeatType(null)
  }

  function handleStartTimer() {
    if (!song || activeTimer) return
    const beatsPerBar = parseBeatsPerBar(song.time_signature)
    setActiveTimer({ secondsLeft: PRACTICE_DURATION, bpm: song.bpm, beatsPerBar })
    setIsPaused(false)
    if (song.bpm) startMetronome(song.bpm, beatsPerBar)
  }

  function handlePauseTimer() {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    setIsPaused(true)
    stopMetronome()
  }

  function handleResumeTimer() {
    setIsPaused(false)
    if (activeTimer?.bpm) startMetronome(activeTimer.bpm, activeTimer.beatsPerBar)
  }

  async function handleStopTimer(elapsedOrTotal?: number) {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    stopMetronome()

    const duration = elapsedOrTotal ?? (activeTimer ? PRACTICE_DURATION - activeTimer.secondsLeft : 0)
    setActiveTimer(null)
    setIsPaused(false)

    if (duration < 1) return

    try {
      await fetch('/api/practice-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId: parseInt(id), duration }),
      })
      fetchData() // Refresh sessions log
    } catch (error) {
      console.error('Failed to save practice session:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!song) return null

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 pb-24">
        {/* Back link */}
        <Link href="/songs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to songs
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold">{song.name}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[song.type] ?? 'bg-gray-100 text-gray-800'}`}>
                {song.type}
              </span>
            </div>
            {song.artist && (
              <p className="text-muted-foreground text-lg">{song.artist}{song.album && ` — ${song.album}`}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {song.url && (
              <a href={song.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="hover:cursor-pointer">
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                  Open URL
                </Button>
              </a>
            )}
            <Link href={`/songs/${id}/edit`}>
              <Button variant="outline" size="sm" className="hover:cursor-pointer">
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
            </Link>
            <Button
              onClick={handleStartTimer}
              disabled={!!activeTimer}
              size="sm"
              className="hover:cursor-pointer"
            >
              <Play className="h-4 w-4 mr-1.5" />
              Start Practice
            </Button>
          </div>
        </div>

        {/* Song details */}
        <div className="rounded-lg border p-6 mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Details</h2>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
            {song.key && (
              <div>
                <dt className="text-xs text-muted-foreground mb-0.5">Key</dt>
                <dd className="font-medium">{song.key}</dd>
              </div>
            )}
            {song.bpm && (
              <div>
                <dt className="text-xs text-muted-foreground mb-0.5">BPM</dt>
                <dd className="font-medium">{song.bpm}</dd>
              </div>
            )}
            {song.time_signature && (
              <div>
                <dt className="text-xs text-muted-foreground mb-0.5">Time signature</dt>
                <dd className="font-medium">{song.time_signature}</dd>
              </div>
            )}
            {song.genre && (
              <div>
                <dt className="text-xs text-muted-foreground mb-0.5">Genre</dt>
                <dd className="font-medium">{song.genre}</dd>
              </div>
            )}
            {song.album && (
              <div>
                <dt className="text-xs text-muted-foreground mb-0.5">Album</dt>
                <dd className="font-medium">{song.album}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-muted-foreground mb-0.5">Added</dt>
              <dd className="font-medium">{formatDate(song.created_at)}</dd>
            </div>
          </dl>
        </div>

        {/* Practice stats */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Practice</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold">{stats?.total_sessions ?? '—'}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{stats?.total_sessions === 1 ? 'Session' : 'Sessions'}</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold">{stats?.minutes_total ?? '—'}</p>
              <p className="text-sm text-muted-foreground mt-0.5">Minutes total</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold">{stats?.days_in_a_row ?? '—'}</p>
              <p className="text-sm text-muted-foreground mt-0.5">Days in a row</p>
            </div>
          </div>

          {/* Sessions log */}
          {sessions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No practice sessions yet. Start practicing!</p>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Date</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td className="px-4 py-2.5">{formatDateTime(session.created_at)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                        {formatDuration(session.duration)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Sticky footer timer */}
      {activeTimer && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white border-t border-slate-700 shadow-2xl">
          {/* Progress bar */}
          <div className="w-full h-1 bg-slate-800">
            <div
              className="h-full bg-green-500 transition-all duration-100"
              style={{ width: `${((PRACTICE_DURATION - activeTimer.secondsLeft) / PRACTICE_DURATION) * 100}%` }}
            />
          </div>
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => (isPaused ? handleResumeTimer() : handlePauseTimer())}
                className="text-orange-500 hover:text-orange-400 hover:cursor-pointer transition-colors"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
              </button>
              <div>
                <p className="font-semibold">{song.name}</p>
                <p className="text-sm text-slate-300">
                  {isPaused ? 'Time paused: ' : 'Time remaining: '}{formatDuration(activeTimer.secondsLeft)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {activeTimer.bpm && (
                <div className="flex items-center gap-2 text-slate-300">
                  <div className={`rounded-full transition-all duration-75 ${
                    beatType === 'accent' ? 'h-3 w-3 bg-white opacity-100'
                    : beatType === 'regular' ? 'h-2 w-2 bg-orange-400 opacity-100'
                    : 'h-2 w-2 bg-orange-400 opacity-25'
                  }`} />
                  <span className="text-sm tabular-nums">{activeTimer.bpm} BPM</span>
                </div>
              )}
              <button
                onClick={() => handleStopTimer(PRACTICE_DURATION - activeTimer.secondsLeft)}
                className="text-red-500 hover:text-red-400 hover:cursor-pointer transition-colors"
                title="Stop"
              >
                <Square className="h-6 w-6 fill-current" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
