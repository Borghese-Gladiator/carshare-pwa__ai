import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { applyNeonLocalConfig } from '../lib/db/neon-local';

neonConfig.webSocketConstructor = ws;
applyNeonLocalConfig();

const G  = '00000000-0000-0000-0000-000000000001';
const U1 = '00000000-0000-0000-0000-000000000002';
const U2 = '00000000-0000-0000-0000-000000000003';
const C1 = '00000000-0000-0000-0000-000000000004';

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO groups (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
      [G, 'Default Group'],
    );
    await client.query(
      `INSERT INTO users (id, name, group_id) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
      [U1, 'Alice', G],
    );
    await client.query(
      `INSERT INTO users (id, name, group_id) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
      [U2, 'Bob', G],
    );
    await client.query(
      `INSERT INTO cars (id, group_id, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
      [C1, G, 'Shared Car'],
    );
    console.log('Seed complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
