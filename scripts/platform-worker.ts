import { config } from "dotenv";
config({ path: ".env.local", override: true, quiet: true });
const { processNextRun } = await import("../lib/platform-store");
console.log("Simulator queue worker ready");
let stopping = false;
process.on("SIGTERM", () => { stopping = true; });
process.on("SIGINT", () => { stopping = true; });
while (!stopping) {
  try { if (await processNextRun()) continue; } catch { console.error("Simulator queue temporarily unavailable; retrying"); }
  await new Promise(resolve => setTimeout(resolve, 1000));
}
