import { useEffect, useState } from 'react'
import type { RxQuery } from 'rxdb'
import { getDb } from './database'
import type { WorkoutDatabase } from './schema'

/** Resolve the (async) RxDB instance once for a component. */
export function useDb(): WorkoutDatabase | null {
  const [db, setDb] = useState<WorkoutDatabase | null>(null)
  useEffect(() => {
    let alive = true
    getDb().then((d) => alive && setDb(d))
    return () => {
      alive = false
    }
  }, [])
  return db
}

/**
 * Subscribe a component to a reactive RxDB query.
 * `build` receives the db and returns an RxQuery (or null while deps aren't ready).
 * Re-runs when any value in `deps` changes.
 */
export function useRxData<T>(
  build: (db: WorkoutDatabase) => RxQuery<T, T[]> | null,
  deps: unknown[] = [],
): T[] {
  const db = useDb()
  const [data, setData] = useState<T[]>([])
  useEffect(() => {
    if (!db) return
    const query = build(db)
    if (!query) return
    const sub = query.$.subscribe((rows) => setData(rows))
    return () => sub.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, ...deps])
  return data
}
