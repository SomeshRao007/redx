import { createRxDatabase, addRxPlugin, type RxStorage } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import {
  exerciseSchema,
  sessionSchema,
  setLogSchema,
  type WorkoutDatabase,
} from './schema'

async function makeStorage(): Promise<RxStorage<unknown, unknown>> {
  const storage = getRxStorageDexie()
  if (!import.meta.env.DEV) return storage
  // dev-mode adds usage/schema checks; it *requires* a validator-wrapped storage
  // (RxDB error DVM1). Both are dev-only — stripped from the prod bundle.
  const { RxDBDevModePlugin } = await import('rxdb/plugins/dev-mode')
  const { wrappedValidateAjvStorage } = await import('rxdb/plugins/validate-ajv')
  addRxPlugin(RxDBDevModePlugin)
  return wrappedValidateAjvStorage({ storage })
}

let dbPromise: Promise<WorkoutDatabase> | null = null

export function getDb(): Promise<WorkoutDatabase> {
  // ponytail: single shared instance; RxDB throws on duplicate db names otherwise.
  if (!dbPromise) dbPromise = create()
  return dbPromise
}

async function create(): Promise<WorkoutDatabase> {
  const db = await createRxDatabase<WorkoutDatabase>({
    name: 'workoutdb',
    storage: await makeStorage(),
    multiInstance: true, // sync across browser tabs
    eventReduce: true,
  })
  await db.addCollections({
    exercises: { schema: exerciseSchema },
    sessions: { schema: sessionSchema },
    setlogs: { schema: setLogSchema },
  })
  return db
}

/** Seed the catalog once. Idempotent: skips if already loaded at the current version. */
export async function seedCatalog(): Promise<void> {
  const db = await getDb()
  const count = await db.exercises.count().exec()
  if (count > 0) return
  const res = await fetch('/catalog/exercises.v1.json')
  if (!res.ok) return
  const exercises = await res.json()
  await db.exercises.bulkInsert(exercises)
}
