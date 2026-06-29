import { neon, Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { applyNeonLocalConfig } from './neon-local';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

if (process.env.NEON_LOCAL === '1') {
  neonConfig.webSocketConstructor = ws;
}
applyNeonLocalConfig();

export const sql = neon(process.env.DATABASE_URL);

// HTTP `sql` runs each statement as its own request, so it cannot hold a
// transaction (and its locks) across calls. The Pool speaks the wire protocol
// over WebSocket, which is needed for the SERIALIZABLE check-then-insert that
// keeps concurrent unforced reservation creates race-safe.
let _pool: Pool | undefined;
export function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}
