import type { NextConfig } from 'next'

const config: NextConfig = {
  // Pin the workspace root so ancestor lockfiles don't get misdetected.
  turbopack: {
    root: __dirname,
  },
}

export default config
