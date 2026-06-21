/**
 * Smoke test for the shared DB contract (src/db/schema.ts).
 * Validates that collections build and the auto-fill query (composite index +
 * sort) returns the most recent set. Run: `npx tsx scripts/schema-smoke.ts`
 */
import assert from 'node:assert'
import { createRxDatabase, addRxPlugin } from 'rxdb'
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory'
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv'
import {
  exerciseSchema,
  sessionSchema,
  setLogSchema,
  type WorkoutDatabase,
} from '../src/db/schema'

addRxPlugin(RxDBDevModePlugin)

const db = await createRxDatabase<WorkoutDatabase>({
  name: 'smoke',
  storage: wrappedValidateAjvStorage({ storage: getRxStorageMemory() }),
})
await db.addCollections({
  exercises: { schema: exerciseSchema },
  sessions: { schema: sessionSchema },
  setlogs: { schema: setLogSchema },
})

const base = {
  userId: 'u1',
  sessionId: 's1',
  exerciseId: 'bench',
  exerciseName: 'Bench Press',
  reps: 5,
  deletedAt: null,
}
await db.setlogs.insert({ ...base, id: '1', order: 0, weightKg: 60, createdAt: '2026-06-20T10:00:00.000Z', updatedAt: '2026-06-20T10:00:00.000Z' })
await db.setlogs.insert({ ...base, id: '2', order: 1, weightKg: 65, createdAt: '2026-06-21T10:00:00.000Z', updatedAt: '2026-06-21T10:00:00.000Z' })

// lastSetFor logic: latest by createdAt for userId+exerciseId
const latest = await db.setlogs
  .findOne({ selector: { userId: 'u1', exerciseId: 'bench', deletedAt: null }, sort: [{ createdAt: 'desc' }] })
  .exec()

assert(latest, 'expected a latest set')
assert.equal(latest.weightKg, 65, 'auto-fill should return the most recent weight')
assert.equal(await db.setlogs.count().exec(), 2, 'both sets inserted')

// logSet computes `order` via a count by sessionId — must hit the index, not
// trigger RxDB's slow-count error QU14 (regression guard).
const orderCount = await db.setlogs.count({ selector: { sessionId: 's1' } }).exec()
assert.equal(orderCount, 2, 'count-by-sessionId (order calc) works without QU14')

// getOrCreateTodaySession idempotency: same deterministic id upserted twice
// (the StrictMode double-invoke case) must yield exactly ONE session row.
const sid = 'u1_2026-06-21'
const sess = { id: sid, userId: 'u1', date: '2026-06-21', title: '', createdAt: '2026-06-21T00:00:00.000Z', updatedAt: '2026-06-21T00:00:00.000Z', deletedAt: null }
await Promise.all([db.sessions.upsert(sess), db.sessions.upsert(sess)])
assert.equal(await db.sessions.count().exec(), 1, 'duplicate today-session collapses to one')

console.log('✓ schema smoke passed (index sort, order-count, idempotent session)')
await db.close()
