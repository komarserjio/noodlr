import { notFound } from 'next/navigation'
import db from '@/lib/db'
import { NavBar } from '@/components/NavBar'
import { SongForm } from '@/components/SongForm'
import type { Song } from '@/lib/types'

export const metadata = { title: 'Edit Song — Noodlr' }

export default async function EditSongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(id) as Song | undefined

  if (!song) notFound()

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Edit Song</h1>
        <SongForm song={song} />
      </main>
    </div>
  )
}
