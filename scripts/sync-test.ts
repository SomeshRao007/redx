import assert from 'node:assert/strict'
import { lwwWins } from '../functions/sync/[[route]].ts'

// LWW is the money path: incoming wins only if STRICTLY newer; a tie keeps master
// (prevents same-millisecond rows from ping-ponging between two devices).
assert.equal(lwwWins('2026-06-21T10:00:01Z', '2026-06-21T10:00:00Z'), true, 'newer wins')
assert.equal(lwwWins('2026-06-21T10:00:00Z', '2026-06-21T10:00:00Z'), false, 'tie keeps master')
assert.equal(lwwWins('2026-06-21T09:00:00Z', '2026-06-21T10:00:00Z'), false, 'older loses')

console.log('sync-test: lwwWins ok')
