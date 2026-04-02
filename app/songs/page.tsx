'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  ExternalLink,
  Search,
  X,
  Play,
  Pause,
  Square,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { NavBar } from '@/components/NavBar'
import { SONG_TYPES, TYPE_COLORS, type Song } from '@/lib/types'

type SortField = 'name' | 'artist' | 'type' | 'created_at' | 'last_practiced'
type SortOrder = 'asc' | 'desc'

interface ActiveTimer {
  songId: number
  songName: string
  secondsLeft: number
  bpm: number | null
  beatsPerBar: number
}

const PRACTICE_DURATION = 5 * 60 // 5 minutes in seconds

export default function SongsPage() {
  const router = useRouter()
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sort, setSort] = useState<SortField>('created_at')
  const [order, setOrder] = useState<SortOrder>('desc')

  // Timer state
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  // Metronome state
  const audioCtxRef = useRef<AudioContext | null>(null)
  const metronomeRef = useRef<NodeJS.Timeout | null>(null)
  const beatCountRef = useRef(0)
  const [beatType, setBeatType] = useState<'accent' | 'regular' | null>(null)

  const fetchSongs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (typeFilter) params.set('type', typeFilter)
    params.set('sort', sort)
    params.set('order', order)

    const res = await fetch(`/api/songs?${params}`)
    const data = await res.json()
    setSongs(data.songs ?? [])
    setLoading(false)
  }, [search, typeFilter, sort, order])

  useEffect(() => {
    fetchSongs()
  }, [fetchSongs])

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      stopMetronome()
      audioCtxRef.current?.close()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Timer effect: decrement seconds and auto-stop at 0
  // Depends on songId (not the full activeTimer object) so the interval is created
  // once per start/resume and not torn down and recreated on every tick.
  useEffect(() => {
    if (!activeTimer?.songId || isPaused) return

    timerIntervalRef.current = setInterval(() => {
      setActiveTimer((prev) => {
        if (!prev) return null

        const newSecondsLeft = prev.secondsLeft - 1

        if (newSecondsLeft <= 0) {
          // Auto-stop timer, save session
          handleStopTimer(prev.songId, PRACTICE_DURATION)
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
  }, [activeTimer?.songId, isPaused])

  function toggleSort(field: SortField) {
    if (sort === field) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(field)
      setOrder('asc')
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sort !== field) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
    return order === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    )
  }

  async function handleDelete(song: Song) {
    if (!confirm(`Delete "${song.name}"?`)) return
    await fetch(`/api/songs/${song.id}`, { method: 'DELETE' })
    fetchSongs()
  }

  function parseBeatsPerBar(timeSignature: string | null): number {
    if (!timeSignature) return 4
    const n = parseInt(timeSignature.split('/')[0])
    return isNaN(n) || n < 1 ? 4 : n
  }

  function playClick(accented: boolean) {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
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

  function handlePlayTimer(song: Song) {
    if (activeTimer) return // Disabled while timer is running

    const beatsPerBar = parseBeatsPerBar(song.time_signature)
    setActiveTimer({
      songId: song.id,
      songName: song.name,
      secondsLeft: PRACTICE_DURATION,
      bpm: song.bpm,
      beatsPerBar,
    })
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
    // Timer effect will automatically restart the interval
  }

  async function handleStopTimer(songId: number, duration: number) {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    stopMetronome()
    setActiveTimer(null)
    setIsPaused(false)

    try {
      const res = await fetch('/api/practice-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songId,
          duration,
        }),
      })

      if (res.ok) {
        // Show toast notification
        const elapsedMinutes = Math.floor(duration / 60)
        const elapsedSeconds = duration % 60
        const timeStr = `${elapsedMinutes}:${elapsedSeconds.toString().padStart(2, '0')}`

        // Create and show toast (simple alert for now, could be upgraded to toast library)
        const songName = songs.find(s => s.id === songId)?.name || 'Unknown song'
        showToastNotification(`Practice session saved: ${timeStr} on ${songName}`)
      }
    } catch (error) {
      console.error('Failed to save practice session:', error)
    }
  }

  function showToastNotification(message: string) {
    // Simple toast - could be replaced with a toast library later
    const toast = document.createElement('div')
    toast.className =
      'fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-40 animate-pulse'
    toast.textContent = message
    document.body.appendChild(toast)

    setTimeout(() => {
      toast.remove()
    }, 3000)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr + 'Z').toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function formatTimerDisplay(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const hasFilters = search || typeFilter

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 pb-20">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name or artist..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground hover:cursor-pointer"
                onClick={() => setSearch('')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v === '' ? '' : v)}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              {SONG_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSearch('')
                setTypeFilter('')
              }}
              title="Clear filters"
              className="hover:cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-24 text-muted-foreground">Loading...</div>
        ) : songs.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-muted-foreground mb-4">
              {hasFilters ? 'No songs match your filters.' : 'No songs yet. Add your first one!'}
            </p>
            {!hasFilters && <Link href="/songs/new" className={buttonVariants()}>Add Song</Link>}
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        className="flex items-center gap-1.5 hover:text-foreground font-medium hover:cursor-pointer"
                        onClick={() => toggleSort('name')}
                      >
                        Name <SortIcon field="name" />
                      </button>
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      <button
                        className="flex items-center gap-1.5 hover:text-foreground font-medium hover:cursor-pointer"
                        onClick={() => toggleSort('type')}
                      >
                        Type <SortIcon field="type" />
                      </button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <button
                        className="flex items-center gap-1.5 hover:text-foreground font-medium hover:cursor-pointer"
                        onClick={() => toggleSort('artist')}
                      >
                        Artist <SortIcon field="artist" />
                      </button>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      <button
                        className="flex items-center gap-1.5 hover:text-foreground font-medium hover:cursor-pointer"
                        onClick={() => toggleSort('last_practiced')}
                      >
                        Last practiced <SortIcon field="last_practiced" />
                      </button>
                    </TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {songs.map((song) => (
                    <TableRow key={song.id} className="group">
                      <TableCell>
                        <div className="font-medium">{song.name}</div>
                        {/* Mobile: show type + artist inline */}
                        <div className="sm:hidden text-sm text-muted-foreground mt-0.5">
                          {[song.type, song.artist].filter(Boolean).join(' · ')}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            TYPE_COLORS[song.type] ?? 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {song.type}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {song.artist ?? '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                        {song.last_practiced ? formatDate(song.last_practiced) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:cursor-pointer"
                            onClick={() => handlePlayTimer(song)}
                            disabled={!!activeTimer}
                            title="Start practice timer"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </Button>
                          {song.url && (
                            <a
                              href={song.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open URL"
                              className={cn(
                                buttonVariants({ variant: 'ghost', size: 'icon' }),
                                'h-8 w-8 hover:cursor-pointer'
                              )}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:cursor-pointer"
                            onClick={() => router.push(`/songs/${song.id}/edit`)}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:cursor-pointer"
                            onClick={() => handleDelete(song)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              {songs.length} {songs.length === 1 ? 'song' : 'songs'}
            </p>
          </>
        )}
      </main>

      {/* Sticky footer timer */}
      {activeTimer && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white border-t border-slate-700 shadow-2xl">
          {/* Progress bar */}
          <div className="w-full h-1 bg-slate-800">
            <div
              className="h-full bg-green-500 transition-all duration-100"
              style={{
                width: `${((PRACTICE_DURATION - activeTimer.secondsLeft) / PRACTICE_DURATION) * 100}%`,
              }}
            />
          </div>

          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => (isPaused ? handleResumeTimer() : handlePauseTimer())}
                className="text-orange-500 hover:text-orange-400 hover:cursor-pointer transition-colors"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? (
                  <Play className="h-5 w-5" />
                ) : (
                  <Pause className="h-5 w-5" />
                )}
              </button>
              <div>
                <p className="font-semibold">{activeTimer.songName}</p>
                <p className="text-sm text-slate-300">
                  {isPaused ? 'Time paused: ' : 'Time remaining: '}{formatTimerDisplay(activeTimer.secondsLeft)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {activeTimer.bpm && (
                <div className="flex items-center gap-2 text-slate-300">
                  <div
                    className={`rounded-full transition-all duration-75 ${
                      beatType === 'accent'
                        ? 'h-3 w-3 bg-white opacity-100'
                        : beatType === 'regular'
                        ? 'h-2 w-2 bg-orange-400 opacity-100'
                        : 'h-2 w-2 bg-orange-400 opacity-25'
                    }`}
                  />
                  <span className="text-sm tabular-nums">{activeTimer.bpm} BPM</span>
                </div>
              )}
              <button
                onClick={() =>
                  handleStopTimer(activeTimer.songId, PRACTICE_DURATION - activeTimer.secondsLeft)
                }
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
