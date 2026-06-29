import assert from 'node:assert/strict'
import { hashPassword, verifyPassword } from '../functions/lib/password.ts'

// The security path: PBKDF2 hash/verify must round-trip, reject wrong inputs, and
// salt randomly so two hashes of the same password differ.
const phc = await hashPassword('correct horse battery staple')
assert.match(phc, /^\$pbkdf2-sha256\$i=\d+\$[^$]+\$[^$]+$/, 'self-describing PHC format')
assert.equal(await verifyPassword('correct horse battery staple', phc), true, 'correct verifies')
assert.equal(await verifyPassword('wrong password', phc), false, 'wrong rejected')
assert.notEqual(phc, await hashPassword('correct horse battery staple'), 'random salt per hash')
assert.equal(await verifyPassword('x', 'not-a-phc-string'), false, 'malformed hash rejected')

console.log('password-test: hash/verify ok')
