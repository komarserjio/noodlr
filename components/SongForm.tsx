'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SONG_TYPES, TIME_SIGNATURES, type Song } from '@/lib/types'

interface SongFormProps {
  song?: Song
}

export function SongForm({ song }: SongFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: song?.name ?? '',
    type: song?.type ?? 'Song',
    artist: song?.artist ?? '',
    album: song?.album ?? '',
    url: song?.url ?? '',
    key: song?.key ?? '',
    bpm: song?.bpm?.toString() ?? '',
    time_signature: song?.time_signature ?? '',
    genre: song?.genre ?? '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Name is required')
      return
    }

    setLoading(true)
    try {
      const url = song ? `/api/songs/${song.id}` : '/api/songs'
      const method = song ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong')
        return
      }

      router.push('/songs')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive text-sm px-4 py-3">
          {error}
        </div>
      )}

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Stairway to Heaven"
          autoFocus
        />
      </div>

      {/* Type + Artist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <Select value={form.type} onValueChange={(v) => set('type', v)}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SONG_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="artist">Artist</Label>
          <Input
            id="artist"
            value={form.artist}
            onChange={(e) => set('artist', e.target.value)}
            placeholder="e.g. Led Zeppelin"
          />
        </div>
      </div>

      {/* Album + URL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="album">Album</Label>
          <Input
            id="album"
            value={form.album}
            onChange={(e) => set('album', e.target.value)}
            placeholder="e.g. Led Zeppelin IV"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            type="url"
            value={form.url}
            onChange={(e) => set('url', e.target.value)}
            placeholder="YouTube, Spotify, tabs link..."
          />
        </div>
      </div>

      {/* Key + BPM + Time Signature */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="key">Key</Label>
          <Input
            id="key"
            value={form.key}
            onChange={(e) => set('key', e.target.value)}
            placeholder="e.g. A Minor"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bpm">BPM</Label>
          <Input
            id="bpm"
            type="number"
            min={20}
            max={400}
            value={form.bpm}
            onChange={(e) => set('bpm', e.target.value)}
            placeholder="e.g. 120"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="time_signature">Time Signature</Label>
          <Select
            value={form.time_signature}
            onValueChange={(v) => set('time_signature', v)}
          >
            <SelectTrigger id="time_signature">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">— None</SelectItem>
              {TIME_SIGNATURES.map((ts) => (
                <SelectItem key={ts} value={ts}>
                  {ts}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Genre */}
      <div className="space-y-1.5">
        <Label htmlFor="genre">Genre</Label>
        <Input
          id="genre"
          value={form.genre}
          onChange={(e) => set('genre', e.target.value)}
          placeholder="e.g. Rock, Blues, Jazz"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading} className="hover:cursor-pointer">
          {loading ? 'Saving...' : song ? 'Save Changes' : 'Add Song'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/songs')}
          disabled={loading}
          className="hover:cursor-pointer"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
