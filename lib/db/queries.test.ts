import { describe, test, before, after, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { CAR_ID, JON_ID, TIMMY_ID } from '../users'

const skip = !process.env.DATABASE_URL && 'DATABASE_URL not set; run npm run test:db'

const WINDOW_START = '2099-01-01T00:00:00Z'
const WINDOW_END = '2099-12-31T00:00:00Z'

function at(hour: number): string {
  return new Date(Date.UTC(2099, 0, 1, hour)).toISOString()
}

describe('reservation conflicts', { skip }, () => {
  let q: typeof import('./queries')
  let pool: ReturnType<typeof import('./client').getPool>

  async function clearWindow() {
    await pool.query(
      'DELETE FROM reservations WHERE car_id = $1 AND start_time >= $2 AND start_time < $3',
      [CAR_ID, WINDOW_START, WINDOW_END],
    )
  }

  function create(start: number, end: number, opts: { userId?: string; force?: boolean } = {}) {
    return q.createReservationChecked({
      carId: CAR_ID,
      userId: opts.userId ?? JON_ID,
      startTime: at(start),
      endTime: at(end),
      skipConflictCheck: opts.force ?? false,
    })
  }

  async function mustCreate(start: number, end: number) {
    const result = await create(start, end)
    assert.equal(result.ok, true)
    return (result as { ok: true; reservation: { id: string } }).reservation
  }

  before(async () => {
    q = await import('./queries')
    pool = (await import('./client')).getPool()
    await clearWindow()
  })
  afterEach(clearWindow)
  after(() => pool.end())

  test('rejects an overlapping reservation and returns the conflict', async () => {
    const existing = await mustCreate(10, 12)
    for (const [start, end] of [[11, 13], [9, 11], [10, 12], [9, 13], [10.5, 11.5]]) {
      const result = await create(start, end, { userId: TIMMY_ID })
      assert.equal(result.ok, false, `${start}-${end}`)
      assert.deepEqual(
        (result as { conflicts: { id: string }[] }).conflicts.map((c) => c.id),
        [existing.id],
      )
    }
  })

  test('allows back-to-back reservations', async () => {
    await mustCreate(10, 12)
    assert.equal((await create(12, 14)).ok, true)
    assert.equal((await create(8, 10)).ok, true)
  })

  for (const status of ['cancelled', 'completed']) {
    test(`ignores a ${status} reservation`, async () => {
      const existing = await mustCreate(10, 12)
      await pool.query('UPDATE reservations SET status = $1 WHERE id = $2', [status, existing.id])
      assert.equal((await create(10, 12)).ok, true)
    })
  }

  test('force creates an overlapping reservation', async () => {
    await mustCreate(10, 12)
    assert.equal((await create(10, 12, { force: true })).ok, true)
  })

  test('update ignores the reservation being updated', async () => {
    const existing = await mustCreate(10, 12)
    const result = await q.updateReservationChecked(existing.id, {
      carId: CAR_ID,
      userId: JON_ID,
      startTime: at(11),
      endTime: at(13),
      title: null,
      purpose: null,
      skipConflictCheck: false,
    })
    assert.equal(result.ok, true)
  })

  test('update rejects an overlap with another reservation', async () => {
    const other = await mustCreate(14, 16)
    const existing = await mustCreate(10, 12)
    const result = await q.updateReservationChecked(existing.id, {
      carId: CAR_ID,
      userId: JON_ID,
      startTime: at(11),
      endTime: at(15),
      title: null,
      purpose: null,
      skipConflictCheck: false,
    })
    assert.equal(result.ok, false)
    assert.deepEqual(
      (result as { conflicts: { id: string }[] }).conflicts.map((c) => c.id),
      [other.id],
    )
  })

  test('a create that overlaps an open transaction for the same slot aborts one of them', async () => {
    const other = await pool.connect()
    try {
      await other.query('BEGIN ISOLATION LEVEL SERIALIZABLE')
      await other.query(
        `SELECT id FROM reservations WHERE car_id = $1 AND status IN ('pending', 'active')
           AND start_time < $3::timestamptz AND end_time > $2::timestamptz`,
        [CAR_ID, at(10), at(12)],
      )

      assert.equal((await create(10, 12)).ok, true)

      await assert.rejects(
        (async () => {
          await other.query(
            'INSERT INTO reservations (car_id, user_id, start_time, end_time) VALUES ($1, $2, $3, $4)',
            [CAR_ID, TIMMY_ID, at(10), at(12)],
          )
          await other.query('COMMIT')
        })(),
        { code: '40001' },
      )
    } finally {
      await other.query('ROLLBACK').catch(() => {})
      other.release()
    }
  })
})
