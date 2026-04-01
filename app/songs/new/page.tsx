import { NavBar } from '@/components/NavBar'
import { SongForm } from '@/components/SongForm'

export const metadata = { title: 'Add Song — Noodlr' }

export default function NewSongPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Add Song</h1>
        <SongForm />
      </main>
    </div>
  )
}
