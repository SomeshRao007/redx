import { useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useRxData } from '../db/useRxData'
import type { Session, SetLog } from '../db/schema'
import { useUnit, formatWeight } from '../lib/units'
import { groupByExercise } from '../components/groupSets'

const today = () => new Date().toISOString().slice(0, 10)

export function History() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const date = today()

  const sessions = useRxData<Session>(
    (db) =>
      db.sessions.find({
        selector: { userId, deletedAt: null },
        sort: [{ date: 'desc' }],
      }),
    [userId],
  )

  const past = useMemo(
    () => sessions.filter((s) => s.date !== date),
    [sessions, date],
  )

  return (
    <section>
      <h1 className="font-display text-3xl font-black tracking-tight">History</h1>
      <p className="mt-1 text-sm text-fog">Every session you've put in.</p>

      {past.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-steel-700 px-6 py-12 text-center text-fog">
          <p className="font-display text-lg font-bold text-chalk">
            No past sessions
          </p>
          <p className="mt-1 text-sm">
            Once you finish today's workout, it shows up here tomorrow.
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-2">
          {past.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </ul>
      )}
    </section>
  )
}

function SessionCard({ session }: { session: Session }) {
  const [open, setOpen] = useState(false)
  const unit = useUnit()

  // Load sets only when expanded — avoids a live query per collapsed card.
  const sets = useRxData<SetLog>(
    (db) =>
      open
        ? db.setlogs.find({
            selector: { sessionId: session.id, deletedAt: null },
            sort: [{ createdAt: 'asc' }],
          })
        : null,
    [open, session.id],
  )

  const groups = useMemo(() => groupByExercise(sets), [sets])
  const dateLabel = new Date(session.date + 'T00:00:00').toLocaleDateString(
    undefined,
    { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' },
  )

  return (
    <li className="overflow-hidden rounded-xl bg-steel-900">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-steel-800 focus-visible:outline-2 focus-visible:outline-amber"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-steel-800 font-display text-lg font-black text-amber">
          {new Date(session.date + 'T00:00:00').getDate()}
        </span>
        <span className="flex-1">
          <span className="block font-semibold">
            {session.title || dateLabel}
          </span>
          {session.title && (
            <span className="block text-xs text-fog">{dateLabel}</span>
          )}
        </span>
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          className={`text-fog transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-steel-800 px-4 py-3">
          {groups.length === 0 ? (
            <p className="py-2 text-center text-sm text-fog">No sets recorded.</p>
          ) : (
            <div className="space-y-3">
              {groups.map((g) => (
                <div key={g.exerciseId}>
                  <h3 className="text-sm font-bold">{g.exerciseName}</h3>
                  <p className="nums mt-0.5 text-sm text-fog">
                    {g.sets
                      .map((s) => `${formatWeight(s.weightKg, unit)} × ${s.reps}`)
                      .join('   ·   ')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  )
}
