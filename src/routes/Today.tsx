import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useRxData } from '../db/useRxData'
import type { SetLog } from '../db/schema'
import { useUnit, formatWeight } from '../lib/units'
import { groupByExercise, totalVolumeKg } from '../components/groupSets'
import { SetRow } from '../components/SetRow'

const today = () => new Date().toISOString().slice(0, 10)

export function Today() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const unit = useUnit()
  const date = today()

  const todaySessions = useRxData(
    (db) => db.sessions.find({ selector: { userId, date, deletedAt: null } }),
    [userId, date],
  )
  const sessionId = todaySessions[0]?.id ?? null

  const sets = useRxData<SetLog>(
    (db) =>
      sessionId
        ? db.setlogs.find({
            selector: { sessionId, deletedAt: null },
            sort: [{ createdAt: 'asc' }],
          })
        : null,
    [sessionId],
  )

  const groups = useMemo(() => groupByExercise(sets), [sets])
  const volumeKg = useMemo(() => totalVolumeKg(sets), [sets])

  return (
    <section>
      <h1 className="font-display text-3xl font-black tracking-tight">Today</h1>
      <p className="mt-1 text-sm text-fog">
        {new Date().toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        })}
      </p>

      {sets.length === 0 ? (
        <EmptyToday />
      ) : (
        <>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Stat value={sets.length} label="sets" />
            <Stat value={groups.length} label="lifts" />
            <Stat value={formatWeight(volumeKg, unit)} label="volume" wide />
          </div>

          <div className="mt-6 space-y-5">
            {groups.map((g) => (
              <div key={g.exerciseId}>
                <h2 className="mb-2 font-display text-lg font-bold">
                  {g.exerciseName}
                </h2>
                <ul className="space-y-1.5">
                  {g.sets.map((s, i) => (
                    <SetRow key={s.id} set={s} index={i} unit={unit} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function Stat({
  value,
  label,
  wide,
}: {
  value: string | number
  label: string
  wide?: boolean
}) {
  return (
    <div className="rounded-xl bg-steel-900 px-3 py-4 text-center">
      <div className={`nums font-display font-black text-amber ${wide ? 'text-xl' : 'text-3xl'}`}>
        {value}
      </div>
      <div className="mt-0.5 text-xs uppercase tracking-wide text-fog">
        {label}
      </div>
    </div>
  )
}

function EmptyToday() {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-steel-700 px-6 py-12 text-center">
      <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-steel-800 text-3xl">
        🏋️
      </div>
      <h2 className="font-display text-xl font-bold">No sets logged yet</h2>
      <p className="mx-auto mt-1 max-w-xs text-sm text-fog">
        Every session starts with one set. Head to the Log tab and put the first
        one on the board.
      </p>
      <Link
        to="/app/log"
        className="mt-5 inline-block rounded-xl bg-amber px-6 py-3 font-display font-black uppercase tracking-wide text-ink transition-colors hover:bg-amber-bright"
      >
        Start logging
      </Link>
    </div>
  )
}
