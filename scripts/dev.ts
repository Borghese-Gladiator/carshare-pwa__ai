import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

process.chdir(path.join(__dirname, '..'))

const ENV_FILE = '.env.local'
const COMPOSE = 'docker compose -f docker-compose.db.yml'
const LOCAL_DB_URL = 'postgres://carshare:carshare@localhost:5433/carshare'
const PLACEHOLDERS = new Set([
  '',
  'change-me-to-your-shared-access-code',
  'change-me-to-a-random-32-char-or-longer-string',
])

function readLines(): string[] {
  if (!fs.existsSync(ENV_FILE)) return []
  return fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/).filter(Boolean)
}

function readKey(key: string): string {
  const line = readLines().find((l) => l.startsWith(`${key}=`))
  return line ? line.slice(key.length + 1) : ''
}

function setKeys(updates: Record<string, string>): void {
  const kept = readLines().filter((l) => !Object.hasOwn(updates, l.split('=')[0]))
  const added = Object.entries(updates).map(([k, v]) => `${k}=${v}`)
  fs.writeFileSync(ENV_FILE, [...kept, ...added].join('\n') + '\n')
}

function fillSecrets(): void {
  const updates: Record<string, string> = {}
  if (PLACEHOLDERS.has(readKey('ACCESS_CODE'))) updates.ACCESS_CODE = 'carshare-local'
  if (PLACEHOLDERS.has(readKey('SESSION_SECRET'))) updates.SESSION_SECRET = randomBytes(32).toString('hex')
  setKeys(updates)
}

function run(cmd: string): void {
  const result = spawnSync(cmd, { stdio: 'inherit', shell: true })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function migrateSeedAndStart(): void {
  run('npm run db:migrate')
  run('npm run db:seed')
  console.log(`\n==> Access code: ${readKey('ACCESS_CODE')}\n`)
  run('npm run dev')
}

const mode = process.argv[2]

if (mode === 'up') {
  fillSecrets()
  setKeys({ DATABASE_URL: LOCAL_DB_URL, NEON_LOCAL: '1' })
  run(`${COMPOSE} up -d --wait`)
  migrateSeedAndStart()
} else if (mode === 'up:neon') {
  fillSecrets()
  if (!readKey('DATABASE_URL').includes('neon.tech')) {
    console.error(`Set a Neon DATABASE_URL in ${ENV_FILE} first:`)
    console.error('  DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require')
    process.exit(1)
  }
  setKeys({ NEON_LOCAL: '0' })
  migrateSeedAndStart()
} else if (mode === 'down') {
  run(`${COMPOSE} down -v`)
} else {
  console.error('Usage: tsx scripts/dev.ts <up|up:neon|down>')
  process.exit(1)
}
