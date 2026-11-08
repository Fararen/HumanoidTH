export const publicDemoSandboxEnabled =
  process.env.PUBLIC_DEMO_MODE === "1" &&
  process.env.DEMO_SANDBOX_MODE === "1" &&
  (process.env.NODE_ENV !== "production" || Boolean(process.env.PUBLIC_DEMO_PROJECT_ID && process.env.VERCEL_PROJECT_ID === process.env.PUBLIC_DEMO_PROJECT_ID));

export function publicDemoModeEnabled() {
  return publicDemoSandboxEnabled;
}
