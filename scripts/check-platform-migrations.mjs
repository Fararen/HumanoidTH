import { config } from 'dotenv';
import pg from 'pg';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
config({path:'.env.local',override:true,quiet:true});
const databaseUrl=new URL(process.env.DATABASE_URL);
if(process.env.LOCAL_DEMO_MODE!=='1'||databaseUrl.hostname!=='127.0.0.1'||databaseUrl.port!=='5433')throw new Error('Migration check only runs in the isolated local demo database.');
const schema=`migration_check_${Date.now()}`;
if(!/^migration_check_\d+$/.test(schema))throw new Error('Invalid temporary schema');
const client=new pg.Client({connectionString:databaseUrl.toString()});await client.connect();
try {
  await client.query(`CREATE SCHEMA "${schema}"`);
  databaseUrl.searchParams.set('schema',schema);
  const result=await promisify(execFile)(process.execPath,['node_modules/prisma/build/index.js','migrate','deploy'],{env:{...process.env,DATABASE_URL:databaseUrl.toString(),DIRECT_DATABASE_URL:databaseUrl.toString()},maxBuffer:1024*1024});
  console.log(result.stdout);
  const columns=await client.query('SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2',[schema,'PlatformRecord']);
  if(!columns.rows.some(row=>row.column_name==='uniqueKey'))throw new Error('Platform workflow migration did not create the expected schema');
  console.log('Fresh-database migration chain verified in an isolated temporary schema.');
} finally {
  await client.query(`DROP SCHEMA "${schema}" CASCADE`);
  await client.end();
}
