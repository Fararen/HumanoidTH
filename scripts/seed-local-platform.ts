import { config } from "dotenv";
config({ path: ".env.local", override: true, quiet: true });
const url = new URL(process.env.DATABASE_URL!);
if (process.env.LOCAL_DEMO_MODE !== "1" || url.hostname !== "127.0.0.1" || url.port !== "5433") throw new Error("This script only seeds the isolated local demo database");
const { seedDemoData } = await import("./seed-demo-data");
await seedDemoData("Local");
