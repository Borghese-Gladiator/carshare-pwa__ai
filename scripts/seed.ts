import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { applyNeonLocalConfig } from '../lib/db/neon-local';
import { GROUP_ID, CAR_ID, JON_ID, TIMMY_ID } from '../lib/users';

neonConfig.webSocketConstructor = ws;
applyNeonLocalConfig();

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO groups (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
      [GROUP_ID, 'Default Group'],
    );
    await client.query(
      `INSERT INTO users (id, name, group_id) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [JON_ID, 'Jon', GROUP_ID],
    );
    await client.query(
      `INSERT INTO users (id, name, group_id) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [TIMMY_ID, 'Timmy', GROUP_ID],
    );
    await client.query(
      `INSERT INTO cars (id, group_id, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
      [CAR_ID, GROUP_ID, 'Shared Car'],
    );
    console.log('Seed complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
