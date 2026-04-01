import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DB_DIR, 'repertoire.db')

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })

const db = new Database(DB_PATH)

// Require an email argument: npx tsx scripts/seed.ts user@example.com
const email = process.argv[2]
if (!email) {
  console.error('Usage: npx tsx scripts/seed.ts <email>')
  process.exit(1)
}

const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim()) as
  | { id: number }
  | undefined

if (!user) {
  console.error(`No user found with email "${email}". Create an account first via the signup page.`)
  process.exit(1)
}

const userId = user.id

const songs = [
  { name: 'Stairway to Heaven', type: 'Song', artist: 'Led Zeppelin', album: 'Led Zeppelin IV', key: 'A Minor', bpm: 82, time_signature: '4/4', genre: 'Rock' },
  { name: 'Comfortably Numb', type: 'Song', artist: 'Pink Floyd', album: 'The Wall', key: 'B Minor', bpm: 63, time_signature: '4/4', genre: 'Rock' },
  { name: 'Hotel California', type: 'Song', artist: 'Eagles', album: 'Hotel California', key: 'B Minor', bpm: 75, time_signature: '4/4', genre: 'Rock' },
  { name: 'Smoke on the Water', type: 'Riff', artist: 'Deep Purple', album: 'Machine Head', key: 'G Minor', bpm: 112, time_signature: '4/4', genre: 'Hard Rock' },
  { name: 'Sweet Child O\' Mine', type: 'Song', artist: 'Guns N\' Roses', album: 'Appetite for Destruction', key: 'D Major', bpm: 122, time_signature: '4/4', genre: 'Hard Rock' },
  { name: 'Back in Black', type: 'Riff', artist: 'AC/DC', album: 'Back in Black', key: 'E Minor', bpm: 93, time_signature: '4/4', genre: 'Hard Rock' },
  { name: 'Purple Rain', type: 'Song', artist: 'Prince', album: 'Purple Rain', key: 'Bb Major', bpm: 113, time_signature: '4/4', genre: 'R&B' },
  { name: 'Blackbird', type: 'Song', artist: 'The Beatles', album: 'The White Album', key: 'G Major', bpm: 96, time_signature: '3/4', genre: 'Folk Rock' },
  { name: 'Wonderwall', type: 'Song', artist: 'Oasis', album: '(What\'s the Story) Morning Glory?', key: 'F# Minor', bpm: 87, time_signature: '4/4', genre: 'Brit Pop' },
  { name: 'Nothing Else Matters', type: 'Song', artist: 'Metallica', album: 'Metallica', key: 'E Minor', bpm: 69, time_signature: '6/8', genre: 'Metal' },
  { name: 'Sultans of Swing', type: 'Song', artist: 'Dire Straits', album: 'Dire Straits', key: 'D Minor', bpm: 148, time_signature: '4/4', genre: 'Rock' },
  { name: 'Eruption', type: 'Riff', artist: 'Van Halen', album: 'Van Halen', key: 'E Major', bpm: 140, time_signature: '4/4', genre: 'Hard Rock' },
  { name: 'The House of the Rising Sun', type: 'Song', artist: 'The Animals', album: 'The Animals', key: 'A Minor', bpm: 78, time_signature: '6/8', genre: 'Blues Rock' },
  { name: 'Wish You Were Here', type: 'Song', artist: 'Pink Floyd', album: 'Wish You Were Here', key: 'G Major', bpm: 63, time_signature: '4/4', genre: 'Rock' },
  { name: 'Layla', type: 'Song', artist: 'Derek and the Dominos', album: 'Layla and Other Assorted Love Songs', key: 'D Minor', bpm: 119, time_signature: '4/4', genre: 'Blues Rock' },
  { name: 'Little Wing', type: 'Melody', artist: 'Jimi Hendrix', album: 'Axis: Bold as Love', key: 'E Minor', bpm: 69, time_signature: '12/8', genre: 'Blues Rock' },
  { name: 'Tears in Heaven', type: 'Song', artist: 'Eric Clapton', album: 'Rush OST', key: 'A Major', bpm: 80, time_signature: '4/4', genre: 'Soft Rock' },
  { name: 'More Than a Feeling', type: 'Song', artist: 'Boston', album: 'Boston', key: 'D Major', bpm: 113, time_signature: '4/4', genre: 'Rock' },
  { name: 'December', type: 'Song', artist: 'Collective Soul', album: 'Hints Allegations and Things Left Unsaid', key: 'G Major', bpm: 76, time_signature: '4/4', genre: 'Alternative Rock' },
  { name: 'Black', type: 'Song', artist: 'Pearl Jam', album: 'Ten', key: 'E Major', bpm: 72, time_signature: '4/4', genre: 'Grunge' },
  { name: 'Heart of Gold', type: 'Song', artist: 'Neil Young', album: 'Harvest', key: 'D Major', bpm: 99, time_signature: '4/4', genre: 'Folk Rock' },
  { name: 'Fast Car', type: 'Song', artist: 'Tracy Chapman', album: 'Tracy Chapman', key: 'C# Major', bpm: 104, time_signature: '4/4', genre: 'Folk' },
  { name: 'Jolene', type: 'Song', artist: 'Dolly Parton', album: 'Jolene', key: 'A Minor', bpm: 126, time_signature: '4/4', genre: 'Country' },
  { name: 'Brown Eyed Girl', type: 'Song', artist: 'Van Morrison', album: 'Blowin\' Your Mind!', key: 'G Major', bpm: 150, time_signature: '4/4', genre: 'Pop Rock' },
  { name: 'Redemption Song', type: 'Song', artist: 'Bob Marley', album: 'Uprising', key: 'G Major', bpm: 75, time_signature: '4/4', genre: 'Reggae' },
  { name: 'No Woman No Cry', type: 'Song', artist: 'Bob Marley', album: 'Natty Dread', key: 'C Major', bpm: 75, time_signature: '4/4', genre: 'Reggae' },
  { name: 'Creep', type: 'Song', artist: 'Radiohead', album: 'Pablo Honey', key: 'G Major', bpm: 92, time_signature: '4/4', genre: 'Alternative Rock' },
  { name: 'Come as You Are', type: 'Riff', artist: 'Nirvana', album: 'Nevermind', key: 'F Minor', bpm: 120, time_signature: '4/4', genre: 'Grunge' },
  { name: 'Under the Bridge', type: 'Song', artist: 'Red Hot Chili Peppers', album: 'Blood Sugar Sex Magik', key: 'E Major', bpm: 82, time_signature: '4/4', genre: 'Alternative Rock' },
  { name: 'Californication', type: 'Song', artist: 'Red Hot Chili Peppers', album: 'Californication', key: 'A Minor', bpm: 96, time_signature: '4/4', genre: 'Alternative Rock' },
  { name: 'Mr. Jones', type: 'Song', artist: 'Counting Crows', album: 'August and Everything After', key: 'A Minor', bpm: 135, time_signature: '4/4', genre: 'Alternative Rock' },
  { name: 'Glycerine', type: 'Song', artist: 'Bush', album: 'Sixteen Stone', key: 'D Major', bpm: 75, time_signature: '4/4', genre: 'Alternative Rock' },
  { name: 'The Scientist', type: 'Song', artist: 'Coldplay', album: 'A Rush of Blood to the Head', key: 'F Major', bpm: 75, time_signature: '4/4', genre: 'Alternative Rock' },
  { name: 'Banana Pancakes', type: 'Song', artist: 'Jack Johnson', album: 'In Between Dreams', key: 'G Major', bpm: 88, time_signature: '4/4', genre: 'Acoustic Pop' },
  { name: 'Better Together', type: 'Song', artist: 'Jack Johnson', album: 'In Between Dreams', key: 'F Major', bpm: 108, time_signature: '4/4', genre: 'Acoustic Pop' },
  { name: 'Free Fallin\'', type: 'Song', artist: 'Tom Petty', album: 'Full Moon Fever', key: 'F Major', bpm: 85, time_signature: '4/4', genre: 'Rock' },
  { name: 'Breakdown', type: 'Song', artist: 'Tom Petty', album: 'Tom Petty and the Heartbreakers', key: 'E Minor', bpm: 108, time_signature: '4/4', genre: 'Rock' },
  { name: 'Take Me Home, Country Roads', type: 'Song', artist: 'John Denver', album: 'Poems, Prayers & Promises', key: 'G Major', bpm: 118, time_signature: '4/4', genre: 'Country Folk' },
  { name: 'Behind Blue Eyes', type: 'Song', artist: 'The Who', album: 'Who\'s Next', key: 'E Major', bpm: 116, time_signature: '4/4', genre: 'Rock' },
  { name: 'Patience', type: 'Song', artist: 'Guns N\' Roses', album: 'G N\' R Lies', key: 'G Major', bpm: 120, time_signature: '4/4', genre: 'Acoustic Rock' },
  { name: 'Here Comes the Sun', type: 'Song', artist: 'The Beatles', album: 'Abbey Road', key: 'A Major', bpm: 129, time_signature: '4/4', genre: 'Pop Rock' },
  { name: 'While My Guitar Gently Weeps', type: 'Song', artist: 'The Beatles', album: 'The White Album', key: 'A Minor', bpm: 68, time_signature: '4/4', genre: 'Rock' },
  { name: 'Dust in the Wind', type: 'Melody', artist: 'Kansas', album: 'Point of Know Return', key: 'C Major', bpm: 96, time_signature: '4/4', genre: 'Prog Rock' },
  { name: 'Classical Gas', type: 'Melody', artist: 'Mason Williams', album: 'The Mason Williams Phonograph Record', key: 'A Minor', bpm: 152, time_signature: '3/4', genre: 'Classical' },
  { name: 'Fingerpicking I-V-vi-IV', type: 'Progression', artist: null, album: null, key: 'G Major', bpm: 80, time_signature: '4/4', genre: null },
  { name: 'Spanish Romance', type: 'Melody', artist: null, album: null, key: 'E Minor', bpm: 68, time_signature: '3/4', genre: 'Classical' },
  { name: '12-Bar Blues in E', type: 'Progression', artist: null, album: null, key: 'E Major', bpm: 90, time_signature: '4/4', genre: 'Blues' },
  { name: 'Pentatonic Lead Riff', type: 'Riff', artist: null, album: null, key: 'A Minor', bpm: 110, time_signature: '4/4', genre: 'Blues Rock' },
  { name: 'Andalucia Progression', type: 'Progression', artist: null, album: null, key: 'A Minor', bpm: 72, time_signature: '4/4', genre: 'Flamenco' },
  { name: 'Jazz ii-V-I', type: 'Progression', artist: null, album: null, key: 'C Major', bpm: 120, time_signature: '4/4', genre: 'Jazz' },
]

const stmt = db.prepare(`
  INSERT INTO songs (user_id, name, type, artist, album, key, bpm, time_signature, genre, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'), datetime('now', '-' || ? || ' days'))
`)

// Clear existing songs for this user first
db.prepare('DELETE FROM songs WHERE user_id = ?').run(userId)

songs.forEach((song) => {
  const daysAgo = Math.floor(Math.random() * 180)
  stmt.run(
    userId,
    song.name,
    song.type,
    song.artist ?? null,
    song.album ?? null,
    song.key ?? null,
    song.bpm ?? null,
    song.time_signature ?? null,
    song.genre ?? null,
    daysAgo,
    daysAgo,
  )
})

console.log(`✓ Seeded ${songs.length} songs for ${email}`)
db.close()
