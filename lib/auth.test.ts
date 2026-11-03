import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { signSession, verifySession, verifyAccessCode, COOKIE_MAX_AGE } from './auth'

beforeEach(() => {
  process.env.SESSION_SECRET = 'test-secret-test-secret-test-secret'
  process.env.ACCESS_CODE = 'open-sesame'
})

test('verifySession accepts a token it signed', async () => {
  const iat = Date.now()
  const token = await signSession({ iat })
  assert.deepEqual(await verifySession(token), { iat })
})

test('verifySession rejects a token with a changed payload', async () => {
  const token = await signSession({ iat: Date.now() })
  const [, sig] = token.split('.')
  const forged = Buffer.from(JSON.stringify({ iat: Date.now() + 1 })).toString('base64url')
  assert.equal(await verifySession(`${forged}.${sig}`), null)
})

test('verifySession rejects a token signed with another secret', async () => {
  const token = await signSession({ iat: Date.now() })
  process.env.SESSION_SECRET = 'a-different-secret-a-different-secret'
  assert.equal(await verifySession(token), null)
})

test('verifySession rejects a token older than the cookie max age', async () => {
  const token = await signSession({ iat: Date.now() - COOKIE_MAX_AGE * 1000 - 1 })
  assert.equal(await verifySession(token), null)
})

test('verifySession rejects malformed tokens', async () => {
  for (const token of ['', 'abc', 'a.b.c', '.sig', 'payload.', '!!!.???']) {
    assert.equal(await verifySession(token), null, JSON.stringify(token))
  }
})

test('verifyAccessCode', () => {
  const cases: [string, boolean][] = [
    ['open-sesame', true],
    ['open-sesamE', false],
    ['open-sesame!', false],
    ['open', false],
    ['', false],
  ]
  for (const [candidate, expected] of cases) {
    assert.equal(verifyAccessCode(candidate), expected, JSON.stringify(candidate))
  }
})

test('verifyAccessCode rejects everything when ACCESS_CODE is not set', () => {
  delete process.env.ACCESS_CODE
  assert.equal(verifyAccessCode(''), false)
  assert.equal(verifyAccessCode('anything'), false)
})
