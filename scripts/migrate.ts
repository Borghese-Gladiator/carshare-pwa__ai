import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'node:fs';
import path from 'node:path';
import { applyNeonLocalConfig } from '../lib/db/neon-local';

neonConfig.webSocketConstructor = ws;
applyNeonLocalConfig();

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id         SERIAL      PRIMARY KEY,
        filename   TEXT        NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const { rows } = await client.query<{ filename: string }>(
      'SELECT filename FROM _migrations',
    );
    const applied = new Set(rows.map((r) => r.filename));

    const dir = path.join(process.cwd(), 'db', 'migrations');
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`skip  ${file}`);
        continue;
      }
      console.log(`apply ${file}`);
      const content = fs.readFileSync(path.join(dir, file), 'utf-8');
      await client.query(content);
      await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
    }
    console.log('Migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
