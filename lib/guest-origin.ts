export function isSameOrigin(origin: string | null, host: string | null) {
  if (!origin || !host) return false;
  try {
    const url = new URL(origin);
    return (url.protocol === "https:" || url.protocol === "http:") && url.host === host && url.origin === origin;
  } catch {
    return false;
  }
}
