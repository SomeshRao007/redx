# Rackd

A workout tracker that's fast enough to use mid-set, offline-first, and shared with family.
Pick a lift, log weight + reps, the app auto-fills your last numbers so logging takes one tap.
No signal in the gym is fine — it syncs when you're back online.

The bigger goal: most trackers stop at logging. Rackd is being built to also tell you
**what to train next**, based on your recovery and what you've eaten — not just your last
session. That part isn't built yet (see [Roadmap](#roadmap)).

## Status

**Working today:**
- Email/password and Google sign-in
- Offline-first logging (RxDB + IndexedDB) — works with no connection
- Sync across devices via Cloudflare D1 (last-write-wins)
- Today / Log / History views, kg↔lb toggle, JSON data export
- Installable PWA

**Not built yet:** plans/templates, auto-generated sessions, progression, goals, recovery
tracking, recommendations. See [Roadmap](#roadmap).

Not deployed anywhere yet — runs locally for now.

## Tech stack

| | |
|---|---|
| Frontend | React 19 + TypeScript, Vite, Tailwind CSS, React Router |
| Local data | RxDB on Dexie (IndexedDB) — local-first, offline by default |
| Backend | Cloudflare Pages Functions (Workers) |
| Database | Cloudflare D1 (SQLite) |
| Auth | Google OAuth + email/password, stateless JWT |
| PWA | vite-plugin-pwa |
| Exercise catalog | seeded from [free-exercise-db](https://github.com/yuhonas/free-exercise-db), versioned static JSON |

## Architecture

```
Browser (PWA, React + Vite)
  ├─ RxDB + Dexie (IndexedDB)   — local-first store, works offline
  ├─ static exercise catalog   — seeded once, versioned JSON
  └─ JWT held client-side
        │  (online only)
        ▼
Cloudflare Pages Functions
  ├─ /auth/*  — Google OAuth + email/password → mint JWT
  └─ /sync    — push/pull, upsert + tombstone into D1, last-write-wins
        ▼
D1 (SQLite) — per-user rows: sessions, sets   ↕ pull restores the same data on a new device
```

Sync model: client-generated UUID `id`, `createdAt`/`updatedAt`, `deletedAt` tombstone,
last-write-wins by `updatedAt`. No CRDTs.

## Run it locally

**Logging only, no sync, no auth:**

```bash
npm install
npm run seed     # pulls the exercise catalog into public/catalog/
npm run dev      # → http://localhost:5173
```

**Full stack (auth + sync against local D1):**

```bash
cp .dev.vars.example .dev.vars        # set JWT_SECRET; Google keys optional, see below
npx wrangler d1 migrations apply workout-db --local   # creates local D1 tables
npx wrangler pages dev -- npm run dev   # → http://localhost:8788
```

Set `AUTH_STUB=1` in `.dev.vars` to sign in without a real Google OAuth client — it adds
`/auth/dev-login`, which mints a real JWT for a fake identity. Email/password sign-in always
works against local D1 and doesn't need this flag; it only matters for the Google button.
Never set it in production.

**Tests:**
```bash
npm run smoke   # RxDB schema sanity check
npm run test    # sync replication test
```

## Using the app

1. Sign in (email/password or Google).
2. **Log** — search the exercise catalog, pick a lift, enter weight + reps per set.
   Last session's numbers for that exercise are pre-filled.
3. **Today** — today's sets, grouped by exercise, with set count / lift count / total volume.
4. **History** — past sessions.
5. Toggle kg/lb anytime from the header. Export all your data as JSON from the same header.

Data lives on your device first. If you're signed in and online, it syncs to your other
devices automatically.

## Roadmap

In rough order, each one shippable on its own:

| | |
|---|---|
| Plans & templates | Build a workout plan once, reuse it. Exercises rotate automatically within a muscle group. |
| Auto-generated sessions | Given your time and available equipment, the app builds today's session for you. |
| Progression | Weights increase week over week automatically, with manual override. |
| Goals & body tracking | Track weight, measurements, progress photos. See training volume per muscle group over time. |
| Recovery & consistency | Recovery-readiness score, streaks, nudges when you're falling off pace. |
| Exercise intelligence | Visual muscle map per exercise; smart classification for custom exercises you add. |
| Optional AI layer | Bring your own AI key to improve plans/recommendations. Never required — the app works fully without it. |

Nutrition tracking, wearable integrations, and AI form-checking are under consideration but
not scheduled.
