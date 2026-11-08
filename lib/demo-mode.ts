export const publicDemoSandboxEnabled =
  process.env.PUBLIC_DEMO_MODE === "1" &&
  process.env.DEMO_SANDBOX_MODE === "1" &&
  (process.env.NODE_ENV !== "production" || Boolean(process.env.PUBLIC_DEMO_PROJECT_ID && process.env.VERCEL_PROJECT_ID === process.env.PUBLIC_DEMO_PROJECT_ID));

export function temporaryProductionDemoEnabled() {
  const expiresAt = Date.parse(process.env.PUBLIC_DEMO_EXPIRES_AT || "");
  return process.env.PUBLIC_DEMO_MODE === "1" &&
    process.env.TEMPORARY_PRODUCTION_DEMO === "1" &&
    process.env.VERCEL_PROJECT_ID === "prj_J8IsY1tKUMKBqqZk04la86ybUYUY" &&
    Number.isFinite(expiresAt) &&
    expiresAt > Date.now();
}

export function publicDemoModeEnabled() {
  return publicDemoSandboxEnabled || temporaryProductionDemoEnabled();
}
