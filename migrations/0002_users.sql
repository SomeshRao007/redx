-- Email/password accounts. Auth-only — NOT RxDB-synced, so no sync metadata here.
-- id (uuid) is the JWT `sub`, so M2 sync keys off it exactly like a Google user.
-- passwordHash is a self-describing PHC string ($pbkdf2-sha256$i=<n>$<salt>$<hash>),
-- so the iteration count can be raised later without a migration.
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  email        TEXT NOT NULL UNIQUE COLLATE NOCASE,
  passwordHash TEXT NOT NULL,
  createdAt    TEXT NOT NULL
);
