import type { SetLog } from '../db/schema'

export type ExerciseGroup = {
  exerciseId: string
  exerciseName: string | undefined
  sets: SetLog[]
}

/** Group logged sets by exercise, preserving first-seen order. */
export function groupByExercise(sets: SetLog[]): ExerciseGroup[] {
  const groups = new Map<string, ExerciseGroup>()
  for (const s of sets) {
    const g = groups.get(s.exerciseId)
    if (g) g.sets.push(s)
    else
      groups.set(s.exerciseId, {
        exerciseId: s.exerciseId,
        exerciseName: s.exerciseName,
        sets: [s],
      })
  }
  return [...groups.values()]
}

/** Total kg moved across a list of sets (weight × reps). */
export const totalVolumeKg = (sets: SetLog[]): number =>
  sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0)
