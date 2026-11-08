import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, readFileSync } from "node:fs";
import { config, parse } from "dotenv";

config({ path: ".env.demo", override: true, quiet: true });

if (process.env.DEMO_SANDBOX_MODE !== "1" || !process.env.DATABASE_URL || process.env.NODE_ENV === "production") {
  throw new Error("Sandbox seeding requires .env.demo with DEMO_SANDBOX_MODE=1 and must run outside production.");
}

const sandboxUrl = new URL(process.env.DATABASE_URL);
if (existsSync(".env")) {
  const productionUrl = parse(readFileSync(".env")).DATABASE_URL;
  const productionDirectUrl = parse(readFileSync(".env")).DIRECT_DATABASE_URL;
  const productionUrls = [productionUrl, productionDirectUrl].filter((value): value is string => Boolean(value)).map(value => new URL(value));
  const sandboxUrls = [sandboxUrl, ...(process.env.DIRECT_DATABASE_URL ? [new URL(process.env.DIRECT_DATABASE_URL)] : [])];
  const sameDatabase = sandboxUrls.some(sandbox => productionUrls.some(production =>
    production.hostname === sandbox.hostname &&
    (production.port || "5432") === (sandbox.port || "5432") &&
    production.pathname === sandbox.pathname
  ));
  if (sameDatabase) {
    throw new Error("Refusing to seed: .env.demo points to the same PostgreSQL database as .env.");
  }
}

await promisify(execFile)(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
  env: process.env,
  maxBuffer: 1024 * 1024
});

const { seedDemoData } = await import("./seed-demo-data");
await seedDemoData("Sandbox");
