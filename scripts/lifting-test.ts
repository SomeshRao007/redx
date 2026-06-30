/**
 * Warm-up + plate-calculator proof. Pure functions, no DB.
 * Run: tsx scripts/lifting-test.ts  (also part of `npm test`)
 */
import assert from 'node:assert/strict'
import { warmupSets, platesFor } from '../src/lib/lifting.ts'

// warm-up steps DOWN from last weight, rounded to 2.5kg, all lighter than working
assert.deepEqual(
  warmupSets(7.5).map((w) => w.kg),
  [2.5, 5],
  'maxed 7.5kg → warm up 2.5/5kg (all < 7.5)',
)
assert.ok(warmupSets(7.5).every((w) => w.kg < 7.5), 'every warm-up is lighter than working')
assert.deepEqual(warmupSets(0), [], 'no last weight → no warm-up sets')

// plate calculator, per side, 20kg bar
assert.deepEqual(platesFor(60), [20], '60kg = 20 bar + 20 per side')
assert.deepEqual(platesFor(100), [20, 20], '100kg = 20 bar + 40 per side (20+20)')
assert.deepEqual(platesFor(132.5), [20, 20, 15, 1.25], '132.5kg = 20 bar + 56.25 per side')
assert.deepEqual(platesFor(20), [], 'empty bar → no plates')
assert.deepEqual(platesFor(15), [], 'below bar weight → no plates')

console.log('lifting-test: OK — warm-ups step down & lighter, plates per-side greedy')
