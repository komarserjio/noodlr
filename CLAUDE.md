@AGENTS.md

# Project: Repertoire Web

Music practice tracker — log songs and practice sessions. 
Public name is Noodlr.


Full project and features description is in `README.md`.

## Stack

- Next.js 16.2.2, App Router, React 19, TypeScript
- Tailwind CSS v4, shadcn/ui (`components/ui/`)
- better-sqlite3 (server-side only — in `serverExternalPackages`)
- `reactStrictMode: false`

## Structure

```
app/          # Routes (App Router)
  api/        # Route handlers: /api/songs, /api/practice-sessions, /api/auth/*
  songs/      # Songs list, [id] detail, [id]/edit, new
  login/
  signup/
components/   # NavBar, SongForm, NoodlrIcon; UI primitives in components/ui/
lib/          # db.ts, auth.ts, types.ts, utils.ts
data/         # repertoire.db (SQLite, WAL mode)
```

## Database schema

**users** — id, email, password_hash, created_at
**songs** — id, user_id, name, type, artist, album, url, key, bpm, time_signature, genre, created_at, updated_at
**practice_sessions** — id, user_id, song_id, duration, created_at

## API specification

Full OpenAPI 3.1 spec: `openapi.yml` — endpoints, request/response schemas, auth requirements.

## Key conventions

- All shared types live in `lib/types.ts` — check before defining new ones
- Song types: `Song | Riff | Melody | Progression` (see `SONG_TYPES` in types.ts)
- Auth is session-based, enforced in `middleware.ts`
- DB access is server-side only (Route Handlers or Server Components/Actions)
- Dev server: `npm run dev` on port 3000
