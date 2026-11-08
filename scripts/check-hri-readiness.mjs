import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
import pg from "pg";
import { execFileSync } from "node:child_process";

const report = {
  checkedAt: new Date().toISOString(),
  checkout: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  database: { configured: Boolean(process.env.DATABASE_URL), reachable: false, robotCount: null, runCount: null, exampleRobot: null, errorCode: null }
};
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000, query_timeout: 5000 });
try {
  if (!process.env.DATABASE_URL) throw Object.assign(new Error(), { code: "DATABASE_URL_MISSING" });
  await client.connect();
  await client.query("BEGIN READ ONLY");
  const robots = await client.query('SELECT count(*)::int AS count FROM "RobotModel"');
  const runs = await client.query('SELECT count(*)::int AS count FROM "HriSimulationRun"');
  const example = await client.query('SELECT id, "canonicalName" FROM "RobotModel" ORDER BY "updatedAt" DESC LIMIT 1');
  await client.query("ROLLBACK");
  Object.assign(report.database, { reachable: true, robotCount: robots.rows[0].count, runCount: runs.rows[0].count, exampleRobot: example.rows[0] || null });
} catch (error) {
  // Never print connection strings, credentials, or provider error messages.
  report.database.errorCode = typeof error.code === "string" ? error.code : "DATABASE_UNAVAILABLE";
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
console.log(JSON.stringify(report, null, 2));
