-- M4: injury/recovery exclusions (per-user, RxDB-synced). A temporary or permanent "avoid this"
-- muscle group / exercise. Columns mirror src/db/schema.ts and functions/sync/[[route]].ts TABLES.

CREATE TABLE IF NOT EXISTS exclusions (
  id        TEXT PRIMARY KEY,
  userId    TEXT NOT NULL,
  kind      TEXT NOT NULL,   -- 'muscle' | 'exercise'
  value     TEXT NOT NULL,   -- primaryMuscles tag, or exerciseId
  label     TEXT,            -- display name
  until     TEXT,            -- 'YYYY-MM-DD' or NULL = forever
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT
);
-- pull walks (updatedAt, id) per user — the checkpoint tuple
CREATE INDEX IF NOT EXISTS idx_exclusions_pull ON exclusions (userId, updatedAt, id);
