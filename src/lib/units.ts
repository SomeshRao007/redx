import { useSyncExternalStore } from 'react'

export type Unit = 'kg' | 'lb'
const KG_PER_LB = 0.45359237
const KEY = 'wa_unit'

export const kgToUnit = (kg: number, unit: Unit): number =>
  unit === 'kg' ? kg : kg / KG_PER_LB
export const unitToKg = (value: number, unit: Unit): number =>
  unit === 'kg' ? value : value * KG_PER_LB

/** Round for display (0.5 kg / 1 lb granularity is plenty for a barbell). */
export const formatWeight = (kg: number, unit: Unit): string =>
  `${Math.round(kgToUnit(kg, unit) * 2) / 2} ${unit}`

// Tiny global unit preference backed by localStorage, reactive across components.
const listeners = new Set<() => void>()
const getUnit = (): Unit => (localStorage.getItem(KEY) as Unit) || 'kg'
export function setUnit(u: Unit) {
  localStorage.setItem(KEY, u)
  listeners.forEach((l) => l())
}
export function useUnit(): Unit {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    getUnit,
  )
}
