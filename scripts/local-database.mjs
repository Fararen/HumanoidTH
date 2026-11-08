import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { mkdir } from 'node:fs/promises';
await mkdir('scratch/platform-db', { recursive: true });
const db = await PGlite.create('scratch/platform-db');
const server = new PGLiteSocketServer({ db, host: '127.0.0.1', port: 5433, maxConnections: 32 });
await server.start();
console.log('Local demo PostgreSQL-compatible database listening on 127.0.0.1:5433');
async function shutdown() { await server.stop(); await db.close(); process.exit(0); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
