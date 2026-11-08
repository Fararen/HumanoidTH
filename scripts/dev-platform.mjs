import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { config } from 'dotenv';

async function portOpen(port) {
  return new Promise(resolve => {
    const socket = createConnection({ host: '127.0.0.1', port });
    socket.setTimeout(700);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => resolve(false));
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
  });
}
function run(args, env) {
  return new Promise((resolve,reject) => {
    const child=spawn(process.execPath,args,{stdio:'inherit',env});
    child.on('error',reject);child.on('exit',code=>code === 0 ? resolve() : reject(new Error(`Command failed (${code}): ${args[0]}`)));
  });
}
if (await portOpen(3000)) { console.log('Website already listening: http://127.0.0.1:3000'); process.exit(0); }
if (!existsSync('.env.local')) await run(['scripts/setup-local-platform.mjs'],process.env);
config({path:'.env.local',override:true,quiet:true});
const url=new URL(process.env.DATABASE_URL);
if (process.env.LOCAL_DEMO_MODE !== '1' || url.hostname !== '127.0.0.1' || url.port !== '5433') throw new Error('Configure .env.local for the isolated demo on 127.0.0.1:5433; original .env is preserved.');
const children=[];
function start(args) { const child=spawn(process.execPath,args,{stdio:'inherit',env:process.env});children.push(child);return child; }
let stopping=false;
function stop() { if(stopping)return;stopping=true;for(const child of children)child.kill(); }
process.on('SIGINT',stop);process.on('SIGTERM',stop);process.on('exit',stop);
try {
  if (!await portOpen(5433)) {
    start(['scripts/local-database.mjs']);
    for(let attempt=0;attempt<30&&!await portOpen(5433);attempt++) await new Promise(resolve=>setTimeout(resolve,500));
    if(!await portOpen(5433))throw new Error('Local database did not start.');
  }
  await run(['node_modules/prisma/build/index.js','db','push','--skip-generate'],{...process.env,DIRECT_DATABASE_URL:process.env.DATABASE_URL});
  await run(['--import','tsx','scripts/seed-local-platform.ts'],process.env);
  start(['--import','tsx','scripts/platform-worker.ts']);
  const web=start(['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','-p','3000']);
  console.log('Full local platform: http://127.0.0.1:3000 · role switcher: /demo');
  web.on('exit',code=>{stop();process.exitCode=code||0;});
} catch(error) { stop(); throw error; }
