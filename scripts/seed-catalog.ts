import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'

const SRC = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'
const IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'
const OUT = new URL('../public/catalog/exercises.v1.json', import.meta.url)

const s = (v: unknown) => (typeof v === 'string' ? v : '')
const arr = (v: unknown) => (Array.isArray(v) ? v.map(String) : [])

const raw = (await (await fetch(SRC)).json()) as Record<string, unknown>[]

let skipped = 0
const catalog = raw.flatMap((r) => {
  const name = s(r.name)
  const primaryMuscles = arr(r.primaryMuscles)
  if (!name || primaryMuscles.length === 0) {
    skipped++
    return []
  }
  return [{
    id: s(r.id),
    name,
    primaryMuscles,
    secondaryMuscles: arr(r.secondaryMuscles),
    equipment: s(r.equipment),
    mechanic: s(r.mechanic),
    level: s(r.level),
    category: s(r.category),
    force: s(r.force),
    instructions: arr(r.instructions),
    images: arr(r.images).map((p) => IMG_BASE + p),
    source: 'free-exercise-db',
    license: 'Unlicense',
  }]
})

await mkdir(new URL('.', OUT), { recursive: true })
await writeFile(OUT, JSON.stringify(catalog, null, 2))

assert(catalog.length > 700, `expected > 700 records, got ${catalog.length}`)
for (const e of catalog) {
  assert(e.name, `empty name: ${e.id}`)
  assert(e.primaryMuscles.length > 0, `empty primaryMuscles: ${e.id}`)
  for (const url of e.images) assert(url.startsWith('https://'), `bad image url: ${url}`)
}

console.log(`skipped ${skipped} records`)
console.log(`✓ catalog: ${catalog.length} exercises`)
