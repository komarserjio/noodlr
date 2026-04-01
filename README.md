# Noodlr 🎸

A modern web app for musicians to organize, track, and manage their musical repertoire. Practice songs and monitor your progress with built-in practice timers.

VIBE CODED USING CLAUDE CODE

## Features

### 📚 Song Management
- **Create & organize songs** with rich metadata:
  - Song name, type (Song, Riff, Melody, Progression)
  - Artist, album, and genre
  - Musical details: key, BPM, time signature
  - External URLs (tabs, tutorials, recordings)
- **Search & filter** by song name, artist, or type
- **Sortable columns** for quick browsing
- **Edit & delete** songs anytime

### 🎯 Practice Tracking
- **Practice timer** - Track focused practice sessions per song
  - 5-minute countdown timer with real-time display
  - Start/stop at any time for flexibility
  - Visual progress bar (like a video player)
  - Sticky footer display while practicing
- **Session history** - Each practice session is saved with:
  - Song name
  - Duration practiced (actual elapsed time)
  - Timestamp of session
- **Future stats** - Foundation laid for upcoming analytics (total practice time per song, session count, practice streaks)

### 🔐 Multi-User Support
- **Secure signup & login** with email and password
- **User data isolation** - Each user sees only their own songs and sessions
- **Password security** - PBKDF2 hashing with SHA-256 (100,000 iterations)
- **Session management** - HMAC-signed session tokens with httpOnly cookies

## Tech Stack

### Frontend
- **Next.js 16.2.2** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Pre-built, accessible React components
- **Lucide React** - Beautiful, consistent icons

### Backend
- **Next.js API Routes** - Serverless backend
- **SQLite with better-sqlite3** - Lightweight, local database
- **Next.js Middleware** - Request authentication & user context injection

### Database
- Songs table with user ownership
- Practice sessions tracking (song, duration, timestamp)
- User accounts with hashed passwords

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd reportoire-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - You'll be redirected to the login page

### First Time Setup

1. **Sign up** with email and password
2. **Add songs** from the "Add Song" button in the nav
3. **Start practicing** - Click the Play button next to any song to start the timer

### Seeding Demo Data (Optional)

Populate your account with sample songs:

```bash
npx tsx scripts/seed.ts your-email@example.com
```

This will add 8 sample songs to your account.

## API Documentation

All endpoints require authentication (session token via httpOnly cookie). Protected endpoints verify user ownership before allowing data access.

### Authentication

#### `POST /api/auth/signup`
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:** `201 Created`
```json
{
  "message": "User created successfully"
}
```

**Errors:**
- `400` - Invalid email format or password < 8 characters
- `409` - Email already registered

#### `POST /api/auth/login`
Log in with email and password. Returns a session cookie.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Logged in successfully"
}
```

**Errors:**
- `401` - Invalid email or password
- `404` - User not found

#### `POST /api/auth/logout`
Log out and clear the session cookie.

**Response:** `200 OK`

---

### Songs

#### `GET /api/songs`
Fetch all songs for the authenticated user.

**Query Parameters:**
- `search` (optional) - Filter by song name or artist
- `type` (optional) - Filter by song type
- `sort` (optional) - Sort by field: `name`, `artist`, `type`, `genre`, `bpm`, `created_at` (default: `created_at`)
- `order` (optional) - Sort order: `asc` or `desc` (default: `desc`)

**Response:** `200 OK`
```json
{
  "songs": [
    {
      "id": 1,
      "name": "Stairway to Heaven",
      "type": "Song",
      "artist": "Led Zeppelin",
      "album": "Led Zeppelin IV",
      "url": "https://tabs.ultimate-guitar.com/...",
      "key": "Am",
      "bpm": 82,
      "time_signature": "4/4",
      "genre": "Rock",
      "created_at": "2026-03-20T10:30:00",
      "updated_at": "2026-03-20T10:30:00"
    }
  ]
}
```

#### `POST /api/songs`
Create a new song.

**Request:**
```json
{
  "name": "Stairway to Heaven",
  "type": "Song",
  "artist": "Led Zeppelin",
  "album": "Led Zeppelin IV",
  "url": "https://tabs.ultimate-guitar.com/...",
  "key": "Am",
  "bpm": 82,
  "time_signature": "4/4",
  "genre": "Rock"
}
```

**Response:** `201 Created`
```json
{
  "song": { /* full song object */ }
}
```

#### `PUT /api/songs/[id]`
Update an existing song.

**Request:** Same as POST

**Response:** `200 OK`
```json
{
  "song": { /* updated song object */ }
}
```

#### `DELETE /api/songs/[id]`
Delete a song (and its associated practice sessions).

**Response:** `200 OK`

**Errors:**
- `404` - Song not found or doesn't belong to user

---

### Practice Sessions

#### `POST /api/practice-sessions`
Save a practice session after stopping the timer.

**Request:**
```json
{
  "songId": 1,
  "duration": 245
}
```

Where `duration` is the actual elapsed time in seconds (e.g., stopped at 4:05 = 245 seconds).

**Response:** `201 Created`
```json
{
  "session": {
    "id": 5,
    "user_id": 1,
    "song_id": 1,
    "duration": 245,
    "created_at": "2026-03-20T14:15:30"
  }
}
```

**Errors:**
- `400` - Missing or invalid `songId` or `duration`
- `404` - Song not found or doesn't belong to user

---

## Project Structure

```
reportoire-web/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── songs/              # Song CRUD endpoints
│   │   └── practice-sessions/  # Practice session tracking
│   ├── login/                  # Login page
│   ├── signup/                 # Signup page
│   ├── songs/                  # Songs list & practice UI
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home redirect
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── NavBar.tsx              # Navigation header
│   ├── SongForm.tsx            # Reusable song form
│   └── ...
├── lib/
│   ├── auth.ts                 # Password hashing & session tokens
│   ├── db.ts                   # Database initialization & schema
│   ├── types.ts                # TypeScript interfaces
│   └── utils.ts                # Utility functions
├── middleware.ts               # Route protection & auth injection
├── scripts/
│   └── seed.ts                 # Demo data seeding script
└── data/
    └── repertoire.db           # SQLite database (created at runtime)
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Database

The app uses SQLite with WAL (Write-Ahead Logging) for better concurrency. Database file is stored at `data/repertoire.db` and is automatically initialized on first run.

## Future Enhancements

- 📊 **Practice Statistics** - View practice history and progress per song
- 🎯 **Goals & Streaks** - Set practice goals and track consistency
- 📱 **Mobile App** - Native apps for iOS/Android
- 🎵 **Music Integration** - Link to Spotify, YouTube, or other services
- 📤 **Export Data** - Export practice logs as CSV/PDF

## License

MIT
