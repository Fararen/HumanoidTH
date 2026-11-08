import { existsSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
if (existsSync('.env.local')) throw new Error('.env.local already exists; preserve it and configure the local demo manually.');
writeFileSync('.env.local', [
  'DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/postgres?sslmode=disable"',
  `SESSION_SECRET="${randomBytes(48).toString('hex')}"`,
  'LOCAL_DEMO_MODE="1"',
  'PRISMA_LOG_LEVEL="silent"',
  ''
].join('\n'), { mode: 0o600 });
console.log('Created .env.local for the isolated local demo. Original .env preserved.');
