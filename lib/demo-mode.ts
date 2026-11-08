export const publicDemoSandboxEnabled =
  process.env.PUBLIC_DEMO_MODE === "1" &&
  process.env.DEMO_SANDBOX_MODE === "1" &&
  (process.env.NODE_ENV !== "production" || process.env.VERCEL_PROJECT_NAME === "humanoid-th-demo");
