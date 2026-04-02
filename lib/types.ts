export interface Song {
  id: number
  name: string
  type: string
  artist: string | null
  album: string | null
  url: string | null
  key: string | null
  bpm: number | null
  time_signature: string | null
  genre: string | null
  created_at: string
  updated_at: string
  last_practiced: string | null
}

export interface PracticeSession {
  id: number
  user_id: number
  song_id: number
  duration: number
  created_at: string
}

export interface SongInput {
  name: string
  type: string
  artist: string
  album: string
  url: string
  key: string
  bpm: string
  time_signature: string
  genre: string
}

export const SONG_TYPES = ['Song', 'Riff', 'Melody', 'Progression'] as const
export type SongType = typeof SONG_TYPES[number]

export const TIME_SIGNATURES = ['4/4', '3/4', '6/8', '5/4', '7/8', '12/8', '2/4', '9/8'] as const

export const TYPE_COLORS: Record<string, string> = {
  Song: 'bg-blue-100 text-blue-800',
  Riff: 'bg-green-100 text-green-800',
  Melody: 'bg-purple-100 text-purple-800',
  Progression: 'bg-orange-100 text-orange-800',
}
