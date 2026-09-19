import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatRelativeDay } from './relativeDay'

const TODAY = new Date('2026-09-19T09:00:00')

function daysFromToday(n: number): Date {
  const d = new Date(TODAY)
  d.setDate(d.getDate() + n)
  return d
}

test('formatRelativeDay', () => {
  const cases: [number, string][] = [
    [0, 'Today'],
    [1, 'Tomorrow'],
    [2, 'In 2 days'],
    [6, 'In 6 days'],
    [7, 'In 1 week'],
    [13, 'In 1 week'],
    [14, 'In 2 weeks'],
    [20, 'In 2 weeks'],
    [21, 'In 3 weeks'],
    [27, 'In 3 weeks'],
    [28, 'In 1 month'],
    [60, 'In 2 months'],
    [90, 'In 3 months'],
    [180, 'In 6 months'],
  ]

  for (const [n, expected] of cases) {
    assert.equal(formatRelativeDay(daysFromToday(n), TODAY), expected, `+${n} days`)
  }
})

test('formatRelativeDay falls back to an absolute date beyond the month threshold', () => {
  const result = formatRelativeDay(daysFromToday(240), TODAY)
  assert.match(result, /^[A-Za-z]{3} \d{1,2}$/)
})

test('formatRelativeDay falls back to an absolute date for past dates', () => {
  const result = formatRelativeDay(daysFromToday(-3), TODAY)
  assert.match(result, /^[A-Za-z]{3} \d{1,2}$/)
})
