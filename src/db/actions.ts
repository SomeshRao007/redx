import { getDb } from './database'
import type { Session, SetLog } from './schema'

const now = () => new Date().toISOString()
const today = () => new Date().toISOString().slice(0, 10) // YYYY-MM-DD

/**
 * Get (or create) today's session for this user.
 * The id is a deterministic natural key `userId_date` so this is idempotent and
 * race-proof: concurrent callers (e.g. React StrictMode's double-invoked effect)
 * resolve to the SAME session instead of creating duplicates.
 */
export async function getOrCreateTodaySession(userId: string): Promise<Session> {
  const db = await getDb()
  const id = `${userId}_${today()}`
  const existing = await db.sessions.findOne(id).exec()
  if (existing) return existing.toJSON() as Session
  const ts = now()
  // upsert keyed on the deterministic id — a concurrent create collapses to one row.
  const doc = await db.sessions.upsert({
    id,
    userId,
    date: today(),
    title: '',
    createdAt: ts,
    updatedAt: ts,
    deletedAt: null,
  })
  return doc.toJSON() as Session
}

/**
 * Append a logged set (append-only — never mutates existing sets).
 * `order` is the next position within the session.
 */
export async function logSet(input: {
  userId: string
  sessionId: string
  exerciseId: string
  exerciseName: string
  weightKg: number
  reps: number
}): Promise<SetLog> {
  const db = await getDb()
  // count by sessionId only — hits the index (RxDB count needs a full index
  // match, error QU14 otherwise). `order` is a monotonic position; gaps left by
  // soft-deleted sets are harmless, so we don't filter deletedAt here.
  const count = await db.setlogs
    .count({ selector: { sessionId: input.sessionId } })
    .exec()
  const ts = now()
  const set: SetLog = {
    id: crypto.randomUUID(),
    ...input,
    order: count,
    createdAt: ts,
    updatedAt: ts,
    deletedAt: null,
  }
  await db.setlogs.insert(set)
  return set
}

/** Most recent logged set for an exercise — powers auto-fill (C6). */
export async function lastSetFor(
  userId: string,
  exerciseId: string,
): Promise<SetLog | null> {
  const db = await getDb()
  const doc = await db.setlogs
    .findOne({
      selector: { userId, exerciseId, deletedAt: null },
      sort: [{ createdAt: 'desc' }],
    })
    .exec()
  return doc ? (doc.toJSON() as SetLog) : null
}

/** Soft-delete a set (tombstone, so the delete syncs in M2). */
export async function deleteSet(id: string): Promise<void> {
  const db = await getDb()
  const doc = await db.setlogs.findOne(id).exec()
  if (doc) await doc.patch({ deletedAt: now(), updatedAt: now() })
}
