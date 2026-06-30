import { getDb } from './database'
import type { Exclusion } from './schema'

const now = () => new Date().toISOString()
const todayYMD = () => new Date().toISOString().slice(0, 10)

// today + days as YYYY-MM-DD (null days = forever).
function until(days: number | null): string | null {
  if (days == null) return null
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Avoid a muscle group / exercise for `days` (null = forever). */
export async function addExclusion(
  userId: string,
  kind: 'muscle' | 'exercise',
  value: string,
  label: string,
  days: number | null,
): Promise<Exclusion> {
  const db = await getDb()
  const ts = now()
  const rec: Exclusion = {
    id: crypto.randomUUID(),
    userId,
    kind,
    value,
    label,
    until: until(days),
    createdAt: ts,
    updatedAt: ts,
    deletedAt: null,
  }
  await db.exclusions.insert(rec)
  return rec
}

/** End an exclusion early (soft-delete, so it syncs). */
export async function removeExclusion(id: string): Promise<void> {
  const db = await getDb()
  const doc = await db.exclusions.findOne(id).exec()
  if (doc) await doc.patch({ deletedAt: now(), updatedAt: now() })
}

/** Live exclusions: not soft-deleted AND (forever OR not yet expired). */
export async function activeExclusions(userId: string): Promise<Exclusion[]> {
  const db = await getDb()
  const docs = await db.exclusions.find({ selector: { userId, deletedAt: null } }).exec()
  const t = todayYMD()
  return docs
    .map((d) => d.toJSON() as Exclusion)
    .filter((e) => e.until == null || e.until >= t)
}
