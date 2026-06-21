-- M2 sync: per-user data store. Columns mirror the RxDB schema (src/db/schema.ts).
-- Catalog (exercises) is NOT here — it ships as static JSON. Deletes are a deletedAt
-- field (soft delete), so there is no _deleted column; the app filters deletedAt IS NULL.

CREATE TABLE IF NOT EXISTS sessions (
  id        TEXT PRIMARY KEY,
  userId    TEXT NOT NULL,
  date      TEXT NOT NULL,
  title     TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT
);
-- pull walks (updatedAt, id) per user — the checkpoint tuple
CREATE INDEX IF NOT EXISTS idx_sessions_pull ON sessions (userId, updatedAt, id);

CREATE TABLE IF NOT EXISTS setlogs (
  id           TEXT PRIMARY KEY,
  userId       TEXT NOT NULL,
  sessionId    TEXT NOT NULL,
  exerciseId   TEXT NOT NULL,
  exerciseName TEXT,
  weightKg     REAL,
  reps         INTEGER,
  "order"      INTEGER,
  createdAt    TEXT NOT NULL,
  updatedAt    TEXT NOT NULL,
  deletedAt    TEXT
);
CREATE INDEX IF NOT EXISTS idx_setlogs_pull ON setlogs (userId, updatedAt, id);
