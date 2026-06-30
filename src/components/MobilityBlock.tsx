import { useEffect, useRef, useState } from 'react'
import type { MobilityStep } from '../db/schema'

/** Warm-up / cooldown stretches with a per-step seconds countdown.
 *  ponytail: completion is ephemeral UI, not logged to setlogs — m4-deferred #9. */
export function MobilityBlock({
  title,
  steps,
  nameOf,
}: {
  title: string
  steps: MobilityStep[]
  nameOf: Map<string, string>
}) {
  if (steps.length === 0) return null
  return (
    <div className="mt-5">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-fog">{title}</h2>
      <ul className="space-y-1.5">
        {steps.map((s, i) => (
          <StretchRow key={`${s.exerciseId}-${i}`} name={nameOf.get(s.exerciseId) ?? s.exerciseId} sec={s.sec} />
        ))}
      </ul>
    </div>
  )
}

function StretchRow({ name, sec }: { name: string; sec: number }) {
  const [left, setLeft] = useState<number | null>(null) // null = idle, 0 = done
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  useEffect(() => () => clearInterval(timer.current), [])

  const start = () => {
    if (left !== null) return
    setLeft(sec)
    timer.current = setInterval(() => {
      setLeft((l) => {
        if (l === null || l <= 1) {
          clearInterval(timer.current)
          return 0
        }
        return l - 1
      })
    }, 1000)
  }
  const done = left === 0

  return (
    <li
      className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 transition-colors ${
        done ? 'border-green-500/60 bg-green-500/10' : 'border-steel-800 bg-steel-900'
      }`}
    >
      <span className="min-w-0 flex-1 truncate text-sm font-semibold capitalize">{name}</span>
      <button
        type="button"
        onClick={start}
        className={`nums shrink-0 rounded-lg px-3 py-1.5 text-sm font-black tabular-nums transition-colors ${
          done ? 'bg-green-500 text-ink' : left !== null ? 'bg-amber text-ink' : 'bg-steel-800 text-fog hover:text-chalk'
        }`}
      >
        {left === null ? `${sec}s` : done ? '✓' : `${left}s`}
      </button>
    </li>
  )
}
