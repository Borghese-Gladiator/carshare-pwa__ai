import { neonConfig } from '@neondatabase/serverless';

export function applyNeonLocalConfig(): void {
  if (process.env.NEON_LOCAL !== '1') return;

  const host = process.env.NEON_LOCAL_HOST ?? 'localhost';
  const port = process.env.NEON_LOCAL_WS_PORT ?? '4444';

  neonConfig.fetchEndpoint = (h, p) => `http://${h}:${port}/sql`;
  neonConfig.wsProxy = (h) => `${host}:${port}/v2`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.pipelineConnect = false;
  neonConfig.poolQueryViaFetch = false;
}
